/**
 * Tariff Controller
 */

const { Tariff, ChargingStation, Partner, AuditLog } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

/**
 * List tariffs
 */
exports.list = async (req, res) => {
  try {
    const { page = 1, limit = 20, partnerId, isActive } = req.query;
    const offset = (page - 1) * limit;

    const where = {};

    // Partner scope
    if (req.partnerScope) {
      where.partnerId = req.partnerScope;
    } else if (partnerId) {
      where.partnerId = partnerId;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    const { count, rows } = await Tariff.findAndCountAll({
      where,
      include: [
        { model: Partner, as: 'partner', attributes: ['id', 'name'] },
      ],
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.json({
      tariffs: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });

  } catch (error) {
    logger.error('List tariffs error', { error: error.message });
    res.status(500).json({ error: 'Failed to list tariffs' });
  }
};

/**
 * Get tariff by ID
 */
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;

    const tariff = await Tariff.findByPk(id, {
      include: [
        { model: Partner, as: 'partner', attributes: ['id', 'name'] },
        { model: ChargingStation, as: 'stations', attributes: ['id', 'name'] },
      ],
    });

    if (!tariff) {
      return res.status(404).json({ error: 'Tariff not found' });
    }

    // Check partner scope
    if (req.partnerScope && tariff.partnerId !== req.partnerScope) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ tariff });

  } catch (error) {
    logger.error('Get tariff error', { error: error.message });
    res.status(500).json({ error: 'Failed to get tariff' });
  }
};

/**
 * Create tariff
 */
exports.create = async (req, res) => {
  try {
    const {
      name,
      description,
      partnerId,
      energyRate,
      timeRate,
      parkingRate,
      flatFee,
      minimumCharge,
      currency = 'INR',
      freeParkingMinutes = 0,
      timeBasedPricing,
      connectorTypePricing,
    } = req.body;

    const tariff = await Tariff.create({
      name,
      description,
      partnerId: req.partnerScope || partnerId,
      energyRate,
      timeRate,
      parkingRate,
      flatFee,
      minimumCharge,
      currency,
      freeParkingMinutes,
      timeBasedPricing,
      connectorTypePricing,
      isActive: true,
    });

    // Audit log
    await AuditLog.create({
      userId: req.user.id,
      partnerId: tariff.partnerId,
      action: 'create',
      resource: 'tariff',
      resourceId: tariff.id,
      details: { name, energyRate },
      ipAddress: req.ip,
    });

    logger.info('Tariff created', { tariffId: tariff.id, createdBy: req.user.id });

    res.status(201).json({ tariff });

  } catch (error) {
    logger.error('Create tariff error', { error: error.message });
    res.status(500).json({ error: 'Failed to create tariff' });
  }
};

/**
 * Update tariff
 */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const tariff = await Tariff.findByPk(id);

    if (!tariff) {
      return res.status(404).json({ error: 'Tariff not found' });
    }

    // Check partner scope
    if (req.partnerScope && tariff.partnerId !== req.partnerScope) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await tariff.update(updates);

    // Audit log
    await AuditLog.create({
      userId: req.user.id,
      partnerId: tariff.partnerId,
      action: 'update',
      resource: 'tariff',
      resourceId: tariff.id,
      details: updates,
      ipAddress: req.ip,
    });

    const updatedTariff = await Tariff.findByPk(id, {
      include: [{ model: Partner, as: 'partner', attributes: ['id', 'name'] }],
    });

    logger.info('Tariff updated', { tariffId: id, updatedBy: req.user.id });

    res.json({ tariff: updatedTariff });

  } catch (error) {
    logger.error('Update tariff error', { error: error.message });
    res.status(500).json({ error: 'Failed to update tariff' });
  }
};

