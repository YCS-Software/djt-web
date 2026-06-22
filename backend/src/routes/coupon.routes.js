/**
 * Coupon Routes
 */

const express = require('express');
const router = express.Router();
const Joi = require('joi');
const couponController = require('../controllers/couponController');
const { authenticate } = require('../middleware/auth');
const { checkPermission, enforcePartnerScope } = require('../middleware/rbac');
const validate = require('../middleware/validate');

const createSchema = {
  body: Joi.object({
    code: Joi.string().required(),
    name: Joi.string().required(),
    description: Joi.string(),
    discountType: Joi.string().valid('percentage', 'fixed').required(),
    discountValue: Joi.number().min(0).required(),
    maxDiscount: Joi.number().min(0),
    minAmount: Joi.number().min(0),
    usageLimit: Joi.number().integer().min(1),
    perUserLimit: Joi.number().integer().min(1),
    validFrom: Joi.date().iso().required(),
    validUntil: Joi.date().iso().required(),
  }),
};

const validateSchema = {
  body: Joi.object({
    code: Joi.string().required(),
    driverId: Joi.string().uuid().required(),
    amount: Joi.number().min(0).required(),
  }),
};

router.get('/', authenticate, checkPermission('view:coupons'), enforcePartnerScope, couponController.list);
router.get('/:id', authenticate, checkPermission('view:coupons'), couponController.getById);
router.post('/', authenticate, checkPermission('create:coupons'), validate(createSchema), couponController.create);
router.put('/:id', authenticate, checkPermission('update:coupons'), couponController.update);
router.delete('/:id', authenticate, checkPermission('delete:coupons'), couponController.delete);
router.post('/validate', authenticate, validate(validateSchema), couponController.validate);
router.get('/:id/usage', authenticate, checkPermission('view:coupons'), couponController.getUsage);

module.exports = router;
