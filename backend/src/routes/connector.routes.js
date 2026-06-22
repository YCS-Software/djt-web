/**
 * Connector Routes
 */

const express = require('express');
const router = express.Router();
const Joi = require('joi');
const connectorController = require('../controllers/connectorController');
const { authenticate } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const validate = require('../middleware/validate');

const createConnectorSchema = {
  body: Joi.object({
    stationId: Joi.string().uuid().required(),
    connectorId: Joi.number().integer().min(1).required(),
    connectorType: Joi.string().valid('CCS1', 'CCS2', 'CHAdeMO', 'Type1', 'Type2', 'GBT').required(),
    powerKw: Joi.number().min(0).required(),
    voltage: Joi.number().integer(),
    amperage: Joi.number().integer(),
    tariffId: Joi.string().uuid(),
  }),
};

router.get('/', authenticate, checkPermission('view:connectors'), connectorController.list);
router.get('/:id', authenticate, checkPermission('view:connectors'), connectorController.getById);
router.post('/', authenticate, checkPermission('create:connectors'), validate(createConnectorSchema), connectorController.create);
router.put('/:id', authenticate, checkPermission('update:connectors'), connectorController.update);
router.delete('/:id', authenticate, checkPermission('delete:connectors'), connectorController.delete);
router.post('/:id/regenerate-qr', authenticate, checkPermission('update:connectors'), connectorController.regenerateQR);

module.exports = router;
