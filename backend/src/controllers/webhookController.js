/**
 * Webhook Controller
 */

const crypto = require('crypto');
const {
  Transaction,
  WalletTransaction,
  DriverWallet,
  Session,
  AuditLog
} = require('../models');
const sequelize = require('../config/database');
const logger = require('../utils/logger');

/**
 * Handle Razorpay webhook
 */
exports.razorpay = async (req, res) => {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // Verify signature
    const signature = req.headers['x-razorpay-signature'];
    const body = req.body;

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(typeof body === 'string' ? body : JSON.stringify(body))
      .digest('hex');

    if (signature !== expectedSignature) {
      logger.warn('Invalid Razorpay webhook signature');
      return res.status(400).json({ error: 'Invalid signature' });
    }

    const payload = typeof body === 'string' ? JSON.parse(body) : body;
    const event = payload.event;

    logger.info('Razorpay webhook received', { event, paymentId: payload.payload?.payment?.entity?.id });

    switch (event) {
      case 'payment.captured':
        await handlePaymentCaptured(payload.payload.payment.entity);
        break;

      case 'payment.failed':
        await handlePaymentFailed(payload.payload.payment.entity);
        break;

      case 'refund.created':
        await handleRefundCreated(payload.payload.refund.entity);
        break;

      case 'refund.processed':
        await handleRefundProcessed(payload.payload.refund.entity);
        break;

      case 'order.paid':
        await handleOrderPaid(payload.payload.order.entity);
        break;

      default:
        logger.debug('Unhandled Razorpay event', { event });
    }

    res.json({ status: 'ok' });

  } catch (error) {
    logger.error('Razorpay webhook error', { error: error.message });
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

/**
 * Handle payment captured
 */
async function handlePaymentCaptured(payment) {
  const t = await sequelize.transaction();

  try {
    const { id: paymentId, order_id: orderId, amount, notes } = payment;

    // Find transaction by order ID
    const transaction = await Transaction.findOne({
      where: { razorpayOrderId: orderId },
      transaction: t,
    });

    if (!transaction) {
      logger.warn('Transaction not found for payment', { orderId, paymentId });
      await t.rollback();
      return;
    }

    // Update transaction
    await transaction.update({
      razorpayPaymentId: paymentId,
      status: 'completed',
      paidAt: new Date(),
    }, { transaction: t });

    // If this is a wallet top-up, credit the wallet
    if (transaction.type === 'wallet_topup' && transaction.driverId) {
      const wallet = await DriverWallet.findOne({
        where: { driverId: transaction.driverId },
        transaction: t,
        lock: true,
      });

      if (wallet) {
        const amountInRupees = amount / 100; // Razorpay sends amount in paise
        const newBalance = wallet.balance + amountInRupees;

        await wallet.update({
          balance: newBalance,
          lastTransactionAt: new Date(),
        }, { transaction: t });

        // Create wallet transaction
        await WalletTransaction.create({
          walletId: wallet.id,
          type: 'credit',
          amount: amountInRupees,
          balanceAfter: newBalance,
          description: 'Wallet top-up via Razorpay',
          referenceType: 'payment',
          referenceId: paymentId,
        }, { transaction: t });

        logger.info('Wallet credited', { driverId: transaction.driverId, amount: amountInRupees, newBalance });
      }
    }

    await t.commit();

    logger.info('Payment captured', { paymentId, orderId, amount: amount / 100 });

  } catch (error) {
    await t.rollback();
    logger.error('Handle payment captured error', { error: error.message });
    throw error;
  }
}

/**
 * Handle payment failed
 */
async function handlePaymentFailed(payment) {
  try {
    const { id: paymentId, order_id: orderId, error_code, error_description } = payment;

    const transaction = await Transaction.findOne({
      where: { razorpayOrderId: orderId },
    });

    if (transaction) {
      await transaction.update({
        razorpayPaymentId: paymentId,
        status: 'failed',
        failureReason: `${error_code}: ${error_description}`,
      });
    }

    logger.info('Payment failed', { paymentId, orderId, errorCode: error_code });

  } catch (error) {
    logger.error('Handle payment failed error', { error: error.message });
    throw error;
  }
}

/**
 * Handle refund created
 */
async function handleRefundCreated(refund) {
  try {
    const { id: refundId, payment_id: paymentId, amount, status } = refund;

    // Find original transaction
    const transaction = await Transaction.findOne({
      where: { razorpayPaymentId: paymentId },
    });

    if (transaction) {
      // Create refund record
      const { Refund } = require('../models');
      await Refund.create({
        transactionId: transaction.id,
        razorpayRefundId: refundId,
        amount: amount / 100,
        status: 'pending',
        reason: 'Webhook initiated',
      });
    }

    logger.info('Refund created', { refundId, paymentId, amount: amount / 100 });

  } catch (error) {
    logger.error('Handle refund created error', { error: error.message });
    throw error;
  }
}

/**
 * Handle refund processed
 */
async function handleRefundProcessed(refund) {
  const t = await sequelize.transaction();

  try {
    const { id: refundId, payment_id: paymentId, amount } = refund;

    // Find refund record
    const { Refund } = require('../models');
    const refundRecord = await Refund.findOne({
      where: { razorpayRefundId: refundId },
      include: [{ association: 'transaction' }],
      transaction: t,
    });

    if (refundRecord) {
      await refundRecord.update({
        status: 'completed',
        processedAt: new Date(),
      }, { transaction: t });

      // If original transaction was wallet topup, deduct from wallet
      if (refundRecord.transaction?.type === 'wallet_topup') {
        const wallet = await DriverWallet.findOne({
          where: { driverId: refundRecord.transaction.driverId },
          transaction: t,
          lock: true,
        });

        if (wallet) {
          const amountInRupees = amount / 100;
          const newBalance = wallet.balance - amountInRupees;

          await wallet.update({
            balance: Math.max(0, newBalance),
            lastTransactionAt: new Date(),
          }, { transaction: t });

          await WalletTransaction.create({
            walletId: wallet.id,
            type: 'debit',
            amount: amountInRupees,
            balanceAfter: Math.max(0, newBalance),
            description: 'Refund processed',
            referenceType: 'refund',
            referenceId: refundId,
          }, { transaction: t });
        }
      }
    }

    await t.commit();

    logger.info('Refund processed', { refundId, paymentId, amount: amount / 100 });

  } catch (error) {
    await t.rollback();
    logger.error('Handle refund processed error', { error: error.message });
    throw error;
  }
}

/**
 * Handle order paid
 */
async function handleOrderPaid(order) {
  try {
    const { id: orderId, amount_paid: amountPaid, status } = order;

    // Update transaction status
    const transaction = await Transaction.findOne({
      where: { razorpayOrderId: orderId },
    });

    if (transaction && transaction.status !== 'completed') {
      await transaction.update({
        status: 'completed',
        paidAt: new Date(),
      });
    }

    logger.info('Order paid', { orderId, amountPaid: amountPaid / 100 });

  } catch (error) {
    logger.error('Handle order paid error', { error: error.message });
    throw error;
  }
}
