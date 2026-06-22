/**
 * Webhook Routes
 */

const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');
const { webhookLimiter } = require('../middleware/rateLimiter');

// Razorpay webhook
router.post('/razorpay', webhookLimiter, express.raw({ type: 'application/json' }), webhookController.razorpay);

module.exports = router;
