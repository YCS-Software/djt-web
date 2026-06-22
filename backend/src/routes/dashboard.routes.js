/**
 * Dashboard Routes
 */

const express = require('express');
const router = express.Router();
const Joi = require('joi');
const dashboardController = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');
const { checkPermission, enforcePartnerScope } = require('../middleware/rbac');
const validate = require('../middleware/validate');

const chartSchema = {
  query: Joi.object({
    period: Joi.string().valid('day', 'week', 'month', 'year').default('week'),
    locationId: Joi.string().uuid(),
  }),
};

router.get('/overview', authenticate, checkPermission('view:dashboard'), enforcePartnerScope, dashboardController.overview);
router.get('/trends', authenticate, checkPermission('view:dashboard'), enforcePartnerScope, validate(chartSchema), dashboardController.sessionTrends);
router.get('/revenue', authenticate, checkPermission('view:dashboard'), enforcePartnerScope, validate(chartSchema), dashboardController.revenueBreakdown);
router.get('/station-status', authenticate, checkPermission('view:dashboard'), enforcePartnerScope, dashboardController.stationStatus);
router.get('/live-sessions', authenticate, checkPermission('view:dashboard'), enforcePartnerScope, dashboardController.liveSessions);
router.get('/recent', authenticate, checkPermission('view:dashboard'), enforcePartnerScope, dashboardController.recentActivity);
router.get('/top-stations', authenticate, checkPermission('view:dashboard'), enforcePartnerScope, dashboardController.topStations);

module.exports = router;