/**
 * Delete tariff
 */
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    const tariff = await Tariff.findByPk(id);

    if (!tariff) {
      return res.status(404).json({ error: 'Tariff not found' });
    }

    // Check partner scope
    if (req.partnerScope && tariff.partnerId !== req.partnerScope) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if tariff is in use
    const stationCount = await ChargingStation.count({
      where: { tariffId: id },
    });

    if (stationCount > 0) {
      return res.status(400).json({
        error: 'Cannot delete tariff in use by stations',
        stationCount,
      });
    }

    await tariff.destroy();

    // Audit log
    await AuditLog.create({
      userId: req.user.id,
      partnerId: tariff.partnerId,
      action: 'delete',
      resource: 'tariff',
      resourceId: id,
      ipAddress: req.ip,
    });

    logger.info('Tariff deleted', { tariffId: id, deletedBy: req.user.id });

    res.json({ message: 'Tariff deleted successfully' });

  } catch (error) {
    logger.error('Delete tariff error', { error: error.message });
    res.status(500).json({ error: 'Failed to delete tariff' });
  }
};

/**
 * Assign tariff to stations
 */
exports.assignToStations = async (req, res) => {
  try {
    const { id } = req.params;
    const { stationIds } = req.body;

    const tariff = await Tariff.findByPk(id);

    if (!tariff) {
      return res.status(404).json({ error: 'Tariff not found' });
    }

    // Check partner scope
    if (req.partnerScope && tariff.partnerId !== req.partnerScope) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update stations
    const [updated] = await ChargingStation.update(
      { tariffId: id },
      {
        where: {
          id: { [Op.in]: stationIds },
          partnerId: tariff.partnerId,
        },
      }
    );

    // Audit log
    await AuditLog.create({
      userId: req.user.id,
      partnerId: tariff.partnerId,
      action: 'assign_tariff',
      resource: 'tariff',
      resourceId: id,
      details: { stationIds, updated },
      ipAddress: req.ip,
    });

    logger.info('Tariff assigned to stations', { tariffId: id, stationsUpdated: updated });

    res.json({ message: `Tariff assigned to ${updated} stations` });

  } catch (error) {
    logger.error('Assign tariff error', { error: error.message });
    res.status(500).json({ error: 'Failed to assign tariff' });
  }
};

/**
 * Calculate cost preview
 */
exports.calculateCost = async (req, res) => {
  try {
    const { id } = req.params;
    const { energyKwh, durationMinutes, connectorType } = req.body;

    const tariff = await Tariff.findByPk(id);

    if (!tariff) {
      return res.status(404).json({ error: 'Tariff not found' });
    }

    let energyCost = energyKwh * (tariff.energyRate || 0);
    let timeCost = durationMinutes * (tariff.timeRate || 0);
    let parkingCost = 0;

    // Apply connector type pricing if available
    if (connectorType && tariff.connectorTypePricing?.[connectorType]) {
      energyCost = energyKwh * (tariff.connectorTypePricing[connectorType].energyRate || tariff.energyRate);
    }

    // Calculate parking cost
    const freeParkingMinutes = tariff.freeParkingMinutes || 0;
    if (durationMinutes > freeParkingMinutes && tariff.parkingRate) {
      parkingCost = (durationMinutes - freeParkingMinutes) * tariff.parkingRate;
    }

    let totalCost = energyCost + timeCost + parkingCost + (tariff.flatFee || 0);

    // Apply minimum charge
    if (tariff.minimumCharge && totalCost < tariff.minimumCharge) {
      totalCost = tariff.minimumCharge;
    }

    res.json({
      breakdown: {
        energyCost: parseFloat(energyCost.toFixed(2)),
        timeCost: parseFloat(timeCost.toFixed(2)),
        parkingCost: parseFloat(parkingCost.toFixed(2)),
        flatFee: tariff.flatFee || 0,
        totalCost: parseFloat(totalCost.toFixed(2)),
        currency: tariff.currency,
      },
    });

  } catch (error) {
    logger.error('Calculate cost error', { error: error.message });
    res.status(500).json({ error: 'Failed to calculate cost' });
  }
};
