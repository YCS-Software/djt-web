/**
 * Role-Based Access Control Middleware
 */

/**
 * Check if user has required permission
 */
const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    // Super admin has all permissions
    if (req.user.roles.includes('super_admin')) {
      return next();
    }

    // Check if user has the required permission
    if (!req.user.permissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        },
      });
    }

    next();
  };
};

/**
 * Check if user has any of the required permissions
 */
const checkAnyPermission = (permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    // Super admin has all permissions
    if (req.user.roles.includes('super_admin')) {
      return next();
    }

    // Check if user has any of the required permissions
    const hasPermission = permissions.some((permission) =>
      req.user.permissions.includes(permission)
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        },
      });
    }

    next();
  };
};

/**
 * Check if user has all of the required permissions
 */
const checkAllPermissions = (permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    // Super admin has all permissions
    if (req.user.roles.includes('super_admin')) {
      return next();
    }

    // Check if user has all required permissions
    const hasAllPermissions = permissions.every((permission) =>
      req.user.permissions.includes(permission)
    );

    if (!hasAllPermissions) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
        },
      });
    }

    next();
  };
};

/**
 * Check if user has required role
 */
const checkRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    if (!req.user.roles.includes(role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied',
        },
      });
    }

    next();
  };
};

/**
 * Check if user has any of the required roles
 */
const checkAnyRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      });
    }

    const hasRole = roles.some((role) => req.user.roles.includes(role));

    if (!hasRole) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied',
        },
      });
    }

    next();
  };
};

/**
 * Enforce partner scope - users can only access their own partner's data
 */
const enforcePartnerScope = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    });
  }

  // Super admin can access all partners
  if (req.user.roles.includes('super_admin')) {
    return next();
  }

  // User must have a partner association
  if (!req.user.partnerId) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'No partner association',
      },
    });
  }

  // Add partner filter to request
  req.partnerScope = { partnerId: req.user.partnerId };

  // Override any partnerId in query/params with user's partnerId
  if (req.query.partnerId && req.query.partnerId !== req.user.partnerId) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Access denied to this partner',
      },
    });
  }

  req.query.partnerId = req.user.partnerId;

  next();
};

/**
 * Check if user is super admin
 */
const isSuperAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      },
    });
  }

  if (!req.user.roles.includes('super_admin')) {
    return res.status(403).json({
      success: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Super admin access required',
      },
    });
  }

  next();
};

module.exports = {
  checkPermission,
  checkAnyPermission,
  checkAllPermissions,
  checkRole,
  checkAnyRole,
  enforcePartnerScope,
  isSuperAdmin,
};
