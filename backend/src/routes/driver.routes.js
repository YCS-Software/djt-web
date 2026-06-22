/**
 * Driver Routes
 */

const express = require('express');
const router = express.Router();
const Joi = require('joi');
const driverController = require('../controllers/driverController');
const { authenticate } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const validate = require('../middleware/validate');

const createDriverSchema = {
  body: Joi.object({
    phone: Joi.string().pattern(/^[6-9]\d{9}$/).required(),
    email: Joi.string().email(),
    firstName: Joi.string().required(),
    lastName: Joi.string(),
  }),
};

const listSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    search: Joi.string(),
    status: Joi.string().valid('active', 'inactive', 'suspended'),
  }),
};

const topupSchema = {
  body: Joi.object({
    amount: Joi.number().min(100).max(50000).required(),
  }),
};

router.get('/', authenticate, checkPermission('view:drivers'), validate(listSchema), driverController.list);
router.get('/:id', authenticate, checkPermission('view:drivers'), driverController.getById);
router.post('/', authenticate, checkPermission('create:drivers'), validate(createDriverSchema), driverController.create);
router.put('/:id', authenticate, checkPermission('update:drivers'), driverController.update);
router.delete('/:id', authenticate, checkPermission('delete:drivers'), driverController.delete);
router.get('/:id/wallet', authenticate, checkPermission('view:drivers'), driverController.getWallet);
router.post('/:id/wallet/topup', authenticate, checkPermission('update:drivers'), validate(topupSchema), driverController.topupWallet);
router.get('/:id/sessions', authenticate, checkPermission('view:sessions'), driverController.getSessions);
router.get('/:id/transactions', authenticate, checkPermission('view:drivers'), driverController.getWalletTransactions);
router.get('/:id/vehicles', authenticate, checkPermission('view:drivers'), driverController.getVehicles);

module.exports = router;
