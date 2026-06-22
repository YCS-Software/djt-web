/**
 * Station Routes
 */

const express = require('express');
const router = express.Router();
const Joi = require('joi');
const stationController = require('../controllers/stationController');
const { authenticate } = require('../middleware/auth');
const { checkPermission, enforcePartnerScope } = require('../middleware/rbac');
const validate = require('../middleware/validate');

const createStationSchema = {
  body: Joi.object({
    locationId: Joi.string().uuid().required(),
    ocppIdentity: Joi.string().required(),
    name: Joi.string(),
    vendor: Joi.string(),
    model: Joi.string(),
  }),
};

const listSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    locationId: Joi.string().uuid(),
    partnerId: Joi.string().uuid(),
    isOnline: Joi.boolean(),
    status: Joi.string().valid('active', 'inactive', 'maintenance'),
  }),
};

const resetSchema = {
  body: Joi.object({
    type: Joi.string().valid('Soft', 'Hard').required(),
  }),
};

const remoteStartSchema = {
  body: Joi.object({
    connectorId: Joi.number().integer().min(1).required(),
    idTag: Joi.string().required(),
    driverId: Joi.string().uuid(),
  }),
};

const remoteStopSchema = {
  body: Joi.object({
    transactionId: Joi.number().integer().required(),
  }),
};

router.get('/', authenticate, checkPermission('view:stations'), enforcePartnerScope, validate(listSchema), stationController.list);
router.get('/:id', authenticate, checkPermission('view:stations'), stationController.getById);
router.post('/', authenticate, checkPermission('create:stations'), validate(createStationSchema), stationController.create);
router.put('/:id', authenticate, checkPermission('update:stations'), stationController.update);
router.delete('/:id', authenticate, checkPermission('delete:stations'), stationController.delete);
router.post('/:id/reset', authenticate, checkPermission('control:stations'), validate(resetSchema), stationController.reset);
router.post('/:id/remote-start', authenticate, checkPermission('control:stations'), validate(remoteStartSchema), stationController.remoteStart);
router.post('/:id/remote-stop', authenticate, checkPermission('control:stations'), validate(remoteStopSchema), stationController.remoteStop);

module.exports = router;
