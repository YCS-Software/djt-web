/**
 * Connector Controller
 */

const { Connector, ChargingStation, QrCode, AuditLog } = require('../models');
const { Op } = require('sequelize');
const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * List connectors
 */
exports.list = async (req, res) => {
  try {
    const { page = 1, limit = 20, stationId, status, type } = req.query;
    const offset = (page - 1) * limit;

    const where = {};

    if (stationId) {
      where.stationId = stationId;
    }

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    // Partner scope
    const include = [
      {
        model: ChargingStation,
        as: 'station',
        attributes: ['id', 'name', 'ocppIdentity', 'partnerId'],
        ...(req.partnerScope && { where: { partnerId: req.partnerScope } }),
      },
      {
        model: QrCode,
        as: 'qrCode',
        attributes: ['id', 'code', 'url'],
      },
    ];

    const { count, rows } = await Connector.findAndCountAll({
      where,
      include,
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.json({
      connectors: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });

  } catch (error) {
    logger.error('List connectors error', { error: error.message });
    res.status(500).json({ error: 'Failed to list connectors' });
  }
};

/**
 * Get connector by ID
 */
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;

    const connector = await Connector.findByPk(id, {
      include: [
        {
          model: ChargingStation,
          as: 'station',
          include: [{ association: 'location' }],
        },
        { model: QrCode, as: 'qrCode' },
      ],
    });

    if (!connector) {
      return res.status(404).json({ error: 'Connector not found' });
    }

    // Check partner scope
    if (req.partnerScope && connector.station?.partnerId !== req.partnerScope) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ connector });

  } catch (error) {
    logger.error('Get connector error', { error: error.message });
    res.status(500).json({ error: 'Failed to get connector' });
  }
};

/**
 * Create connector
 */
exports.create = async (req, res) => {
  try {
    const { stationId, connectorId, type, power, status = 'Available' } = req.body;

    // Verify station exists and check partner scope
    const station = await ChargingStation.findByPk(stationId);
    if (!station) {
      return res.status(404).json({ error: 'Station not found' });
    }

    if (req.partnerScope && station.partnerId !== req.partnerScope) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check connector ID uniqueness within station
    const existing = await Connector.findOne({
      where: { stationId, connectorId },
    });
    if (existing) {
      return res.status(400).json({ error: 'Connector ID already exists for this station' });
    }

    const connector = await Connector.create({
      stationId,
      connectorId,
      type,
      power,
      status,
    });

    // Generate QR code for connector
    const qrCode = crypto.randomBytes(16).toString('hex');
    const qrUrl = `${process.env.APP_URL || 'https://app.evcharge.com'}/charge/${qrCode}`;

    await QrCode.create({
      connectorId: connector.id,
      stationId,
      code: qrCode,
      url: qrUrl,
      isActive: true,
    });

    // Audit log
    await AuditLog.create({
      userId: req.user.id,
      partnerId: station.partnerId,
      action: 'create',
      resource: 'connector',
      resourceId: connector.id,
      details: { stationId, connectorId, type, power },
      ipAddress: req.ip,
    });

    const createdConnector = await Connector.findByPk(connector.id, {
      include: [
        { model: ChargingStation, as: 'station' },
        { model: QrCode, as: 'qrCode' },
      ],
    });

    logger.info('Connector created', { connectorId: connector.id, createdBy: req.user.id });

    res.status(201).json({ connector: createdConnector });

  } catch (error) {
    logger.error('Create connector error', { error: error.message });
    res.status(500).json({ error: 'Failed to create connector' });
  }
};

/**
 * Update connector
 */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const connector = await Connector.findByPk(id, {
      include: [{ model: ChargingStation, as: 'station' }],
    });

    if (!connector) {
      return res.status(404).json({ error: 'Connector not found' });
    }

    // Check partner scope
    if (req.partnerScope && connector.station?.partnerId !== req.partnerScope) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await connector.update(updates);

    // Audit log
    await AuditLog.create({
      userId: req.user.id,
      partnerId: connector.station?.partnerId,
      action: 'update',
      resource: 'connector',
      resourceId: connector.id,
      details: updates,
      ipAddress: req.ip,
    });

    const updatedConnector = await Connector.findByPk(id, {
      include: [
        { model: ChargingStation, as: 'station' },
        { model: QrCode, as: 'qrCode' },
      ],
    });

    logger.info('Connector updated', { connectorId: id, updatedBy: req.user.id });

    res.json({ connector: updatedConnector });

  } catch (error) {
    logger.error('Update connector error', { error: error.message });
    res.status(500).json({ error: 'Failed to update connector' });
  }
};

