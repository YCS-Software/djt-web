/**
 * Dashboard Controller
 */

const {
  Session,
  ChargingStation,
  Connector,
  EvDriver,
  Transaction,
  Partner
} = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const logger = require('../utils/logger');

/**
 * Get overview statistics
 */
exports.overview = async (req, res) => {
  try {
    const partnerId = req.partnerScope || req.query.partnerId;

    const stationWhere = partnerId ? { partnerId } : {};

    // Total stations
    const totalStations = await ChargingStation.count({ where: stationWhere });
    const onlineStations = await ChargingStation.count({ where: { ...stationWhere, isOnline: true } });

    // Total connectors
    const totalConnectors = await Connector.count({
      include: [{
        model: ChargingStation,
        as: 'station',
        where: Object.keys(stationWhere).length > 0 ? stationWhere : undefined,
        attributes: [],
      }],
    });

    // Active sessions
    const activeSessions = await Session.count({
      where: { status: 'active' },
      include: [{
        model: ChargingStation,
        as: 'station',
        where: Object.keys(stationWhere).length > 0 ? stationWhere : undefined,
        attributes: [],
      }],
    });

    // Today's statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayStats = await Session.findOne({
      where: {
        startTime: { [Op.gte]: today },
      },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('Session.id')), 'sessions'],
        [sequelize.fn('SUM', sequelize.col('energyDelivered')), 'energy'],
        [sequelize.fn('SUM', sequelize.col('totalCost')), 'revenue'],
      ],
      include: [{
        model: ChargingStation,
        as: 'station',
        where: Object.keys(stationWhere).length > 0 ? stationWhere : undefined,
        attributes: [],
      }],
      raw: true,
    });

    // Total drivers (if not partner scoped)
    let totalDrivers = 0;
    if (!partnerId) {
      totalDrivers = await EvDriver.count({ where: { status: 'active' } });
    }

    res.json({
      overview: {
        stations: {
          total: totalStations,
          online: onlineStations,
          offline: totalStations - onlineStations,
        },
        connectors: totalConnectors,
        activeSessions,
        totalDrivers,
        today: {
          sessions: parseInt(todayStats?.sessions || 0),
          energy: parseFloat(todayStats?.energy || 0).toFixed(2),
          revenue: parseFloat(todayStats?.revenue || 0).toFixed(2),
        },
      },
    });

  } catch (error) {
    logger.error('Dashboard overview error', { error: error.message });
    res.status(500).json({ error: 'Failed to get overview' });
  }
};

/**
 * Get session trends (hourly/daily)
 */
exports.sessionTrends = async (req, res) => {
  try {
    const { period = '7d', partnerId } = req.query;
    const partnerScope = req.partnerScope || partnerId;

    let startDate;
    let groupFormat;

    switch (period) {
      case '24h':
        startDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
        groupFormat = '%Y-%m-%d %H:00';
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        groupFormat = '%Y-%m-%d';
        break;
      case '90d':
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        groupFormat = '%Y-%m-%d';
        break;
      default: // 7d
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        groupFormat = '%Y-%m-%d';
    }

    const stationWhere = partnerScope ? { partnerId: partnerScope } : {};

    const trends = await Session.findAll({
      where: {
        startTime: { [Op.gte]: startDate },
      },
      attributes: [
        [sequelize.fn('to_char', sequelize.col('Session.startTime'), groupFormat), 'period'],
        [sequelize.fn('COUNT', sequelize.col('Session.id')), 'sessions'],
        [sequelize.fn('SUM', sequelize.col('energyDelivered')), 'energy'],
        [sequelize.fn('SUM', sequelize.col('totalCost')), 'revenue'],
      ],
      include: [{
        model: ChargingStation,
        as: 'station',
        where: Object.keys(stationWhere).length > 0 ? stationWhere : undefined,
        attributes: [],
      }],
      group: [sequelize.fn('to_char', sequelize.col('Session.startTime'), groupFormat)],
      order: [[sequelize.fn('to_char', sequelize.col('Session.startTime'), groupFormat), 'ASC']],
      raw: true,
    });

    res.json({ trends });

  } catch (error) {
    logger.error('Session trends error', { error: error.message });
    res.status(500).json({ error: 'Failed to get trends' });
  }
};

/**
 * Get station status distribution
 */
exports.stationStatus = async (req, res) => {
  try {
    const partnerId = req.partnerScope || req.query.partnerId;

    const where = partnerId ? { partnerId } : {};

    const statusCounts = await ChargingStation.findAll({
      where,
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: ['status'],
      raw: true,
    });

    const onlineOffline = await ChargingStation.findAll({
      where,
      attributes: [
        'isOnline',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: ['isOnline'],
      raw: true,
    });

    res.json({
      byStatus: statusCounts,
      byConnection: onlineOffline.map(o => ({
        status: o.isOnline ? 'online' : 'offline',
        count: parseInt(o.count),
      })),
    });

  } catch (error) {
    logger.error('Station status error', { error: error.message });
    res.status(500).json({ error: 'Failed to get status' });
  }
};

/**
 * Get connector status distribution
 */
exports.connectorStatus = async (req, res) => {
  try {
    const partnerId = req.partnerScope || req.query.partnerId;

    const stationWhere = partnerId ? { partnerId } : {};

    const statusCounts = await Connector.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('Connector.id')), 'count'],
      ],
      include: [{
        model: ChargingStation,
        as: 'station',
        where: Object.keys(stationWhere).length > 0 ? stationWhere : undefined,
        attributes: [],
      }],
      group: ['Connector.status'],
      raw: true,
    });

    res.json({ byStatus: statusCounts });

  } catch (error) {
    logger.error('Connector status error', { error: error.message });
    res.status(500).json({ error: 'Failed to get status' });
  }
};

