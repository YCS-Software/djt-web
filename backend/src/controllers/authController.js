/**
 * Authentication Controller
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { User, Role, Permission } = require('../models');
const jwtConfig = require('../config/jwt');
const redis = require('../config/redis');
const logger = require('../utils/logger');

/**
 * Login
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user with roles and permissions
    const user = await User.findOne({
      where: { email },
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
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check user status
    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Account is not active' });
    }

    const roles = user.Roles || [];
    const permissions = roles.flatMap(r => (r.Permissions || []).map(p => p.name));

    // Generate tokens (subject/issuer/audience must match auth middleware verification)
    const tokenPayload = {
      sub: user.id,
      email: user.email,
      role: roles[0]?.name || 'user',
      partnerId: user.partnerId,
      permissions,
    };

    const accessToken = jwt.sign(tokenPayload, jwtConfig.accessToken.secret, {
      expiresIn: jwtConfig.accessToken.expiresIn,
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
    });

    const refreshToken = jwt.sign(
      { id: user.id, type: 'refresh' },
      jwtConfig.refreshToken.secret,
      { expiresIn: jwtConfig.refreshToken.expiresIn }
    );

    // Store refresh token in Redis
    await redis.setex(
      `refresh:${user.id}:${refreshToken.slice(-10)}`,
      jwtConfig.refreshToken.expiresInSeconds,
      refreshToken
    );

    // Update last login
    await user.update({ lastLoginAt: new Date() });

    logger.info('User logged in', { userId: user.id, email: user.email });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.getFullName(),
        role: tokenPayload.role,
        partnerId: user.partnerId,
        permissions,
      },
      accessToken,
      refreshToken,
    });

  } catch (error) {
    logger.error('Login error', { error: error.message });
    res.status(500).json({ error: 'Login failed' });
  }
};

/**
 * Refresh access token
 */
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, jwtConfig.refreshToken.secret);

    // Check if token exists in Redis
    const storedToken = await redis.get(`refresh:${decoded.id}:${refreshToken.slice(-10)}`);
    if (!storedToken) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Get user with roles
    const user = await User.findByPk(decoded.id, {
      include: [
        {
          model: Role,
          through: { attributes: [] },
          include: [{ model: Permission, through: { attributes: [] } }],
        },
      ],
    });

    if (!user || user.status !== 'active') {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    const roles = user.Roles || [];

    // Generate new access token
    const tokenPayload = {
      sub: user.id,
      email: user.email,
      role: roles[0]?.name || 'user',
      partnerId: user.partnerId,
      permissions: roles.flatMap(r => (r.Permissions || []).map(p => p.name)),
    };

    const accessToken = jwt.sign(tokenPayload, jwtConfig.accessToken.secret, {
      expiresIn: jwtConfig.accessToken.expiresIn,
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
    });

    res.json({ accessToken });

  } catch (error) {
    logger.error('Refresh token error', { error: error.message });
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};

/**
 * Logout
 */
exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const userId = req.user.id;

    // Remove refresh token from Redis
    if (refreshToken) {
      await redis.del(`refresh:${userId}:${refreshToken.slice(-10)}`);
    }

    // Optionally invalidate all sessions
    // const keys = await redis.keys(`refresh:${userId}:*`);
    // if (keys.length) await redis.del(keys);

    logger.info('User logged out', { userId });

    res.json({ message: 'Logged out successfully' });

  } catch (error) {
    logger.error('Logout error', { error: error.message });
    res.status(500).json({ error: 'Logout failed' });
  }
};

/**
 * Get current user profile
 */
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['passwordHash'] },
      include: [
        {
          model: Role,
          through: { attributes: [] },
          include: [{ model: Permission, through: { attributes: [] } }],
        },
      ],
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const roles = user.Roles || [];
    const permissions = roles.flatMap(r => (r.Permissions || []).map(p => p.name));

    // Return a flattened shape the frontend expects (role + permissions),
    // alongside the full user record.
    res.json({
      user: {
        ...user.toJSON(),
        name: user.getFullName(),
        role: roles[0]?.name || 'user',
        permissions,
      },
    });

  } catch (error) {
    logger.error('Get profile error', { error: error.message });
    res.status(500).json({ error: 'Failed to get profile' });
  }
};

/**
 * Change password
 */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    const user = await User.findByPk(userId);

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await user.update({ password: hashedPassword });

    // Invalidate all refresh tokens
    const keys = await redis.keys(`refresh:${userId}:*`);
    if (keys.length) await redis.del(keys);

    logger.info('Password changed', { userId });

    res.json({ message: 'Password changed successfully' });

  } catch (error) {
    logger.error('Change password error', { error: error.message });
    res.status(500).json({ error: 'Failed to change password' });
  }
};

/**
 * Request password reset
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ where: { email } });

    if (!user) {
      // Don't reveal if email exists
      return res.json({ message: 'If email exists, reset link will be sent' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Store in Redis (expires in 1 hour)
    await redis.setex(`passwordReset:${hashedToken}`, 3600, user.id);

    // TODO: Send email with reset link
    // await sendEmail({ to: email, subject: 'Password Reset', resetToken });

    logger.info('Password reset requested', { userId: user.id, email });

    res.json({ message: 'If email exists, reset link will be sent' });

  } catch (error) {
    logger.error('Forgot password error', { error: error.message });
    res.status(500).json({ error: 'Failed to process request' });
  }
};

/**
 * Reset password with token
 */
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const userId = await redis.get(`passwordReset:${hashedToken}`);

    if (!userId) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await user.update({ password: hashedPassword });

    // Delete reset token
    await redis.del(`passwordReset:${hashedToken}`);

    // Invalidate all refresh tokens
    const keys = await redis.keys(`refresh:${userId}:*`);
    if (keys.length) await redis.del(keys);

    logger.info('Password reset completed', { userId });

    res.json({ message: 'Password reset successfully' });

  } catch (error) {
    logger.error('Reset password error', { error: error.message });
    res.status(500).json({ error: 'Failed to reset password' });
  }
};

/**
 * Update current user profile
 */
exports.updateProfile = async (req, res) => {
  try {
    const { name, phone } = req.body;
    const userId = req.user.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await user.update({ name, phone });

    logger.info('Profile updated', { userId });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
      },
    });

  } catch (error) {
    logger.error('Update profile error', { error: error.message });
    res.status(500).json({ error: 'Failed to update profile' });
  }
};
