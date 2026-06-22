/**
 * Charging Station Controller
 */

const {
  ChargingStation,
  Connector,
  Location,
  Partner,
  Session,
  Tariff,
  AuditLog
} = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const ocppCommands = require('../ocpp/commands');
const { isConnected } = require('../ocpp/server');
const logger = require('../utils/logger');

/**
 * List stations
 */
exports.list = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      isOnline,
      locationId,
      partnerId
    } = req.query;
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
        { ocppIdentity: { [Op.iLike]: `%${search}%` } },
        { serialNumber: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (isOnline !== undefined) {
      where.isOnline = isOnline === 'true';
    }

    if (locationId) {
      where.locationId = locationId;
    }

    const { count, rows } = await ChargingStation.findAndCountAll({
      where,
      include: [
        { model: Connector, as: 'connectors' },
        { model: Location, as: 'location', attributes: ['id', 'name', 'address', 'city'] },
        { model: Partner, as: 'partner', attributes: ['id', 'name'] },
        { model: Tariff, as: 'tariff', attributes: ['id', 'name', 'energyRate'] },
      ],
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.json({
      stations: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });

  } catch (error) {
    logger.error('List stations error', { error: error.message });
    res.status(500).json({ error: 'Failed to list stations' });
  }
};

/**
 * Get station by ID
 */
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;

    const station = await ChargingStation.findByPk(id, {
      include: [
        { model: Connector, as: 'connectors' },
        { model: Location, as: 'location' },
        { model: Partner, as: 'partner' },
        { model: Tariff, as: 'tariff' },
      ],
    });

    if (!station) {
      return res.status(404).json({ error: 'Station not found' });
    }

    // Check partner scope
    if (req.partnerScope && station.partnerId !== req.partnerScope) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Add connection status
    const stationData = station.toJSON();
    stationData.isConnected = isConnected(station.ocppIdentity);

    res.json({ station: stationData });

  } catch (error) {
    logger.error('Get station error', { error: error.message });
    res.status(500).json({ error: 'Failed to get station' });
  }
};

/**
 * Create station
 */
exports.create = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const {
      name,
      ocppIdentity,
      locationId,
      partnerId,
      tariffId,
      vendor,
      model,
      maxPower,
      connectors = [],
    } = req.body;

    // Check OCPP identity uniqueness
    const existing = await ChargingStation.findOne({ where: { ocppIdentity } });
    if (existing) {
      await t.rollback();
      return res.status(400).json({ error: 'OCPP identity already exists' });
    }

    // Create station
    const station = await ChargingStation.create({
      name,
      ocppIdentity,
      locationId,
      partnerId: req.partnerScope || partnerId,
      tariffId,
      vendor,
      model,
      maxPower,
      status: 'Available',
      isOnline: false,
    }, { transaction: t });

    // Create connectors
    for (const connector of connectors) {
      await Connector.create({
        stationId: station.id,
        connectorId: connector.connectorId,
        type: connector.type,
        power: connector.power,
        status: 'Available',
      }, { transaction: t });
    }

    await t.commit();

    // Audit log
    await AuditLog.create({
      userId: req.user.id,
      partnerId: station.partnerId,
      action: 'create',
      resource: 'station',
      resourceId: station.id,
      details: { name, ocppIdentity },
      ipAddress: req.ip,
    });

    const createdStation = await ChargingStation.findByPk(station.id, {
      include: [
        { model: Connector, as: 'connectors' },
        { model: Location, as: 'location' },
      ],
    });

    logger.info('Station created', { stationId: station.id, createdBy: req.user.id });

    res.status(201).json({ station: createdStation });

  } catch (error) {
    await t.rollback();
    logger.error('Create station error', { error: error.message });
    res.status(500).json({ error: 'Failed to create station' });
  }
};

