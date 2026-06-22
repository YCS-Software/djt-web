/**
 * User Controller
 */

const bcrypt = require('bcryptjs');
const { User, Role, Permission, AuditLog } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

/**
 * List users with pagination and filters
 */
exports.list = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role, status, partnerId } = req.query;
    const offset = (page - 1) * limit;

    const where = {};

    // Partner scope
    if (req.partnerScope) {
      where.partnerId = req.partnerScope;
    } else if (partnerId) {
      where.partnerId = partnerId;
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const include = [
      {
        model: Role,
        as: 'roles',
        ...(role && { where: { name: role } }),
      },
    ];

    const { count, rows } = await User.findAndCountAll({
      where,
      include,
      attributes: { exclude: ['password'] },
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
      distinct: true,
    });

    res.json({
      users: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });

  } catch (error) {
    logger.error('List users error', { error: error.message });
    res.status(500).json({ error: 'Failed to list users' });
  }
};

/**
 * Get user by ID
 */
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: Role,
          as: 'roles',
          include: [{ model: Permission, as: 'permissions' }],
        },
      ],
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check partner scope
    if (req.partnerScope && user.partnerId !== req.partnerScope) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ user });

  } catch (error) {
    logger.error('Get user error', { error: error.message });
    res.status(500).json({ error: 'Failed to get user' });
  }
};

/**
 * Create new user
 */
exports.create = async (req, res) => {
  try {
    const { name, email, password, phone, roleId, partnerId, status = 'active' } = req.body;

    // Check if email already exists
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      phone,
      partnerId: req.partnerScope || partnerId,
      status,
    });

    // Assign role
    if (roleId) {
      const role = await Role.findByPk(roleId);
      if (role) {
        await user.addRole(role);
      }
    }

    // Audit log
    await AuditLog.create({
      userId: req.user.id,
      action: 'create',
      resource: 'user',
      resourceId: user.id,
      details: { name, email, roleId },
      ipAddress: req.ip,
    });

    // Fetch user with roles
    const createdUser = await User.findByPk(user.id, {
      attributes: { exclude: ['password'] },
      include: [{ model: Role, as: 'roles' }],
    });

    logger.info('User created', { userId: user.id, createdBy: req.user.id });

    res.status(201).json({ user: createdUser });

  } catch (error) {
    logger.error('Create user error', { error: error.message });
    res.status(500).json({ error: 'Failed to create user' });
  }
};

/**
 * Update user
 */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, roleId, status } = req.body;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check partner scope
    if (req.partnerScope && user.partnerId !== req.partnerScope) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check email uniqueness
    if (email && email !== user.email) {
      const existing = await User.findOne({ where: { email } });
      if (existing) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    // Update user
    await user.update({
      name: name || user.name,
      email: email || user.email,
      phone: phone !== undefined ? phone : user.phone,
      status: status || user.status,
    });

    // Update role if provided
    if (roleId) {
      const role = await Role.findByPk(roleId);
      if (role) {
        await user.setRoles([role]);
      }
    }

    // Audit log
    await AuditLog.create({
      userId: req.user.id,
      action: 'update',
      resource: 'user',
      resourceId: user.id,
      details: { name, email, roleId, status },
      ipAddress: req.ip,
    });

    // Fetch updated user
    const updatedUser = await User.findByPk(id, {
      attributes: { exclude: ['password'] },
      include: [{ model: Role, as: 'roles' }],
    });

    logger.info('User updated', { userId: id, updatedBy: req.user.id });

    res.json({ user: updatedUser });

  } catch (error) {
    logger.error('Update user error', { error: error.message });
    res.status(500).json({ error: 'Failed to update user' });
  }
};

/**
 * Delete user (soft delete)
 */
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check partner scope
    if (req.partnerScope && user.partnerId !== req.partnerScope) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Prevent self-deletion
    if (user.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Soft delete
    await user.update({ status: 'deleted', deletedAt: new Date() });

    // Audit log
    await AuditLog.create({
      userId: req.user.id,
      action: 'delete',
      resource: 'user',
      resourceId: user.id,
      ipAddress: req.ip,
    });

    logger.info('User deleted', { userId: id, deletedBy: req.user.id });

    res.json({ message: 'User deleted successfully' });

  } catch (error) {
    logger.error('Delete user error', { error: error.message });
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

/**
 * Reset user password (admin action)
 */
exports.resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check partner scope
    if (req.partnerScope && user.partnerId !== req.partnerScope) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await user.update({ password: hashedPassword });

    // Audit log
    await AuditLog.create({
      userId: req.user.id,
      action: 'reset_password',
      resource: 'user',
      resourceId: user.id,
      ipAddress: req.ip,
    });

    logger.info('User password reset', { userId: id, resetBy: req.user.id });

    res.json({ message: 'Password reset successfully' });

  } catch (error) {
    logger.error('Reset password error', { error: error.message });
    res.status(500).json({ error: 'Failed to reset password' });
  }
};
