/**
 * Audit Log Controller
 */

const { AuditLog, User } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

/**
 * List audit logs
 */
exports.list = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      userId,
      action,
      resource,
      startDate,
      endDate
    } = req.query;
    const offset = (page - 1) * limit;

    const where = {};

    // Partner scope
    if (req.partnerScope) {
      where.partnerId = req.partnerScope;
    }

    if (userId) {
      where.userId = userId;
    }

    if (action) {
      where.action = action;
    }

    if (resource) {
      where.resource = resource;
    }

    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    const { count, rows } = await AuditLog.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
      ],
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.json({
      logs: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });

  } catch (error) {
    logger.error('List audit logs error', { error: error.message });
    res.status(500).json({ error: 'Failed to list audit logs' });
  }
};

/**
 * Get audit log by ID
 */
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;

    const log = await AuditLog.findByPk(id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
      ],
    });

    if (!log) {
      return res.status(404).json({ error: 'Audit log not found' });
    }

    // Check partner scope
    if (req.partnerScope && log.partnerId !== req.partnerScope) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ log });

  } catch (error) {
    logger.error('Get audit log error', { error: error.message });
    res.status(500).json({ error: 'Failed to get audit log' });
  }
};

/**
 * Get actions for a specific resource
 */
exports.getByResource = async (req, res) => {
  try {
    const { resource, resourceId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const where = { resource, resourceId };

    // Partner scope
    if (req.partnerScope) {
      where.partnerId = req.partnerScope;
    }

    const { count, rows } = await AuditLog.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
      ],
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.json({
      logs: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });

  } catch (error) {
    logger.error('Get resource audit logs error', { error: error.message });
    res.status(500).json({ error: 'Failed to get audit logs' });
  }
};

/**
 * Get audit log statistics
 */
exports.getStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const sequelize = require('../config/database');

    const where = {};

    if (req.partnerScope) {
      where.partnerId = req.partnerScope;
    }

    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    // Actions by type
    const byAction = await AuditLog.findAll({
      where,
      attributes: [
        'action',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: ['action'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      raw: true,
    });

    // Actions by resource
    const byResource = await AuditLog.findAll({
      where,
      attributes: [
        'resource',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: ['resource'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      raw: true,
    });

    // Top users by activity
    const byUser = await AuditLog.findAll({
      where,
      attributes: [
        'userId',
        [sequelize.fn('COUNT', sequelize.col('AuditLog.id')), 'count'],
      ],
      include: [
        { model: User, as: 'user', attributes: ['name', 'email'] },
      ],
      group: ['AuditLog.userId', 'user.id'],
      order: [[sequelize.fn('COUNT', sequelize.col('AuditLog.id')), 'DESC']],
      limit: 10,
      raw: false,
    });

    res.json({
      stats: {
        byAction,
        byResource,
        byUser: byUser.map(u => ({
          userId: u.userId,
          userName: u.user?.name,
          userEmail: u.user?.email,
          count: parseInt(u.dataValues.count),
        })),
      },
    });

  } catch (error) {
    logger.error('Audit log stats error', { error: error.message });
    res.status(500).json({ error: 'Failed to get statistics' });
  }
};
