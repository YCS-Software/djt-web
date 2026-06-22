/**
 * Partner Routes
 */

const express = require('express');
const router = express.Router();
const Joi = require('joi');
const partnerController = require('../controllers/partnerController');
const { authenticate } = require('../middleware/auth');
const { checkPermission, isSuperAdmin } = require('../middleware/rbac');
const validate = require('../middleware/validate');

const createPartnerSchema = {
  body: Joi.object({
    name: Joi.string().min(2).max(200).required(),
    legalName: Joi.string().max(200),
    email: Joi.string().email().required(),
    phone: Joi.string().required(),
    address: Joi.string().required(),
    city: Joi.string(),
    state: Joi.string(),
    pincode: Joi.string(),
    gstNumber: Joi.string(),
    panNumber: Joi.string(),
    commissionRate: Joi.number().min(0).max(100).default(10),
  }),
};

const updatePartnerSchema = {
  body: Joi.object({
    name: Joi.string().min(2).max(200),
    legalName: Joi.string().max(200),
    email: Joi.string().email(),
    phone: Joi.string(),
    address: Joi.string(),
    city: Joi.string(),
    state: Joi.string(),
    pincode: Joi.string(),
    gstNumber: Joi.string(),
    panNumber: Joi.string(),
    commissionRate: Joi.number().min(0).max(100),
    status: Joi.string().valid('active', 'inactive', 'suspended'),
  }),
};

router.get('/', authenticate, checkPermission('view:partners'), partnerController.list);
router.get('/:id', authenticate, checkPermission('view:partners'), partnerController.getById);
router.post('/', authenticate, checkPermission('create:partners'), validate(createPartnerSchema), partnerController.create);
router.put('/:id', authenticate, checkPermission('update:partners'), validate(updatePartnerSchema), partnerController.update);
router.delete('/:id', authenticate, checkPermission('delete:partners'), partnerController.delete);
router.get('/:id/wallet', authenticate, checkPermission('view:partners'), partnerController.getWallet);
router.get('/:id/settlements', authenticate, isSuperAdmin, partnerController.getSettlements);
router.post('/:id/settlements', authenticate, isSuperAdmin, partnerController.createSettlement);

module.exports = router;
