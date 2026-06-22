/**
 * User Routes
 */

const express = require('express');
const router = express.Router();
const Joi = require('joi');
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { checkPermission, enforcePartnerScope } = require('../middleware/rbac');
const validate = require('../middleware/validate');

// Validation schemas
const createUserSchema = {
  body: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    firstName: Joi.string().min(2).max(100).required(),
    lastName: Joi.string().min(2).max(100).required(),
    phone: Joi.string().pattern(/^[6-9]\d{9}$/),
    roleIds: Joi.array().items(Joi.string().uuid()),
    partnerId: Joi.string().uuid(),
  }),
};

const updateUserSchema = {
  body: Joi.object({
    firstName: Joi.string().min(2).max(100),
    lastName: Joi.string().min(2).max(100),
    phone: Joi.string().pattern(/^[6-9]\d{9}$/),
    status: Joi.string().valid('active', 'inactive', 'suspended'),
    roleIds: Joi.array().items(Joi.string().uuid()),
  }),
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};

const listUsersSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    search: Joi.string(),
    status: Joi.string().valid('active', 'inactive', 'suspended'),
    role: Joi.string(),
    partnerId: Joi.string().uuid(),
  }),
};

// Routes
router.get(
  '/',
  authenticate,
  checkPermission('view:users'),
  enforcePartnerScope,
  validate(listUsersSchema),
  userController.list
);

router.get(
  '/:id',
  authenticate,
  checkPermission('view:users'),
  userController.getById
);

router.post(
  '/',
  authenticate,
  checkPermission('create:users'),
  validate(createUserSchema),
  userController.create
);

router.put(
  '/:id',
  authenticate,
  checkPermission('update:users'),
  validate(updateUserSchema),
  userController.update
);

router.delete(
  '/:id',
  authenticate,
  checkPermission('delete:users'),
  userController.delete
);

module.exports = router;
