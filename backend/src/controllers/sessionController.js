/**
 * Session Controller
 */

const {
  Session,
  SessionLog,
  SessionMeterValue,
  ChargingStation,
  Connector,
  EvDriver,
  Tariff,
  QrCode,
  RfidCard,
  AuditLog
} = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const ocppCommands = require('../ocpp/commands');
const { isConnected } = require('../ocpp/server');
const logger = require('../utils/logger');

/**
 * List sessions
 */
exports.list = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      stationId,
      driverId,
      partnerId,
      startDate,
      endDate
    } = req.query;
    const offset = (page - 1) * limit;

    const where = {};

    if (status) {
      where.status = status;
    }

    if (stationId) {
      where.stationId = stationId;
    }

    if (driverId) {
      where.driverId = driverId;
    }

    if (startDate && endDate) {
      where.startTime = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    // Partner scope
    const stationWhere = {};
    if (req.partnerScope) {
      stationWhere.partnerId = req.partnerScope;
    } else if (partnerId) {
      stationWhere.partnerId = partnerId;
    }

    const { count, rows } = await Session.findAndCountAll({
      where,
      include: [
        {
          model: ChargingStation,
          as: 'station',
          where: Object.keys(stationWhere).length > 0 ? stationWhere : undefined,
          attributes: ['id', 'name', 'ocppIdentity'],
          include: [
            { association: 'location', attributes: ['id', 'name', 'address', 'city'] },
          ],
        },
        {
          model: EvDriver,
          as: 'driver',
          attributes: ['id', 'name', 'email', 'phone'],
        },
        {
          model: Tariff,
          as: 'tariff',
          attributes: ['id', 'name', 'energyRate'],
        },
      ],
      limit: parseInt(limit),
      offset,
      order: [['startTime', 'DESC']],
    });

    res.json({
      sessions: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });

  } catch (error) {
    logger.error('List sessions error', { error: error.message });
    res.status(500).json({ error: 'Failed to list sessions' });
  }
};

/**
 * Get session by ID
 */
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;

    const session = await Session.findByPk(id, {
      include: [
        {
          model: ChargingStation,
          as: 'station',
          include: [
            { association: 'location' },
            { association: 'partner', attributes: ['id', 'name'] },
          ],
        },
        { model: Connector, as: 'connector' },
        { model: EvDriver, as: 'driver', attributes: { exclude: ['password'] } },
        { model: Tariff, as: 'tariff' },
        { model: SessionLog, as: 'logs', order: [['createdAt', 'DESC']] },
      ],
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Check partner scope
    if (req.partnerScope && session.station?.partnerId !== req.partnerScope) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ session });

  } catch (error) {
    logger.error('Get session error', { error: error.message });
    res.status(500).json({ error: 'Failed to get session' });
  }
};

/**
 * Start charging session via QR code
 */
exports.startByQR = async (req, res) => {
  try {
    const { qrCode, driverId, idTag } = req.body;

    // Find QR code
    const qr = await QrCode.findOne({
      where: { code: qrCode, isActive: true },
      include: [
        {
          model: Connector,
          as: 'connector',
          include: [
            {
              model: ChargingStation,
              as: 'station',
            },
          ],
        },
      ],
    });

    if (!qr || !qr.connector) {
      return res.status(404).json({ error: 'Invalid QR code' });
    }

    const { connector } = qr;
    const { station } = connector;

    // Check station is connected
    if (!isConnected(station.ocppIdentity)) {
      return res.status(400).json({ error: 'Charging station is offline' });
    }

    // Check connector availability
    if (connector.status !== 'Available' && connector.status !== 'Preparing') {
      return res.status(400).json({ error: 'Connector is not available', status: connector.status });
    }

    // Get driver's RFID or generate temporary one
    let tagId = idTag;
    if (!tagId && driverId) {
      const rfidCard = await RfidCard.findOne({
        where: { driverId, status: 'active' },
      });
      tagId = rfidCard?.cardNumber || `QR_${driverId.slice(0, 8)}`;
    }

    if (!tagId) {
      return res.status(400).json({ error: 'No valid ID tag' });
    }

    // Send remote start
    const success = await ocppCommands.remoteStartTransaction(
      station.ocppIdentity,
      connector.connectorId,
      tagId
    );

    if (!success) {
      return res.status(400).json({ error: 'Failed to start charging' });
    }

    // Audit log
    await AuditLog.create({
      userId: req.user?.id,
      partnerId: station.partnerId,
      action: 'start_session_qr',
      resource: 'session',
      details: { qrCode, connectorId: connector.id, stationId: station.id, driverId },
      ipAddress: req.ip,
    });

    logger.info('QR charging started', { qrCode, stationId: station.id, connectorId: connector.connectorId });

    res.json({
      message: 'Charging started',
      station: { id: station.id, name: station.name },
      connector: { id: connector.id, connectorId: connector.connectorId },
    });

  } catch (error) {
    logger.error('Start by QR error', { error: error.message });
    res.status(500).json({ error: 'Failed to start charging' });
  }
};

/**
 * Stop charging session
 */
