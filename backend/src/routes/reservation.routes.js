/**
 * Reservation Routes
 */

const express = require('express');
const router = express.Router();
const Joi = require('joi');
const reservationController = require('../controllers/reservationController');
const { authenticate } = require('../middleware/auth');
const { checkPermission } = require('../middleware/rbac');
const validate = require('../middleware/validate');

const createSchema = {
  body: Joi.object({
    connectorId: Joi.string().uuid().required(),
    driverId: Joi.string().uuid().required(),
    startTime: Joi.date().iso().required(),
    endTime: Joi.date().iso().required(),
  }),
};

router.get('/', authenticate, checkPermission('view:sessions'), reservationController.list);
router.get('/:id', authenticate, checkPermission('view:sessions'), reservationController.getById);
router.post('/', authenticate, checkPermission('control:sessions'), validate(createSchema), reservationController.create);
router.delete('/:id', authenticate, checkPermission('control:sessions'), reservationController.cancel);

module.exports = router;
