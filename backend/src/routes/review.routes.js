/**
 * Review Routes
 */

const express = require('express');
const router = express.Router();
const Joi = require('joi');
const reviewController = require('../controllers/reviewController');
const { authenticate } = require('../middleware/auth');
const { checkPermission, enforcePartnerScope } = require('../middleware/rbac');
const validate = require('../middleware/validate');

const respondSchema = {
  body: Joi.object({
    response: Joi.string().required(),
  }),
};

router.get('/', authenticate, checkPermission('view:disputes'), enforcePartnerScope, reviewController.list);
router.get('/station/:stationId', authenticate, reviewController.getByStation);
router.get('/:id', authenticate, checkPermission('view:disputes'), reviewController.getById);
router.post('/:id/reply', authenticate, checkPermission('manage:disputes'), validate(respondSchema), reviewController.reply);

module.exports = router;