exports.stop = async (req, res) => {
  try {
    const { id } = req.params;

    const session = await Session.findByPk(id, {
      include: [
        { model: ChargingStation, as: 'station' },
      ],
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.status !== 'active') {
      return res.status(400).json({ error: 'Session is not active' });
    }

    // Check partner scope
    if (req.partnerScope && session.station?.partnerId !== req.partnerScope) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check station is connected
    if (!isConnected(session.station.ocppIdentity)) {
      return res.status(400).json({ error: 'Charging station is offline' });
    }

    // Generate transaction ID
    const transactionId = parseInt(session.id.replace(/-/g, '').slice(0, 8), 16);

    const success = await ocppCommands.remoteStopTransaction(
      session.station.ocppIdentity,
      transactionId
    );

    if (!success) {
      return res.status(400).json({ error: 'Failed to stop charging' });
    }

    // Create session log
    await SessionLog.create({
      sessionId: session.id,
      event: 'stop_requested',
      data: { requestedBy: req.user?.id, method: 'api' },
    });

    // Audit log
    await AuditLog.create({
      userId: req.user?.id,
      partnerId: session.station?.partnerId,
      action: 'stop_session',
      resource: 'session',
      resourceId: session.id,
      ipAddress: req.ip,
    });

    logger.info('Session stop requested', { sessionId: id, requestedBy: req.user?.id });

    res.json({ message: 'Stop command sent', sessionId: session.id });

  } catch (error) {
    logger.error('Stop session error', { error: error.message });
    res.status(500).json({ error: 'Failed to stop session' });
  }
};

/**
 * Get session meter values
 */
exports.getMeterValues = async (req, res) => {
  try {
    const { id } = req.params;
    const { measurand, limit = 100 } = req.query;

    const where = { sessionId: id };
    if (measurand) {
      where.measurand = measurand;
    }

    const meterValues = await SessionMeterValue.findAll({
      where,
      order: [['timestamp', 'DESC']],
      limit: parseInt(limit),
    });

    res.json({ meterValues });

  } catch (error) {
    logger.error('Get meter values error', { error: error.message });
    res.status(500).json({ error: 'Failed to get meter values' });
  }
};

/**
 * Get active sessions
 */
exports.getActive = async (req, res) => {
  try {
    const { partnerId, stationId } = req.query;

    const where = { status: 'active' };

    if (stationId) {
      where.stationId = stationId;
    }

    const stationWhere = {};
    if (req.partnerScope) {
      stationWhere.partnerId = req.partnerScope;
    } else if (partnerId) {
      stationWhere.partnerId = partnerId;
    }

    const sessions = await Session.findAll({
      where,
      include: [
        {
          model: ChargingStation,
          as: 'station',
          where: Object.keys(stationWhere).length > 0 ? stationWhere : undefined,
          attributes: ['id', 'name', 'ocppIdentity'],
          include: [
            { association: 'location', attributes: ['name', 'address'] },
          ],
        },
        {
          model: EvDriver,
          as: 'driver',
          attributes: ['id', 'name', 'phone'],
        },
      ],
      order: [['startTime', 'DESC']],
    });

    res.json({ sessions });

  } catch (error) {
    logger.error('Get active sessions error', { error: error.message });
    res.status(500).json({ error: 'Failed to get active sessions' });
  }
};

/**
 * Get session statistics
 */
exports.getStats = async (req, res) => {
  try {
    const { partnerId, startDate, endDate } = req.query;

    const where = {};

    if (startDate && endDate) {
      where.startTime = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    const stationWhere = {};
    if (req.partnerScope) {
      stationWhere.partnerId = req.partnerScope;
    } else if (partnerId) {
      stationWhere.partnerId = partnerId;
    }

    const stats = await Session.findOne({
      where,
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('Session.id')), 'totalSessions'],
        [sequelize.fn('SUM', sequelize.col('energyDelivered')), 'totalEnergy'],
        [sequelize.fn('SUM', sequelize.col('totalCost')), 'totalRevenue'],
        [sequelize.fn('AVG', sequelize.col('duration')), 'avgDuration'],
        [sequelize.fn('AVG', sequelize.col('energyDelivered')), 'avgEnergy'],
      ],
      include: [
        {
          model: ChargingStation,
          as: 'station',
          where: Object.keys(stationWhere).length > 0 ? stationWhere : undefined,
          attributes: [],
        },
      ],
      raw: true,
    });

    const activeSessions = await Session.count({
      where: { ...where, status: 'active' },
      include: [
        {
          model: ChargingStation,
          as: 'station',
          where: Object.keys(stationWhere).length > 0 ? stationWhere : undefined,
          attributes: [],
        },
      ],
    });

    // Sessions by status
    const byStatus = await Session.findAll({
      where,
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('Session.id')), 'count'],
      ],
      include: [
        {
          model: ChargingStation,
          as: 'station',
          where: Object.keys(stationWhere).length > 0 ? stationWhere : undefined,
          attributes: [],
        },
      ],
      group: ['status'],
      raw: true,
    });

    res.json({
      stats: {
        totalSessions: parseInt(stats?.totalSessions || 0),
        totalEnergy: parseFloat(stats?.totalEnergy || 0).toFixed(2),
        totalRevenue: parseFloat(stats?.totalRevenue || 0).toFixed(2),
        avgDuration: Math.round(stats?.avgDuration || 0),
        avgEnergy: parseFloat(stats?.avgEnergy || 0).toFixed(2),
        activeSessions,
        byStatus,
      },
    });

  } catch (error) {
    logger.error('Get session stats error', { error: error.message });
    res.status(500).json({ error: 'Failed to get statistics' });
  }
};

/**
 * Get session logs
 */
exports.getLogs = async (req, res) => {
  try {
    const { id } = req.params;

    const logs = await SessionLog.findAll({
      where: { sessionId: id },
      order: [['createdAt', 'DESC']],
    });

    res.json({ logs });

  } catch (error) {
    logger.error('Get session logs error', { error: error.message });
    res.status(500).json({ error: 'Failed to get logs' });
  }
};
