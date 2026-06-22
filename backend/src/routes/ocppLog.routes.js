/**
 * OCPP Log Routes
 */

const express = require('express');
const router = express.Router();
const Joi = require('joi');
const ocppLogController = require('../controllers/ocppLogController');
const { authenticate } = require('../middleware/auth');
const { checkPermission, enforcePartnerScope } = require('../middleware/rbac');
const validate = require('../middleware/validate');

const listSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    stationId: Joi.string().uuid(),
    action: Joi.string(),
    direction: Joi.string().valid('incoming', 'outgoing'),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
  }),
};

router.get('/', authenticate, checkPermission('view:ocpp_logs'), enforcePartnerScope, validate(listSchema), ocppLogController.list);
router.get('/:id', authenticate, checkPermission('view:ocpp_logs'), ocppLogController.getById);

module.exports = router;
