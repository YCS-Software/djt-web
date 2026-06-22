/**
 * Location Controller
 */

const { Location, ChargingStation, Partner, AuditLog } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const logger = require('../utils/logger');

/**
 * List locations
 */
exports.list = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      city,
      state,
      partnerId,
      lat,
      lng,
      radius
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
        { address: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (city) {
      where.city = { [Op.iLike]: city };
    }

    if (state) {
      where.state = { [Op.iLike]: state };
    }

    let order = [['createdAt', 'DESC']];

    // Geo-based sorting if coordinates provided
    if (lat && lng) {
      // Using Haversine formula for distance
      const distanceQuery = sequelize.literal(`
        (6371 * acos(cos(radians(${parseFloat(lat)}))
        * cos(radians(latitude))
        * cos(radians(longitude) - radians(${parseFloat(lng)}))
        + sin(radians(${parseFloat(lat)}))
        * sin(radians(latitude))))
      `);

      if (radius) {
        where[Op.and] = sequelize.where(distanceQuery, { [Op.lte]: parseFloat(radius) });
      }

      order = [[distanceQuery, 'ASC']];
    }

    const { count, rows } = await Location.findAndCountAll({
      where,
      include: [
        {
          model: ChargingStation,
          as: 'stations',
          attributes: ['id', 'name', 'status', 'isOnline'],
        },
        {
          model: Partner,
          as: 'partner',
          attributes: ['id', 'name'],
        },
      ],
      limit: parseInt(limit),
      offset,
      order,
    });

    res.json({
      locations: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });

  } catch (error) {
    logger.error('List locations error', { error: error.message });
    res.status(500).json({ error: 'Failed to list locations' });
  }
};

/**
 * Get location by ID
 */
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;

    const location = await Location.findByPk(id, {
      include: [
        {
          model: ChargingStation,
          as: 'stations',
          include: [{ association: 'connectors' }],
        },
        {
          model: Partner,
          as: 'partner',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    // Check partner scope
    if (req.partnerScope && location.partnerId !== req.partnerScope) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ location });

  } catch (error) {
    logger.error('Get location error', { error: error.message });
    res.status(500).json({ error: 'Failed to get location' });
  }
};

/**
 * Create location
 */
exports.create = async (req, res) => {
  try {
    const {
      name,
      address,
      city,
      state,
      pincode,
      country = 'India',
      latitude,
      longitude,
      partnerId,
      amenities,
      operatingHours,
      images,
      contactPhone,
      contactEmail,
    } = req.body;

    const location = await Location.create({
      name,
      address,
      city,
      state,
      pincode,
      country,
      latitude,
      longitude,
      partnerId: req.partnerScope || partnerId,
      amenities,
      operatingHours,
      images,
      contactPhone,
      contactEmail,
      status: 'active',
    });

    // Audit log
    await AuditLog.create({
      userId: req.user.id,
      partnerId: req.partnerScope || partnerId,
      action: 'create',
      resource: 'location',
      resourceId: location.id,
      details: { name, address, city },
      ipAddress: req.ip,
    });

    const createdLocation = await Location.findByPk(location.id, {
      include: [{ model: Partner, as: 'partner', attributes: ['id', 'name'] }],
    });

    logger.info('Location created', { locationId: location.id, createdBy: req.user.id });

    res.status(201).json({ location: createdLocation });

  } catch (error) {
    logger.error('Create location error', { error: error.message });
    res.status(500).json({ error: 'Failed to create location' });
  }
};

/**
 * Update location
 */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const location = await Location.findByPk(id);

    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    // Check partner scope
    if (req.partnerScope && location.partnerId !== req.partnerScope) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await location.update(updates);

    // Audit log
    await AuditLog.create({
      userId: req.user.id,
      partnerId: location.partnerId,
      action: 'update',
      resource: 'location',
      resourceId: location.id,
      details: updates,
      ipAddress: req.ip,
    });

    const updatedLocation = await Location.findByPk(id, {
      include: [
        { model: ChargingStation, as: 'stations' },
        { model: Partner, as: 'partner', attributes: ['id', 'name'] },
      ],
    });

    logger.info('Location updated', { locationId: id, updatedBy: req.user.id });

    res.json({ location: updatedLocation });

  } catch (error) {
    logger.error('Update location error', { error: error.message });
    res.status(500).json({ error: 'Failed to update location' });
  }
};

