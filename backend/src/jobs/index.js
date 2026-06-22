/**
 * Background Jobs (Bull Queue)
 */

const Queue = require('bull');
const logger = require('../utils/logger');

// Redis connection
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
};

// When REDIS_MOCK=true, back Bull with an in-memory Redis so no Redis server is required.
let queueOptions = { redis: redisConfig };
if (process.env.REDIS_MOCK === 'true') {
  const RedisMock = require('ioredis-mock');
  const client = new RedisMock();
  const subscriber = new RedisMock();
  queueOptions = {
    createClient: (type) => {
      switch (type) {
        case 'client':
          return client;
        case 'subscriber':
          return subscriber;
        default:
          return new RedisMock();
      }
    },
  };
}

// Create queues
const emailQueue = new Queue('email', queueOptions);
const notificationQueue = new Queue('notification', queueOptions);
const reportQueue = new Queue('report', queueOptions);
const settlementQueue = new Queue('settlement', queueOptions);
const cleanupQueue = new Queue('cleanup', queueOptions);

/**
 * Email Queue Processor
 */
emailQueue.process(async (job) => {
  const { to, subject, template, data } = job.data;

  try {
    // TODO: Implement email sending logic
    // await sendEmail({ to, subject, template, data });
    logger.info('Email sent', { to, subject, jobId: job.id });
    return { success: true };
  } catch (error) {
    logger.error('Email job failed', { error: error.message, jobId: job.id });
    throw error;
  }
});

/**
 * Notification Queue Processor
 */
notificationQueue.process(async (job) => {
  const { userId, type, title, body, data } = job.data;

  try {
    const { Notification } = require('../models');

    // Create notification record
    await Notification.create({
      userId,
      type,
      title,
      body,
      data,
      isRead: false,
    });

    // TODO: Send push notification if enabled
    // await sendPushNotification(userId, { title, body, data });

    logger.info('Notification created', { userId, type, jobId: job.id });
    return { success: true };
  } catch (error) {
    logger.error('Notification job failed', { error: error.message, jobId: job.id });
    throw error;
  }
});

/**
 * Report Queue Processor
 */
reportQueue.process(async (job) => {
  const { reportType, params, userId, format } = job.data;

  try {
    let report;

    switch (reportType) {
      case 'sessions':
        report = await generateSessionsReport(params, format);
        break;
      case 'revenue':
        report = await generateRevenueReport(params, format);
        break;
      case 'energy':
        report = await generateEnergyReport(params, format);
        break;
      default:
        throw new Error(`Unknown report type: ${reportType}`);
    }

    // Store report or send via email
    // await storeReport(userId, reportType, report);

    logger.info('Report generated', { reportType, userId, jobId: job.id });
    return { success: true, report };
  } catch (error) {
    logger.error('Report job failed', { error: error.message, jobId: job.id });
    throw error;
  }
});

/**
 * Settlement Queue Processor
 */
settlementQueue.process(async (job) => {
  const { partnerId, startDate, endDate } = job.data;

  try {
    const { Transaction, Partner, PartnerWallet } = require('../models');
    const { Op } = require('sequelize');
    const sequelize = require('../config/database');

    const t = await sequelize.transaction();

    // Calculate settlement amount
    const transactions = await Transaction.findAll({
      where: {
        partnerId,
        type: 'session_payment',
        status: 'completed',
        createdAt: { [Op.between]: [new Date(startDate), new Date(endDate)] },
        isSettled: false,
      },
      transaction: t,
    });

    if (transactions.length === 0) {
      await t.rollback();
      return { success: true, message: 'No transactions to settle' };
    }

    const totalAmount = transactions.reduce((sum, tx) => sum + tx.amount, 0);

    const partner = await Partner.findByPk(partnerId, { transaction: t });
    const commissionRate = partner?.commissionRate || 10;
    const commission = totalAmount * (commissionRate / 100);
    const settlementAmount = totalAmount - commission;

    // Update partner wallet
    const wallet = await PartnerWallet.findOne({
      where: { partnerId },
      transaction: t,
      lock: true,
    });

    if (wallet) {
      await wallet.update({
        balance: wallet.balance + settlementAmount,
        pendingSettlement: Math.max(0, wallet.pendingSettlement - settlementAmount),
      }, { transaction: t });
    }

    // Mark transactions as settled
    await Transaction.update(
      { isSettled: true, settledAt: new Date() },
      {
        where: { id: { [Op.in]: transactions.map(t => t.id) } },
        transaction: t,
      }
    );

    await t.commit();

    logger.info('Settlement completed', { partnerId, settlementAmount, jobId: job.id });
    return { success: true, settlementAmount, transactionCount: transactions.length };
  } catch (error) {
    logger.error('Settlement job failed', { error: error.message, jobId: job.id });
    throw error;
  }
});

/**
 * Cleanup Queue Processor
 */
cleanupQueue.process(async (job) => {
  const { task } = job.data;

  try {
    const { Op } = require('sequelize');

    switch (task) {
      case 'expired_sessions':
        // Mark sessions as expired if running too long (24+ hours)
        const { Session } = require('../models');
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        await Session.update(
          { status: 'expired' },
          {
            where: {
              status: 'active',
              startTime: { [Op.lt]: twentyFourHoursAgo },
            },
          }
        );
        break;

      case 'old_logs':
        // Delete OCPP logs older than 30 days
        const { OcppLog } = require('../models');
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        await OcppLog.destroy({
          where: { createdAt: { [Op.lt]: thirtyDaysAgo } },
        });
        break;

      case 'expired_reservations':
        // Expire old reservations
        const { Reservation } = require('../models');

        await Reservation.update(
          { status: 'expired' },
          {
            where: {
              status: { [Op.in]: ['pending', 'confirmed'] },
              endTime: { [Op.lt]: new Date() },
            },
          }
        );
        break;
    }

    logger.info('Cleanup completed', { task, jobId: job.id });
    return { success: true };
  } catch (error) {
    logger.error('Cleanup job failed', { error: error.message, jobId: job.id });
    throw error;
  }
});

/**
 * Schedule recurring jobs
 */
function scheduleRecurringJobs() {
  // Cleanup expired sessions every hour
  cleanupQueue.add({ task: 'expired_sessions' }, { repeat: { cron: '0 * * * *' } });

  // Cleanup old logs daily at midnight
  cleanupQueue.add({ task: 'old_logs' }, { repeat: { cron: '0 0 * * *' } });

  // Expire old reservations every 15 minutes
  cleanupQueue.add({ task: 'expired_reservations' }, { repeat: { cron: '*/15 * * * *' } });

  logger.info('Recurring jobs scheduled');
}

/**
 * Queue event handlers
 */
[emailQueue, notificationQueue, reportQueue, settlementQueue, cleanupQueue].forEach((queue) => {
  queue.on('completed', (job) => {
    logger.debug(`Job ${job.id} completed`, { queue: queue.name });
  });

  queue.on('failed', (job, error) => {
    logger.error(`Job ${job.id} failed`, { queue: queue.name, error: error.message });
  });
});

// Helper functions for report generation
async function generateSessionsReport(params, format) {
  // Implementation would go here
  return { type: 'sessions', params, format };
}

async function generateRevenueReport(params, format) {
  return { type: 'revenue', params, format };
}

async function generateEnergyReport(params, format) {
  return { type: 'energy', params, format };
}

module.exports = {
  emailQueue,
  notificationQueue,
  reportQueue,
  settlementQueue,
  cleanupQueue,
  scheduleRecurringJobs,
};
