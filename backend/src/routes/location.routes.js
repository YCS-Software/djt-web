/**
 * Location Routes
 */

const express = require('express');
const router = express.Router();
const Joi = require('joi');
const locationController = require('../controllers/locationController');
const { authenticate } = require('../middleware/auth');
const { checkPermission, enforcePartnerScope } = require('../middleware/rbac');
const validate = require('../middleware/validate');

const createLocationSchema = {
  body: Joi.object({
    name: Joi.string().min(2).max(200).required(),
    address: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    pincode: Joi.string().required(),
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
    operatingHours: Joi.object(),
    amenities: Joi.array().items(Joi.string()),
    contactPhone: Joi.string(),
    contactEmail: Joi.string().email(),
    directions: Joi.string(),
  }),
};

const listSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    partnerId: Joi.string().uuid(),
    city: Joi.string(),
    status: Joi.string().valid('active', 'inactive', 'coming_soon'),
    lat: Joi.number(),
    lng: Joi.number(),
    radius: Joi.number().min(1).max(500),
  }),
};

router.get('/', authenticate, checkPermission('view:locations'), enforcePartnerScope, validate(listSchema), locationController.list);
router.get('/:id', authenticate, checkPermission('view:locations'), locationController.getById);
router.post('/', authenticate, checkPermission('create:locations'), validate(createLocationSchema), locationController.create);
router.put('/:id', authenticate, checkPermission('update:locations'), locationController.update);
router.delete('/:id', authenticate, checkPermission('delete:locations'), locationController.delete);

module.exports = router;
