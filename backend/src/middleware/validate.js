/**
 * Request Validation Middleware
 */

const Joi = require('joi');

/**
 * Validate request against Joi schema
 */
const validate = (schema) => {
  return (req, res, next) => {
    const validationOptions = {
      abortEarly: false,
      allowUnknown: true,
      stripUnknown: true,
    };

    const dataToValidate = {};
    if (schema.body) dataToValidate.body = req.body;
    if (schema.params) dataToValidate.params = req.params;
    if (schema.query) dataToValidate.query = req.query;

    const { error, value } = Joi.object(schema).validate(dataToValidate, validationOptions);

    if (error) {
      const details = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/"/g, ''),
      }));

      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details,
        },
      });
    }

    // Update request with validated and sanitized values
    if (value.body) req.body = value.body;
    if (value.params) req.params = value.params;
    if (value.query) req.query = value.query;

    next();
  };
};

// Common validation schemas
const commonSchemas = {
  uuid: Joi.string().uuid(),
  email: Joi.string().email(),
  phone: Joi.string().pattern(/^[6-9]\d{9}$/),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .messages({
      'string.pattern.base': 'Password must contain at least one uppercase, lowercase, number, and special character',
    }),
  pagination: {
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string(),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  },
  status: Joi.string().valid('active', 'inactive', 'suspended'),
  dateRange: {
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')),
  },
};

module.exports = validate;
module.exports.schemas = commonSchemas;
