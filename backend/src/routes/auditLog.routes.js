/**
 * Audit Log Routes
 */

const express = require('express');
const router = express.Router();
const Joi = require('joi');
const auditLogController = require('../controllers/auditLogController');
const { authenticate } = require('../middleware/auth');
const { checkPermission, enforcePartnerScope } = require('../middleware/rbac');
const validate = require('../middleware/validate');

const listSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    userId: Joi.string().uuid(),
    action: Joi.string(),
    resource: Joi.string(),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
  }),
};

router.get('/', authenticate, checkPermission('view:audit_logs'), enforcePartnerScope, validate(listSchema), auditLogController.list);
router.get('/:id', authenticate, checkPermission('view:audit_logs'), auditLogController.getById);

module.exports = router;