/**
 * Update station
 */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const station = await ChargingStation.findByPk(id);

    if (!station) {
      return res.status(404).json({ error: 'Station not found' });
    }

    // Check partner scope
    if (req.partnerScope && station.partnerId !== req.partnerScope) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check OCPP identity uniqueness if changed
    if (updates.ocppIdentity && updates.ocppIdentity !== station.ocppIdentity) {
      const existing = await ChargingStation.findOne({
        where: { ocppIdentity: updates.ocppIdentity },
      });
      if (existing) {
        return res.status(400).json({ error: 'OCPP identity already exists' });
      }
    }

    await station.update(updates);

    // Audit log
    await AuditLog.create({
      userId: req.user.id,
      partnerId: station.partnerId,
      action: 'update',
      resource: 'station',
      resourceId: station.id,
      details: updates,
      ipAddress: req.ip,
    });

    const updatedStation = await ChargingStation.findByPk(id, {
      include: [
        { model: Connector, as: 'connectors' },
        { model: Location, as: 'location' },
      ],
    });

    logger.info('Station updated', { stationId: id, updatedBy: req.user.id });

    res.json({ station: updatedStation });

  } catch (error) {
    logger.error('Update station error', { error: error.message });
    res.status(500).json({ error: 'Failed to update station' });
  }
};

/**
 * Delete station
 */
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    const station = await ChargingStation.findByPk(id);

    if (!station) {
      return res.status(404).json({ error: 'Station not found' });
    }

    // Check partner scope
    if (req.partnerScope && station.partnerId !== req.partnerScope) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check for active sessions
    const activeSessions = await Session.count({
      where: { stationId: id, status: 'active' },
    });

    if (activeSessions > 0) {
      return res.status(400).json({
        error: 'Cannot delete station with active sessions',
        activeSessions,
      });
    }

    // Soft delete - mark as decommissioned
    await station.update({ status: 'decommissioned', deletedAt: new Date() });

    // Audit log
    await AuditLog.create({
      userId: req.user.id,
      partnerId: station.partnerId,
      action: 'delete',
      resource: 'station',
      resourceId: id,
      ipAddress: req.ip,
    });

    logger.info('Station deleted', { stationId: id, deletedBy: req.user.id });

    res.json({ message: 'Station deleted successfully' });

  } catch (error) {
    logger.error('Delete station error', { error: error.message });
    res.status(500).json({ error: 'Failed to delete station' });
  }
};

/**
 * Reset station
 */
exports.reset = async (req, res) => {
  try {
    const { id } = req.params;
    const { type = 'Soft' } = req.body;

    const station = await ChargingStation.findByPk(id);

    if (!station) {
      return res.status(404).json({ error: 'Station not found' });
    }

    // Check partner scope
    if (req.partnerScope && station.partnerId !== req.partnerScope) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if station is connected
    if (!isConnected(station.ocppIdentity)) {
      return res.status(400).json({ error: 'Station is not connected' });
    }

    const success = await ocppCommands.reset(station.ocppIdentity, type);

    // Audit log
    await AuditLog.create({
      userId: req.user.id,
      partnerId: station.partnerId,
      action: 'reset',
      resource: 'station',
      resourceId: station.id,
      details: { type, success },
      ipAddress: req.ip,
    });

    logger.info('Station reset', { stationId: id, type, success });

    res.json({ success, message: success ? 'Reset command sent' : 'Reset command rejected' });

  } catch (error) {
    logger.error('Reset station error', { error: error.message });
    res.status(500).json({ error: 'Failed to reset station' });
  }
};

/**
 * Remote start transaction
 */
exports.remoteStart = async (req, res) => {
  try {
    const { id } = req.params;
    const { connectorId, idTag } = req.body;

    const station = await ChargingStation.findByPk(id);

    if (!station) {
      return res.status(404).json({ error: 'Station not found' });
    }

    // Check partner scope
    if (req.partnerScope && station.partnerId !== req.partnerScope) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!isConnected(station.ocppIdentity)) {
      return res.status(400).json({ error: 'Station is not connected' });
    }

    const success = await ocppCommands.remoteStartTransaction(
      station.ocppIdentity,
      connectorId,
      idTag
    );

    // Audit log
    await AuditLog.create({
      userId: req.user.id,
      partnerId: station.partnerId,
      action: 'remote_start',
      resource: 'station',
      resourceId: station.id,
      details: { connectorId, idTag, success },
      ipAddress: req.ip,
    });

    logger.info('Remote start sent', { stationId: id, connectorId, success });

    res.json({ success, message: success ? 'Start command accepted' : 'Start command rejected' });

  } catch (error) {
    logger.error('Remote start error', { error: error.message });
    res.status(500).json({ error: 'Failed to start charging' });
  }
};

/**
 * Remote stop transaction
 */