/**
 * Delete location
 */
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    const location = await Location.findByPk(id);

    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    // Check partner scope
    if (req.partnerScope && location.partnerId !== req.partnerScope) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check for active stations
    const stationCount = await ChargingStation.count({
      where: { locationId: id },
    });

    if (stationCount > 0) {
      return res.status(400).json({
        error: 'Cannot delete location with charging stations',
        stationCount,
      });
    }

    await location.destroy();

    // Audit log
    await AuditLog.create({
      userId: req.user.id,
      partnerId: location.partnerId,
      action: 'delete',
      resource: 'location',
      resourceId: id,
      ipAddress: req.ip,
    });

    logger.info('Location deleted', { locationId: id, deletedBy: req.user.id });

    res.json({ message: 'Location deleted successfully' });

  } catch (error) {
    logger.error('Delete location error', { error: error.message });
    res.status(500).json({ error: 'Failed to delete location' });
  }
};

/**
 * Get nearby locations
 */
exports.getNearby = async (req, res) => {
  try {
    const { lat, lng, radius = 10, limit = 20 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: 'Latitude and longitude required' });
    }

    const distanceQuery = sequelize.literal(`
      (6371 * acos(cos(radians(${parseFloat(lat)}))
      * cos(radians(latitude))
      * cos(radians(longitude) - radians(${parseFloat(lng)}))
      + sin(radians(${parseFloat(lat)}))
      * sin(radians(latitude))))
    `);

    const locations = await Location.findAll({
      where: sequelize.where(distanceQuery, { [Op.lte]: parseFloat(radius) }),
      include: [
        {
          model: ChargingStation,
          as: 'stations',
          attributes: ['id', 'name', 'status', 'isOnline'],
          include: [{ association: 'connectors', attributes: ['id', 'type', 'status', 'power'] }],
        },
      ],
      attributes: {
        include: [[distanceQuery, 'distance']],
      },
      order: [[distanceQuery, 'ASC']],
      limit: parseInt(limit),
    });

    res.json({ locations });

  } catch (error) {
    logger.error('Get nearby locations error', { error: error.message });
    res.status(500).json({ error: 'Failed to get nearby locations' });
  }
};

/**
 * Get location statistics
 */
exports.getStats = async (req, res) => {
  try {
    const { id } = req.params;

    const location = await Location.findByPk(id, {
      include: [
        {
          model: ChargingStation,
          as: 'stations',
          attributes: ['id', 'status', 'isOnline'],
        },
      ],
    });

    if (!location) {
      return res.status(404).json({ error: 'Location not found' });
    }

    const stationIds = location.stations.map(s => s.id);

    // Get session statistics
    const sessionStats = await require('../models').Session.findOne({
      where: { stationId: { [Op.in]: stationIds } },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalSessions'],
        [sequelize.fn('SUM', sequelize.col('energyDelivered')), 'totalEnergy'],
        [sequelize.fn('SUM', sequelize.col('totalCost')), 'totalRevenue'],
      ],
      raw: true,
    });

    res.json({
      stats: {
        stationCount: location.stations.length,
        onlineStations: location.stations.filter(s => s.isOnline).length,
        totalSessions: parseInt(sessionStats?.totalSessions || 0),
        totalEnergy: parseFloat(sessionStats?.totalEnergy || 0).toFixed(2),
        totalRevenue: parseFloat(sessionStats?.totalRevenue || 0).toFixed(2),
      },
    });

  } catch (error) {
    logger.error('Get location stats error', { error: error.message });
    res.status(500).json({ error: 'Failed to get statistics' });
  }
};
