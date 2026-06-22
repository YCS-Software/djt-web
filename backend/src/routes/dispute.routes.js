/**
 * Dispute Routes
 */

const express = require('express');
const router = express.Router();
const Joi = require('joi');
const disputeController = require('../controllers/disputeController');
const { authenticate } = require('../middleware/auth');
const { checkPermission, enforcePartnerScope } = require('../middleware/rbac');
const validate = require('../middleware/validate');

const createSchema = {
  body: Joi.object({
    sessionId: Joi.string().uuid(),
    transactionId: Joi.string().uuid(),
    driverId: Joi.string().uuid().required(),
    category: Joi.string().valid('incorrect_billing', 'session_not_started', 'payment_issue', 'station_malfunction', 'other').required(),
    subject: Joi.string().max(200).required(),
    description: Joi.string().required(),
  }),
};

const resolveSchema = {
  body: Joi.object({
    resolution: Joi.string().required(),
    refundAmount: Joi.number().min(0),
  }),
};

router.get('/', authenticate, checkPermission('view:disputes'), enforcePartnerScope, disputeController.list);
router.get('/:id', authenticate, checkPermission('view:disputes'), disputeController.getById);
router.post('/', authenticate, checkPermission('manage:disputes'), validate(createSchema), disputeController.create);
router.put('/:id', authenticate, checkPermission('manage:disputes'), disputeController.update);
router.post('/:id/resolve', authenticate, checkPermission('manage:disputes'), validate(resolveSchema), disputeController.resolve);

module.exports = router;
