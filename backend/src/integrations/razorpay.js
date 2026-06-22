/**
 * Razorpay Integration
 */

const Razorpay = require('razorpay');
const crypto = require('crypto');
const logger = require('../utils/logger');

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Create an order
 */
async function createOrder(amount, currency = 'INR', receipt, notes = {}) {
  try {
    const options = {
      amount: Math.round(amount * 100), // Convert to paise
      currency,
      receipt,
      notes,
    };

    const order = await razorpay.orders.create(options);

    logger.info('Razorpay order created', { orderId: order.id, amount, receipt });

    return {
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      status: order.status,
    };

  } catch (error) {
    logger.error('Create Razorpay order error', { error: error.message });
    throw error;
  }
}

/**
 * Verify payment signature
 */
function verifyPaymentSignature(orderId, paymentId, signature) {
  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  return expectedSignature === signature;
}

/**
 * Capture a payment
 */
async function capturePayment(paymentId, amount, currency = 'INR') {
  try {
    const payment = await razorpay.payments.capture(paymentId, Math.round(amount * 100), currency);

    logger.info('Payment captured', { paymentId, amount });

    return payment;

  } catch (error) {
    logger.error('Capture payment error', { error: error.message, paymentId });
    throw error;
  }
}

/**
 * Fetch payment details
 */
async function fetchPayment(paymentId) {
  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return payment;
  } catch (error) {
    logger.error('Fetch payment error', { error: error.message, paymentId });
    throw error;
  }
}

/**
 * Create a refund
 */
async function createRefund(paymentId, amount, notes = {}) {
  try {
    const refund = await razorpay.payments.refund(paymentId, {
      amount: Math.round(amount * 100),
      notes,
    });

    logger.info('Refund created', { paymentId, refundId: refund.id, amount });

    return {
      id: refund.id,
      paymentId: refund.payment_id,
      amount: refund.amount / 100,
      status: refund.status,
    };

  } catch (error) {
    logger.error('Create refund error', { error: error.message, paymentId });
    throw error;
  }
}

/**
 * Fetch refund details
 */
async function fetchRefund(paymentId, refundId) {
  try {
    const refund = await razorpay.payments.fetchRefund(paymentId, refundId);
    return refund;
  } catch (error) {
    logger.error('Fetch refund error', { error: error.message, refundId });
    throw error;
  }
}

/**
 * Create a customer
 */
async function createCustomer(name, email, contact, notes = {}) {
  try {
    const customer = await razorpay.customers.create({
      name,
      email,
      contact,
      notes,
    });

    logger.info('Customer created', { customerId: customer.id, email });

    return customer;

  } catch (error) {
    logger.error('Create customer error', { error: error.message, email });
    throw error;
  }
}

/**
 * Fetch order details
 */
async function fetchOrder(orderId) {
  try {
    const order = await razorpay.orders.fetch(orderId);
    return order;
  } catch (error) {
    logger.error('Fetch order error', { error: error.message, orderId });
    throw error;
  }
}

/**
 * Fetch payments for an order
 */
async function fetchOrderPayments(orderId) {
  try {
    const payments = await razorpay.orders.fetchPayments(orderId);
    return payments;
  } catch (error) {
    logger.error('Fetch order payments error', { error: error.message, orderId });
    throw error;
  }
}

module.exports = {
  razorpay,
  createOrder,
  verifyPaymentSignature,
  capturePayment,
  fetchPayment,
  createRefund,
  fetchRefund,
  createCustomer,
  fetchOrder,
  fetchOrderPayments,
};
