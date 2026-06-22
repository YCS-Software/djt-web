/**
 * OCPP Log Controller
 */

const { OcppLog, ChargingStation } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

/**
 * List OCPP logs
 */
exports.list = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      stationId,
      action,
      direction,
      startDate,
      endDate
    } = req.query;
    const offset = (page - 1) * limit;

    const where = {};

    if (stationId) {
      where.stationId = stationId;
    }

    if (action) {
      where.action = action;
    }

    if (direction) {
      where.direction = direction;
    }

    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    // Partner scope
    const stationWhere = {};
    if (req.partnerScope) {
      stationWhere.partnerId = req.partnerScope;
    }

    const { count, rows } = await OcppLog.findAndCountAll({
      where,
      include: [
        {
          model: ChargingStation,
          as: 'station',
          where: Object.keys(stationWhere).length > 0 ? stationWhere : undefined,
          attributes: ['id', 'name', 'ocppIdentity'],
        },
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
    logger.error('List OCPP logs error', { error: error.message });
    res.status(500).json({ error: 'Failed to list logs' });
  }
};

/**
 * Get OCPP log by ID
 */
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;

    const log = await OcppLog.findByPk(id, {
      include: [
        {
          model: ChargingStation,
          as: 'station',
          attributes: ['id', 'name', 'ocppIdentity', 'partnerId'],
        },
      ],
    });

    if (!log) {
      return res.status(404).json({ error: 'Log not found' });
    }

    // Check partner scope
    if (req.partnerScope && log.station?.partnerId !== req.partnerScope) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ log });

  } catch (error) {
    logger.error('Get OCPP log error', { error: error.message });
    res.status(500).json({ error: 'Failed to get log' });
  }
};

/**
 * Get logs for a specific station
 */
exports.getByStation = async (req, res) => {
  try {
    const { stationId } = req.params;
    const { page = 1, limit = 50, action, direction } = req.query;
    const offset = (page - 1) * limit;

    const where = { stationId };

    if (action) {
      where.action = action;
    }

    if (direction) {
      where.direction = direction;
    }

    const { count, rows } = await OcppLog.findAndCountAll({
      where,
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
    logger.error('Get station OCPP logs error', { error: error.message });
    res.status(500).json({ error: 'Failed to get logs' });
  }
};

/**
 * Search logs
 */
exports.search = async (req, res) => {
  try {
    const { query, stationId, startDate, endDate, limit = 100 } = req.query;

    const where = {};

    if (stationId) {
      where.stationId = stationId;
    }

    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    // Search in payload JSONB
    if (query) {
      where[Op.or] = [
        { ocppIdentity: { [Op.iLike]: `%${query}%` } },
        { action: { [Op.iLike]: `%${query}%` } },
        { messageId: { [Op.iLike]: `%${query}%` } },
      ];
    }

    const logs = await OcppLog.findAll({
      where,
      include: [
        {
          model: ChargingStation,
          as: 'station',
          attributes: ['id', 'name'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
    });

    res.json({ logs });

  } catch (error) {
    logger.error('Search OCPP logs error', { error: error.message });
    res.status(500).json({ error: 'Failed to search logs' });
  }
};

/**
 * Get OCPP log statistics
 */
exports.getStats = async (req, res) => {
  try {
    const { stationId, startDate, endDate } = req.query;
    const sequelize = require('../config/database');

    const where = {};

    if (stationId) {
      where.stationId = stationId;
    }

    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    // Partner scope
    const stationWhere = {};
    if (req.partnerScope) {
      stationWhere.partnerId = req.partnerScope;
    }

    // Messages by action
    const byAction = await OcppLog.findAll({
      where,
      attributes: [
        'action',
        [sequelize.fn('COUNT', sequelize.col('OcppLog.id')), 'count'],
      ],
      include: [{
        model: ChargingStation,
        as: 'station',
        where: Object.keys(stationWhere).length > 0 ? stationWhere : undefined,
        attributes: [],
      }],
      group: ['OcppLog.action'],
      order: [[sequelize.fn('COUNT', sequelize.col('OcppLog.id')), 'DESC']],
      raw: true,
    });

    // Messages by direction
    const byDirection = await OcppLog.findAll({
      where,
      attributes: [
        'direction',
        [sequelize.fn('COUNT', sequelize.col('OcppLog.id')), 'count'],
      ],
      include: [{
        model: ChargingStation,
        as: 'station',
        where: Object.keys(stationWhere).length > 0 ? stationWhere : undefined,
        attributes: [],
      }],
      group: ['OcppLog.direction'],
      raw: true,
    });

    // Messages by message type
    const byMessageType = await OcppLog.findAll({
      where,
      attributes: [
        'messageType',
        [sequelize.fn('COUNT', sequelize.col('OcppLog.id')), 'count'],
      ],
      include: [{
        model: ChargingStation,
        as: 'station',
        where: Object.keys(stationWhere).length > 0 ? stationWhere : undefined,
        attributes: [],
      }],
      group: ['OcppLog.messageType'],
      raw: true,
    });

    // Total count
    const total = await OcppLog.count({
      where,
      include: [{
        model: ChargingStation,
        as: 'station',
        where: Object.keys(stationWhere).length > 0 ? stationWhere : undefined,
        attributes: [],
      }],
    });

    res.json({
      stats: {
        total,
        byAction,
        byDirection,
        byMessageType,
      },
    });

  } catch (error) {
    logger.error('OCPP log stats error', { error: error.message });
    res.status(500).json({ error: 'Failed to get statistics' });
  }
};

/**
 * Get conversation (request + response pair)
 */
exports.getConversation = async (req, res) => {
  try {
    const { messageId } = req.params;

    const logs = await OcppLog.findAll({
      where: { messageId },
      include: [
        {
          model: ChargingStation,
          as: 'station',
          attributes: ['id', 'name', 'ocppIdentity'],
        },
      ],
      order: [['createdAt', 'ASC']],
    });

    if (logs.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json({ conversation: logs });

  } catch (error) {
    logger.error('Get conversation error', { error: error.message });
    res.status(500).json({ error: 'Failed to get conversation' });
  }
};
