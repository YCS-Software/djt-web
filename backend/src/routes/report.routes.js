/**
 * Report Routes
 */

const express = require('express');
const router = express.Router();
const Joi = require('joi');
const reportController = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');
const { checkPermission, enforcePartnerScope } = require('../middleware/rbac');
const validate = require('../middleware/validate');
const { reportLimiter } = require('../middleware/rateLimiter');

const reportSchema = {
  query: Joi.object({
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().required(),
    locationId: Joi.string().uuid(),
    stationId: Joi.string().uuid(),
    format: Joi.string().valid('pdf', 'excel').default('pdf'),
  }),
};

router.get('/sessions', authenticate, checkPermission('view:reports'), enforcePartnerScope, reportLimiter, validate(reportSchema), reportController.sessions);
router.get('/revenue', authenticate, checkPermission('view:reports'), enforcePartnerScope, reportLimiter, validate(reportSchema), reportController.revenue);
router.get('/energy', authenticate, checkPermission('view:reports'), enforcePartnerScope, reportLimiter, validate(reportSchema), reportController.energy);
router.get('/utilization', authenticate, checkPermission('view:reports'), enforcePartnerScope, reportLimiter, validate(reportSchema), reportController.utilization);
router.get('/drivers', authenticate, checkPermission('view:reports'), enforcePartnerScope, reportLimiter, validate(reportSchema), reportController.driverActivity);
router.get('/settlement', authenticate, checkPermission('view:reports'), enforcePartnerScope, reportLimiter, validate(reportSchema), reportController.settlement);

module.exports = router;
