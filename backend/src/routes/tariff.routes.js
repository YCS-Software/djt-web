/**
 * Tariff Routes
 */

const express = require('express');
const router = express.Router();
const Joi = require('joi');
const tariffController = require('../controllers/tariffController');
const { authenticate } = require('../middleware/auth');
const { checkPermission, enforcePartnerScope } = require('../middleware/rbac');
const validate = require('../middleware/validate');

const createTariffSchema = {
  body: Joi.object({
    name: Joi.string().required(),
    description: Joi.string(),
    energyRate: Joi.number().min(0),
    timeRate: Joi.number().min(0),
    sessionFee: Joi.number().min(0),
    idleFeeRate: Joi.number().min(0),
    idleGraceMinutes: Joi.number().integer().min(0),
    taxRate: Joi.number().min(0).max(100),
    isDefault: Joi.boolean(),
  }),
};

router.get('/', authenticate, checkPermission('view:tariffs'), enforcePartnerScope, tariffController.list);
router.get('/:id', authenticate, checkPermission('view:tariffs'), tariffController.getById);
router.post('/', authenticate, checkPermission('create:tariffs'), validate(createTariffSchema), tariffController.create);
router.put('/:id', authenticate, checkPermission('update:tariffs'), tariffController.update);
router.delete('/:id', authenticate, checkPermission('delete:tariffs'), tariffController.delete);

module.exports = router;
