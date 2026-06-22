/**
 * Report Controller
 */

const {
  Session,
  Transaction,
  ChargingStation,
  EvDriver,
  Partner
} = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const logger = require('../utils/logger');

/**
 * Generate sessions report
 */
exports.sessions = async (req, res) => {
  try {
    const { startDate, endDate, partnerId, stationId, format = 'json' } = req.query;

    const where = {};
    if (startDate && endDate) {
      where.startTime = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    if (stationId) {
      where.stationId = stationId;
    }

    const stationWhere = {};
    if (req.partnerScope) {
      stationWhere.partnerId = req.partnerScope;
    } else if (partnerId) {
      stationWhere.partnerId = partnerId;
    }

    const sessions = await Session.findAll({
      where,
      include: [
        {
          model: ChargingStation,
          as: 'station',
          where: Object.keys(stationWhere).length > 0 ? stationWhere : undefined,
          attributes: ['id', 'name'],
          include: [{ association: 'location', attributes: ['name', 'city'] }],
        },
        { model: EvDriver, as: 'driver', attributes: ['id', 'name', 'phone'] },
      ],
      order: [['startTime', 'DESC']],
    });

    // Calculate summary
    const summary = {
      totalSessions: sessions.length,
      totalEnergy: sessions.reduce((sum, s) => sum + (s.energyDelivered || 0), 0),
      totalRevenue: sessions.reduce((sum, s) => sum + (s.totalCost || 0), 0),
      totalDuration: sessions.reduce((sum, s) => sum + (s.duration || 0), 0),
      avgSessionDuration: sessions.length > 0
        ? sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / sessions.length
        : 0,
      avgEnergyPerSession: sessions.length > 0
        ? sessions.reduce((sum, s) => sum + (s.energyDelivered || 0), 0) / sessions.length
        : 0,
    };

    if (format === 'csv') {
      const csv = generateSessionsCSV(sessions);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=sessions-report.csv');
      return res.send(csv);
    }

    res.json({ sessions, summary });

  } catch (error) {
    logger.error('Sessions report error', { error: error.message });
    res.status(500).json({ error: 'Failed to generate report' });
  }
};

/**
 * Generate revenue report
 */
exports.revenue = async (req, res) => {
  try {
    const { startDate, endDate, partnerId, groupBy = 'day' } = req.query;

    const where = {};
    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    if (req.partnerScope) {
      where.partnerId = req.partnerScope;
    } else if (partnerId) {
      where.partnerId = partnerId;
    }

    where.status = 'completed';

    // Group by date
    let dateFormat;
    switch (groupBy) {
      case 'hour':
        dateFormat = '%Y-%m-%d %H:00';
        break;
      case 'month':
        dateFormat = '%Y-%m';
        break;
      case 'year':
        dateFormat = '%Y';
        break;
      default:
        dateFormat = '%Y-%m-%d';
    }

    const revenue = await Transaction.findAll({
      where,
      attributes: [
        [sequelize.fn('to_char', sequelize.col('createdAt'), dateFormat), 'period'],
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalAmount'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'transactionCount'],
      ],
      group: [sequelize.fn('to_char', sequelize.col('createdAt'), dateFormat)],
      order: [[sequelize.fn('to_char', sequelize.col('createdAt'), dateFormat), 'ASC']],
      raw: true,
    });

    // Total summary
    const totals = await Transaction.findOne({
      where,
      attributes: [
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalRevenue'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalTransactions'],
        [sequelize.fn('AVG', sequelize.col('amount')), 'avgTransactionAmount'],
      ],
      raw: true,
    });

    res.json({
      data: revenue,
      summary: {
        totalRevenue: parseFloat(totals?.totalRevenue || 0).toFixed(2),
        totalTransactions: parseInt(totals?.totalTransactions || 0),
        avgTransactionAmount: parseFloat(totals?.avgTransactionAmount || 0).toFixed(2),
      },
    });

  } catch (error) {
    logger.error('Revenue report error', { error: error.message });
    res.status(500).json({ error: 'Failed to generate report' });
  }
};

