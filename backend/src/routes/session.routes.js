/**
 * Session Routes
 */

const express = require('express');
const router = express.Router();
const Joi = require('joi');
const sessionController = require('../controllers/sessionController');
const { authenticate } = require('../middleware/auth');
const { checkPermission, enforcePartnerScope } = require('../middleware/rbac');
const validate = require('../middleware/validate');

const listSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    connectorId: Joi.string().uuid(),
    stationId: Joi.string().uuid(),
    locationId: Joi.string().uuid(),
    driverId: Joi.string().uuid(),
    status: Joi.string().valid('pending', 'active', 'completed', 'failed', 'cancelled'),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
  }),
};

const startSessionSchema = {
  body: Joi.object({
    connectorId: Joi.string().uuid().required(),
    driverId: Joi.string().uuid().required(),
    vehicleId: Joi.string().uuid(),
    couponCode: Joi.string(),
  }),
};

router.get('/', authenticate, checkPermission('view:sessions'), enforcePartnerScope, validate(listSchema), sessionController.list);
router.get('/active', authenticate, checkPermission('view:sessions'), enforcePartnerScope, sessionController.getActive);
router.get('/:id', authenticate, checkPermission('view:sessions'), sessionController.getById);
router.post('/start', authenticate, checkPermission('control:sessions'), validate(startSessionSchema), sessionController.startByQR);
router.post('/:id/stop', authenticate, checkPermission('control:sessions'), sessionController.stop);
router.get('/:id/meter-values', authenticate, checkPermission('view:sessions'), sessionController.getMeterValues);

module.exports = router;