exports.remoteStop = async (req, res) => {
  try {
    const { id } = req.params;
    const { sessionId } = req.body;

    const station = await ChargingStation.findByPk(id);

    if (!station) {
      return res.status(404).json({ error: 'Station not found' });
    }

    // Check partner scope
    if (req.partnerScope && station.partnerId !== req.partnerScope) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!isConnected(station.ocppIdentity)) {
      return res.status(400).json({ error: 'Station is not connected' });
    }

    // Get session to find transaction ID
    const session = await Session.findByPk(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Generate transaction ID from session UUID
    const transactionId = parseInt(session.id.replace(/-/g, '').slice(0, 8), 16);

    const success = await ocppCommands.remoteStopTransaction(
      station.ocppIdentity,
      transactionId
    );

    // Audit log
    await AuditLog.create({
      userId: req.user.id,
      partnerId: station.partnerId,
      action: 'remote_stop',
      resource: 'station',
      resourceId: station.id,
      details: { sessionId, transactionId, success },
      ipAddress: req.ip,
    });

    logger.info('Remote stop sent', { stationId: id, sessionId, success });

    res.json({ success, message: success ? 'Stop command accepted' : 'Stop command rejected' });

  } catch (error) {
    logger.error('Remote stop error', { error: error.message });
    res.status(500).json({ error: 'Failed to stop charging' });
  }
};

/**
 * Get station configuration
 */
exports.getConfiguration = async (req, res) => {
  try {
    const { id } = req.params;

    const station = await ChargingStation.findByPk(id);

    if (!station) {
      return res.status(404).json({ error: 'Station not found' });
    }

    if (!isConnected(station.ocppIdentity)) {
      return res.status(400).json({ error: 'Station is not connected' });
    }

    const config = await ocppCommands.getConfiguration(station.ocppIdentity);

    res.json({ configuration: config });

  } catch (error) {
    logger.error('Get configuration error', { error: error.message });
    res.status(500).json({ error: 'Failed to get configuration' });
  }
};

/**
 * Change station configuration
 */
exports.changeConfiguration = async (req, res) => {
  try {
    const { id } = req.params;
    const { key, value } = req.body;

    const station = await ChargingStation.findByPk(id);

    if (!station) {
      return res.status(404).json({ error: 'Station not found' });
    }

    // Check partner scope
    if (req.partnerScope && station.partnerId !== req.partnerScope) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!isConnected(station.ocppIdentity)) {
      return res.status(400).json({ error: 'Station is not connected' });
    }

    const success = await ocppCommands.changeConfiguration(station.ocppIdentity, key, value);

    // Audit log
    await AuditLog.create({
      userId: req.user.id,
      partnerId: station.partnerId,
      action: 'change_configuration',
      resource: 'station',
      resourceId: station.id,
      details: { key, value, success },
      ipAddress: req.ip,
    });

    res.json({ success, message: success ? 'Configuration changed' : 'Configuration change rejected' });

  } catch (error) {
    logger.error('Change configuration error', { error: error.message });
    res.status(500).json({ error: 'Failed to change configuration' });
  }
};

/**
 * Get station statistics
 */
exports.getStats = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    const station = await ChargingStation.findByPk(id);

    if (!station) {
      return res.status(404).json({ error: 'Station not found' });
    }

    const where = { stationId: id };
    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    const stats = await Session.findOne({
      where,
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalSessions'],
        [sequelize.fn('SUM', sequelize.col('energyDelivered')), 'totalEnergy'],
        [sequelize.fn('SUM', sequelize.col('totalCost')), 'totalRevenue'],
        [sequelize.fn('AVG', sequelize.col('duration')), 'avgDuration'],
      ],
      raw: true,
    });

    const activeSessions = await Session.count({
      where: { stationId: id, status: 'active' },
    });

    res.json({
      stats: {
        totalSessions: parseInt(stats?.totalSessions || 0),
        totalEnergy: parseFloat(stats?.totalEnergy || 0).toFixed(2),
        totalRevenue: parseFloat(stats?.totalRevenue || 0).toFixed(2),
        avgDuration: Math.round(stats?.avgDuration || 0),
        activeSessions,
        isOnline: station.isOnline,
        isConnected: isConnected(station.ocppIdentity),
      },
    });

  } catch (error) {
    logger.error('Get station stats error', { error: error.message });
    res.status(500).json({ error: 'Failed to get statistics' });
  }
};