/**
 * Generate energy report
 */
exports.energy = async (req, res) => {
  try {
    const { startDate, endDate, partnerId, stationId, groupBy = 'day' } = req.query;

    const where = { status: 'completed' };
    if (startDate && endDate) {
      where.startTime = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    if (stationId) {
      where.stationId = stationId;
    }

    let dateFormat;
    switch (groupBy) {
      case 'hour':
        dateFormat = '%Y-%m-%d %H:00';
        break;
      case 'month':
        dateFormat = '%Y-%m';
        break;
      default:
        dateFormat = '%Y-%m-%d';
    }

    const stationWhere = {};
    if (req.partnerScope) {
      stationWhere.partnerId = req.partnerScope;
    } else if (partnerId) {
      stationWhere.partnerId = partnerId;
    }

    const energy = await Session.findAll({
      where,
      attributes: [
        [sequelize.fn('to_char', sequelize.col('Session.startTime'), dateFormat), 'period'],
        [sequelize.fn('SUM', sequelize.col('energyDelivered')), 'totalEnergy'],
        [sequelize.fn('COUNT', sequelize.col('Session.id')), 'sessionCount'],
      ],
      include: [
        {
          model: ChargingStation,
          as: 'station',
          where: Object.keys(stationWhere).length > 0 ? stationWhere : undefined,
          attributes: [],
        },
      ],
      group: [sequelize.fn('to_char', sequelize.col('Session.startTime'), dateFormat)],
      order: [[sequelize.fn('to_char', sequelize.col('Session.startTime'), dateFormat), 'ASC']],
      raw: true,
    });

    // Totals
    const totals = await Session.findOne({
      where,
      attributes: [
        [sequelize.fn('SUM', sequelize.col('energyDelivered')), 'totalEnergy'],
        [sequelize.fn('COUNT', sequelize.col('Session.id')), 'totalSessions'],
        [sequelize.fn('AVG', sequelize.col('energyDelivered')), 'avgEnergy'],
      ],
      include: [
        {
          model: ChargingStation,
          as: 'station',
          where: Object.keys(stationWhere).length > 0 ? stationWhere : undefined,
          attributes: [],
        },
      ],
      raw: true,
    });

    res.json({
      data: energy,
      summary: {
        totalEnergy: parseFloat(totals?.totalEnergy || 0).toFixed(2),
        totalSessions: parseInt(totals?.totalSessions || 0),
        avgEnergyPerSession: parseFloat(totals?.avgEnergy || 0).toFixed(2),
      },
    });

  } catch (error) {
    logger.error('Energy report error', { error: error.message });
    res.status(500).json({ error: 'Failed to generate report' });
  }
};

/**
 * Generate station utilization report
 */
exports.utilization = async (req, res) => {
  try {
    const { startDate, endDate, partnerId } = req.query;

    const where = { status: 'completed' };
    if (startDate && endDate) {
      where.startTime = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    const stationWhere = {};
    if (req.partnerScope) {
      stationWhere.partnerId = req.partnerScope;
    } else if (partnerId) {
      stationWhere.partnerId = partnerId;
    }

    const utilization = await Session.findAll({
      where,
      attributes: [
        'stationId',
        [sequelize.fn('COUNT', sequelize.col('Session.id')), 'sessionCount'],
        [sequelize.fn('SUM', sequelize.col('duration')), 'totalDuration'],
        [sequelize.fn('SUM', sequelize.col('energyDelivered')), 'totalEnergy'],
        [sequelize.fn('SUM', sequelize.col('totalCost')), 'totalRevenue'],
      ],
      include: [
        {
          model: ChargingStation,
          as: 'station',
          where: Object.keys(stationWhere).length > 0 ? stationWhere : undefined,
          attributes: ['id', 'name'],
          include: [{ association: 'location', attributes: ['name', 'city'] }],
        },
      ],
      group: ['Session.stationId', 'station.id', 'station->location.id'],
      order: [[sequelize.fn('COUNT', sequelize.col('Session.id')), 'DESC']],
      raw: false,
    });

    res.json({ utilization });

  } catch (error) {
    logger.error('Utilization report error', { error: error.message });
    res.status(500).json({ error: 'Failed to generate report' });
  }
};

/**
 * Generate driver activity report
 */
exports.driverActivity = async (req, res) => {
  try {
    const { startDate, endDate, partnerId, limit = 50 } = req.query;

    const where = { status: 'completed' };
    if (startDate && endDate) {
      where.startTime = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    const stationWhere = {};
    if (req.partnerScope) {
      stationWhere.partnerId = req.partnerScope;
    } else if (partnerId) {
      stationWhere.partnerId = partnerId;
    }

    const activity = await Session.findAll({
      where,
      attributes: [
        'driverId',
        [sequelize.fn('COUNT', sequelize.col('Session.id')), 'sessionCount'],
        [sequelize.fn('SUM', sequelize.col('energyDelivered')), 'totalEnergy'],
        [sequelize.fn('SUM', sequelize.col('totalCost')), 'totalSpent'],
      ],
      include: [
        {
          model: EvDriver,
          as: 'driver',
          attributes: ['id', 'name', 'email', 'phone'],
        },
        {
          model: ChargingStation,
          as: 'station',
          where: Object.keys(stationWhere).length > 0 ? stationWhere : undefined,
          attributes: [],
        },
      ],
      group: ['Session.driverId', 'driver.id'],
      order: [[sequelize.fn('SUM', sequelize.col('totalCost')), 'DESC']],
      limit: parseInt(limit),
      raw: false,
    });

    res.json({ activity });

  } catch (error) {
    logger.error('Driver activity report error', { error: error.message });
    res.status(500).json({ error: 'Failed to generate report' });
  }
};

/**
 * Generate partner settlement report
 */
exports.settlement = async (req, res) => {
  try {
    const { startDate, endDate, partnerId } = req.query;

    const where = { status: 'completed', type: 'session_payment' };
    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    if (req.partnerScope) {
      where.partnerId = req.partnerScope;
    } else if (partnerId) {
      where.partnerId = partnerId;
    }

    const settlements = await Transaction.findAll({
      where,
      attributes: [
        'partnerId',
        [sequelize.fn('SUM', sequelize.col('amount')), 'totalRevenue'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'transactionCount'],
      ],
      include: [
        {
          model: Partner,
          as: 'partner',
          attributes: ['id', 'name', 'commissionRate'],
        },
      ],
      group: ['Transaction.partnerId', 'partner.id'],
      raw: false,
    });

    // Calculate settlement amounts
    const settlementData = settlements.map(s => {
      const totalRevenue = parseFloat(s.dataValues.totalRevenue || 0);
      const commissionRate = s.partner?.commissionRate || 10;
      const commission = totalRevenue * (commissionRate / 100);
      const settlementAmount = totalRevenue - commission;

      return {
        partnerId: s.partnerId,
        partnerName: s.partner?.name,
        totalRevenue: totalRevenue.toFixed(2),
        commissionRate,
        commission: commission.toFixed(2),
        settlementAmount: settlementAmount.toFixed(2),
        transactionCount: parseInt(s.dataValues.transactionCount || 0),
      };
    });

    res.json({ settlements: settlementData });

  } catch (error) {
    logger.error('Settlement report error', { error: error.message });
    res.status(500).json({ error: 'Failed to generate report' });
  }
};

/**
 * Generate CSV for sessions
 */
function generateSessionsCSV(sessions) {
  const headers = [
    'Session ID',
    'Station',
    'Location',
    'Driver',
    'Start Time',
    'End Time',
    'Duration (min)',
    'Energy (kWh)',
    'Cost',
    'Status',
  ];

  const rows = sessions.map(s => [
    s.id,
    s.station?.name || '',
    s.station?.location?.name || '',
    s.driver?.name || '',
    s.startTime?.toISOString() || '',
    s.endTime?.toISOString() || '',
    s.duration || 0,
    s.energyDelivered?.toFixed(2) || 0,
    s.totalCost?.toFixed(2) || 0,
    s.status,
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}
