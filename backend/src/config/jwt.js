/**
 * JWT Configuration
 */

module.exports = {
  accessToken: {
    secret: process.env.JWT_ACCESS_SECRET || 'your-access-secret-key-change-in-production',
    expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
  },
  refreshToken: {
    secret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production',
    expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d',
  },
  algorithm: 'HS256',
  issuer: process.env.JWT_ISSUER || 'ev-charging-platform',
  audience: process.env.JWT_AUDIENCE || 'ev-charging-users',
};
