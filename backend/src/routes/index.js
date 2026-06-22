/**
 * API Routes Index
 */

const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const partnerRoutes = require('./partner.routes');
const locationRoutes = require('./location.routes');
const stationRoutes = require('./station.routes');
const connectorRoutes = require('./connector.routes');
const driverRoutes = require('./driver.routes');
const sessionRoutes = require('./session.routes');
const tariffRoutes = require('./tariff.routes');
const cardRoutes = require('./card.routes');
const reservationRoutes = require('./reservation.routes');
const reportRoutes = require('./report.routes');
const dashboardRoutes = require('./dashboard.routes');
const disputeRoutes = require('./dispute.routes');
const couponRoutes = require('./coupon.routes');
const reviewRoutes = require('./review.routes');
const auditLogRoutes = require('./auditLog.routes');
const ocppLogRoutes = require('./ocppLog.routes');
const webhookRoutes = require('./webhook.routes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/partners', partnerRoutes);
router.use('/locations', locationRoutes);
router.use('/stations', stationRoutes);
router.use('/connectors', connectorRoutes);
router.use('/drivers', driverRoutes);
router.use('/sessions', sessionRoutes);
router.use('/tariffs', tariffRoutes);
router.use('/cards', cardRoutes);
router.use('/reservations', reservationRoutes);
router.use('/reports', reportRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/disputes', disputeRoutes);
router.use('/coupons', couponRoutes);
router.use('/reviews', reviewRoutes);
router.use('/audit-logs', auditLogRoutes);
router.use('/ocpp-logs', ocppLogRoutes);
router.use('/webhooks', webhookRoutes);

module.exports = router;