/**
 * Delete connector
 */
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    const connector = await Connector.findByPk(id, {
      include: [{ model: ChargingStation, as: 'station' }],
    });

    if (!connector) {
      return res.status(404).json({ error: 'Connector not found' });
    }

    // Check partner scope
    if (req.partnerScope && connector.station?.partnerId !== req.partnerScope) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check for active sessions
    const { Session } = require('../models');
    const activeSessions = await Session.count({
      where: { connectorId: id, status: 'active' },
    });

    if (activeSessions > 0) {
      return res.status(400).json({
        error: 'Cannot delete connector with active sessions',
        activeSessions,
      });
    }

    // Delete associated QR code
    await QrCode.destroy({ where: { connectorId: id } });

    await connector.destroy();

    // Audit log
    await AuditLog.create({
      userId: req.user.id,
      partnerId: connector.station?.partnerId,
      action: 'delete',
      resource: 'connector',
      resourceId: id,
      ipAddress: req.ip,
    });

    logger.info('Connector deleted', { connectorId: id, deletedBy: req.user.id });

    res.json({ message: 'Connector deleted successfully' });

  } catch (error) {
    logger.error('Delete connector error', { error: error.message });
    res.status(500).json({ error: 'Failed to delete connector' });
  }
};

/**
 * Regenerate QR code
 */
exports.regenerateQR = async (req, res) => {
  try {
    const { id } = req.params;

    const connector = await Connector.findByPk(id, {
      include: [
        { model: ChargingStation, as: 'station' },
        { model: QrCode, as: 'qrCode' },
      ],
    });

    if (!connector) {
      return res.status(404).json({ error: 'Connector not found' });
    }

    // Check partner scope
    if (req.partnerScope && connector.station?.partnerId !== req.partnerScope) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Deactivate old QR code
    if (connector.qrCode) {
      await connector.qrCode.update({ isActive: false });
    }

    // Generate new QR code
    const qrCode = crypto.randomBytes(16).toString('hex');
    const qrUrl = `${process.env.APP_URL || 'https://app.evcharge.com'}/charge/${qrCode}`;

    const newQrCode = await QrCode.create({
      connectorId: connector.id,
      stationId: connector.stationId,
      code: qrCode,
      url: qrUrl,
      isActive: true,
    });

    // Audit log
    await AuditLog.create({
      userId: req.user.id,
      partnerId: connector.station?.partnerId,
      action: 'regenerate_qr',
      resource: 'connector',
      resourceId: connector.id,
      details: { newQrCode: qrCode },
      ipAddress: req.ip,
    });

    logger.info('QR code regenerated', { connectorId: id, regeneratedBy: req.user.id });

    res.json({ qrCode: newQrCode });

  } catch (error) {
    logger.error('Regenerate QR error', { error: error.message });
    res.status(500).json({ error: 'Failed to regenerate QR code' });
  }
};

/**
 * Change connector availability
 */
exports.changeAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { available } = req.body;

    const connector = await Connector.findByPk(id, {
      include: [{ model: ChargingStation, as: 'station' }],
    });

    if (!connector) {
      return res.status(404).json({ error: 'Connector not found' });
    }

    // Check partner scope
    if (req.partnerScope && connector.station?.partnerId !== req.partnerScope) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const ocppCommands = require('../ocpp/commands');
    const { isConnected } = require('../ocpp/server');

    if (!isConnected(connector.station.ocppIdentity)) {
      return res.status(400).json({ error: 'Station is not connected' });
    }

    const type = available ? 'Operative' : 'Inoperative';
    const success = await ocppCommands.changeAvailability(
      connector.station.ocppIdentity,
      connector.connectorId,
      type
    );

    // Audit log
    await AuditLog.create({
      userId: req.user.id,
      partnerId: connector.station?.partnerId,
      action: 'change_availability',
      resource: 'connector',
      resourceId: connector.id,
      details: { available, success },
      ipAddress: req.ip,
    });

    res.json({ success, message: success ? 'Availability changed' : 'Command rejected' });

  } catch (error) {
    logger.error('Change availability error', { error: error.message });
    res.status(500).json({ error: 'Failed to change availability' });
  }
};
