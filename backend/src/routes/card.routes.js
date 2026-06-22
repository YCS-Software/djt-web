/**
 * RFID Card Routes
 */

const express = require('express');
const router = express.Router();
const Joi = require('joi');
const cardController = require('../controllers/cardController');
const { authenticate } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const validate = require('../middleware/validate');

const createCardSchema = {
  body: Joi.object({
    cardNumber: Joi.string().required(),
    uid: Joi.string().required(),
    driverId: Joi.string().uuid(),
    validFrom: Joi.date(),
    validUntil: Joi.date(),
  }),
};

const blockSchema = {
  body: Joi.object({
    reason: Joi.string().required(),
  }),
};

router.get('/', authenticate, checkPermission('view:cards'), cardController.list);
router.get('/:id', authenticate, checkPermission('view:cards'), cardController.getById);
router.post('/', authenticate, checkPermission('create:cards'), validate(createCardSchema), cardController.create);
router.put('/:id', authenticate, checkPermission('update:cards'), cardController.update);
router.delete('/:id', authenticate, checkPermission('delete:cards'), cardController.delete);
router.post('/:id/block', authenticate, checkPermission('update:cards'), validate(blockSchema), cardController.block);
router.post('/:id/unblock', authenticate, checkPermission('update:cards'), cardController.unblock);
router.get('/requests', authenticate, checkPermission('view:cards'), cardController.listRequests);
router.post('/requests/:id/approve', authenticate, checkPermission('update:cards'), cardController.approveRequest);
router.post('/requests/:id/reject', authenticate, checkPermission('update:cards'), cardController.rejectRequest);

module.exports = router;