/**
 * Get top performing stations
 */
exports.topStations = async (req, res) => {
  try {
    const { period = '30d', partnerId, limit = 10 } = req.query;
    const partnerScope = req.partnerScope || partnerId;

    const startDate = new Date(Date.now() - (
      period === '7d' ? 7 : period === '90d' ? 90 : 30
    ) * 24 * 60 * 60 * 1000);

    const stationWhere = partnerScope ? { partnerId: partnerScope } : {};

    const topStations = await Session.findAll({
      where: {
        startTime: { [Op.gte]: startDate },
        status: 'completed',
      },
      attributes: [
        'stationId',
        [sequelize.fn('COUNT', sequelize.col('Session.id')), 'sessionCount'],
        [sequelize.fn('SUM', sequelize.col('energyDelivered')), 'totalEnergy'],
        [sequelize.fn('SUM', sequelize.col('totalCost')), 'totalRevenue'],
      ],
      include: [{
        model: ChargingStation,
        as: 'station',
        where: Object.keys(stationWhere).length > 0 ? stationWhere : undefined,
        attributes: ['id', 'name'],
        include: [{ association: 'location', attributes: ['name', 'city'] }],
      }],
      group: ['Session.stationId', 'station.id', 'station->location.id'],
      order: [[sequelize.fn('SUM', sequelize.col('totalCost')), 'DESC']],
      limit: parseInt(limit),
      raw: false,
    });

    res.json({ stations: topStations });

  } catch (error) {
    logger.error('Top stations error', { error: error.message });
    res.status(500).json({ error: 'Failed to get top stations' });
  }
};

/**
 * Get recent activity
 */
exports.recentActivity = async (req, res) => {
  try {
    const partnerId = req.partnerScope || req.query.partnerId;
    const limit = parseInt(req.query.limit) || 20;

    const stationWhere = partnerId ? { partnerId } : {};

    const recentSessions = await Session.findAll({
      include: [{
        model: ChargingStation,
        as: 'station',
        where: Object.keys(stationWhere).length > 0 ? stationWhere : undefined,
        attributes: ['id', 'name'],
      }, {
        model: EvDriver,
        as: 'driver',
        attributes: ['id', 'name'],
      }],
      order: [['createdAt', 'DESC']],
      limit,
    });

    res.json({ activity: recentSessions });

  } catch (error) {
    logger.error('Recent activity error', { error: error.message });
    res.status(500).json({ error: 'Failed to get activity' });
  }
};

/**
 * Get revenue breakdown
 */
exports.revenueBreakdown = async (req, res) => {
  try {
    const { period = '30d', partnerId } = req.query;
    const partnerScope = req.partnerScope || partnerId;

    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const where = {
      createdAt: { [Op.gte]: startDate },
      status: 'completed',
    };

    if (partnerScope) {
      where.partnerId = partnerScope;
    }

    const byType = await Transaction.findAll({
      where,
      attributes: [
        'type',
        [sequelize.fn('SUM', sequelize.col('amount')), 'total'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: ['type'],
      raw: true,
    });

    const byPaymentMethod = await Transaction.findAll({
      where,
      attributes: [
        'paymentMethod',
        [sequelize.fn('SUM', sequelize.col('amount')), 'total'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      ],
      group: ['paymentMethod'],
      raw: true,
    });

    res.json({
      byType,
      byPaymentMethod,
    });

  } catch (error) {
    logger.error('Revenue breakdown error', { error: error.message });
    res.status(500).json({ error: 'Failed to get breakdown' });
  }
};

/**
 * Get live session data
 */
exports.liveSessions = async (req, res) => {
  try {
    const partnerId = req.partnerScope || req.query.partnerId;

    const stationWhere = partnerId ? { partnerId } : {};

    const sessions = await Session.findAll({
      where: { status: 'active' },
      include: [{
        model: ChargingStation,
        as: 'station',
        where: Object.keys(stationWhere).length > 0 ? stationWhere : undefined,
        attributes: ['id', 'name', 'ocppIdentity'],
        include: [{ association: 'location', attributes: ['name', 'address'] }],
      }, {
        model: EvDriver,
        as: 'driver',
        attributes: ['id', 'name', 'phone'],
      }],
      order: [['startTime', 'DESC']],
    });

    // Calculate current duration and estimated cost
    const liveSessions = sessions.map(s => {
      const durationMinutes = Math.round((Date.now() - new Date(s.startTime).getTime()) / (1000 * 60));
      return {
        ...s.toJSON(),
        currentDuration: durationMinutes,
        estimatedCost: s.energyDelivered * (s.tariff?.energyRate || 10),
      };
    });

    res.json({ sessions: liveSessions });

  } catch (error) {
    logger.error('Live sessions error', { error: error.message });
    res.status(500).json({ error: 'Failed to get live sessions' });
  }
};
