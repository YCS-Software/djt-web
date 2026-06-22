/**
 * Authentication Middleware
 */

const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const { User, Role, Permission } = require('../models');
const logger = require('../utils/logger');

/**
 * Authenticate JWT token
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'No token provided',
        },
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, jwtConfig.accessToken.secret, {
        algorithms: [jwtConfig.algorithm],
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience,
      });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: {
            code: 'TOKEN_EXPIRED',
            message: 'Token has expired',
          },
        });
      }
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid token',
        },
      });
    }

    // Get user with roles and permissions
    const user = await User.findByPk(decoded.sub, {
      attributes: { exclude: ['passwordHash'] },
      include: [
        {
          model: Role,
          through: { attributes: [] },
          include: [
            {
              model: Permission,
              through: { attributes: [] },
            },
          ],
        },
      ],
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
        },
      });
    }

    if (user.status !== 'active') {
      return res.status(401).json({
        success: false,
        error: {
          code: 'USER_INACTIVE',
          message: 'User account is not active',
        },
      });
    }

    // Extract permissions
    const permissions = new Set();
    const roles = [];

    user.Roles.forEach((role) => {
      roles.push(role.name);
      role.Permissions.forEach((permission) => {
        permissions.add(permission.name);
      });
    });

    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      partnerId: user.partnerId,
      roles,
      permissions: Array.from(permissions),
    };

    next();
  } catch (error) {
    logger.error('Authentication error', { error: error.message });
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Authentication failed',
      },
    });
  }
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  return authenticate(req, res, next);
};

module.exports = {
  authenticate,
  optionalAuth,
};
