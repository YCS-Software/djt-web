/**
 * Partner Controller
 */

const {
  Partner,
  PartnerWallet,
  User,
  ChargingStation,
  Session,
  Transaction,
  AuditLog
} = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const logger = require('../utils/logger');

/**
 * List partners
 */
exports.list = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const offset = (page - 1) * limit;

    const where = {};

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { companyName: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const { count, rows } = await Partner.findAndCountAll({
      where,
      include: [
        { model: PartnerWallet, as: 'wallet' },
      ],
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.json({
      partners: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });

  } catch (error) {
    logger.error('List partners error', { error: error.message });
    res.status(500).json({ error: 'Failed to list partners' });
  }
};

/**
 * Get partner by ID
 */
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;

    const partner = await Partner.findByPk(id, {
      include: [
        { model: PartnerWallet, as: 'wallet' },
        {
          model: ChargingStation,
          as: 'stations',
          attributes: ['id', 'name', 'status', 'isOnline'],
        },
      ],
    });

    if (!partner) {
      return res.status(404).json({ error: 'Partner not found' });
    }

    res.json({ partner });

  } catch (error) {
    logger.error('Get partner error', { error: error.message });
    res.status(500).json({ error: 'Failed to get partner' });
  }
};

/**
 * Create partner
 */
exports.create = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const {
      name,
      email,
      phone,
      companyName,
      gstNumber,
      panNumber,
      address,
      city,
      state,
      pincode,
      commissionRate = 10,
    } = req.body;

    // Check if email exists
    const existing = await Partner.findOne({ where: { email } });
    if (existing) {
      await t.rollback();
      return res.status(400).json({ error: 'Email already in use' });
    }

    // Create partner
    const partner = await Partner.create({
      name,
      email,
      phone,
      companyName,
      gstNumber,
      panNumber,
      address,
      city,
      state,
      pincode,
      commissionRate,
      status: 'active',
    }, { transaction: t });

    // Create partner wallet
    await PartnerWallet.create({
      partnerId: partner.id,
      balance: 0,
      pendingSettlement: 0,
    }, { transaction: t });

    await t.commit();

    // Audit log
    await AuditLog.create({
      userId: req.user.id,
      action: 'create',
      resource: 'partner',
      resourceId: partner.id,
      details: { name, email, companyName },
      ipAddress: req.ip,
    });

    // Fetch with wallet
    const createdPartner = await Partner.findByPk(partner.id, {
      include: [{ model: PartnerWallet, as: 'wallet' }],
    });

    logger.info('Partner created', { partnerId: partner.id, createdBy: req.user.id });

    res.status(201).json({ partner: createdPartner });

  } catch (error) {
    await t.rollback();
    logger.error('Create partner error', { error: error.message });
    res.status(500).json({ error: 'Failed to create partner' });
  }
};

/**
 * Update partner
 */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const partner = await Partner.findByPk(id);

    if (!partner) {
      return res.status(404).json({ error: 'Partner not found' });
    }

    // Check email uniqueness
    if (updates.email && updates.email !== partner.email) {
      const existing = await Partner.findOne({ where: { email: updates.email } });
      if (existing) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    await partner.update(updates);

    // Audit log
    await AuditLog.create({
      userId: req.user.id,
      action: 'update',
      resource: 'partner',
      resourceId: partner.id,
      details: updates,
      ipAddress: req.ip,
    });

    const updatedPartner = await Partner.findByPk(id, {
      include: [{ model: PartnerWallet, as: 'wallet' }],
    });

    logger.info('Partner updated', { partnerId: id, updatedBy: req.user.id });

    res.json({ partner: updatedPartner });

  } catch (error) {
    logger.error('Update partner error', { error: error.message });
    res.status(500).json({ error: 'Failed to update partner' });
  }
};

/**
 * Delete partner
 */
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    const partner = await Partner.findByPk(id);

    if (!partner) {
      return res.status(404).json({ error: 'Partner not found' });
    }

    // Check if partner has active stations
    const activeStations = await ChargingStation.count({
      where: { partnerId: id, status: { [Op.ne]: 'decommissioned' } },
    });

    if (activeStations > 0) {
      return res.status(400).json({
        error: 'Cannot delete partner with active stations',
        activeStations,
      });
    }

    await partner.update({ status: 'deleted', deletedAt: new Date() });

    // Audit log
    await AuditLog.create({
      userId: req.user.id,
      action: 'delete',
      resource: 'partner',
      resourceId: partner.id,
      ipAddress: req.ip,
    });

    logger.info('Partner deleted', { partnerId: id, deletedBy: req.user.id });

    res.json({ message: 'Partner deleted successfully' });

  } catch (error) {
    logger.error('Delete partner error', { error: error.message });
    res.status(500).json({ error: 'Failed to delete partner' });
  }
};

/**
 * Get partner wallet
 */
exports.getWallet = async (req, res) => {
  try {
    const { id } = req.params;

    const wallet = await PartnerWallet.findOne({
      where: { partnerId: id },
      include: [{ model: Partner, as: 'partner', attributes: ['name', 'email'] }],
    });

    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    res.json({ wallet });

  } catch (error) {
    logger.error('Get wallet error', { error: error.message });
    res.status(500).json({ error: 'Failed to get wallet' });
  }
};

/**
 * Get partner settlements
 */
exports.getSettlements = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20, startDate, endDate, status } = req.query;
    const offset = (page - 1) * limit;

    const where = { partnerId: id, type: 'settlement' };

    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    if (status) {
      where.status = status;
    }

    const { count, rows } = await Transaction.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.json({
      settlements: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });

  } catch (error) {
    logger.error('Get settlements error', { error: error.message });
    res.status(500).json({ error: 'Failed to get settlements' });
  }
};

/**
 * Create settlement for partner
 */
exports.createSettlement = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { amount, bankReference, notes } = req.body;

    const wallet = await PartnerWallet.findOne({ where: { partnerId: id } });
    if (!wallet) {
      await t.rollback();
      return res.status(404).json({ error: 'Partner wallet not found' });
    }

    if (parseFloat(amount) > wallet.pendingSettlement) {
      await t.rollback();
      return res.status(400).json({ error: 'Amount exceeds pending settlement' });
    }

    // Create settlement transaction
    const transaction = await Transaction.create({
      partnerId: id,
      type: 'settlement',
      amount: parseFloat(amount),
      status: 'completed',
      reference: bankReference,
      description: notes || 'Partner settlement',
    }, { transaction: t });

    // Update wallet
    await wallet.update({
      pendingSettlement: parseFloat(wallet.pendingSettlement) - parseFloat(amount),
      totalSettled: parseFloat(wallet.totalSettled || 0) + parseFloat(amount),
    }, { transaction: t });

    await t.commit();

    // Audit log
    await AuditLog.create({
      userId: req.user.id,
      action: 'create',
      resource: 'settlement',
      resourceId: transaction.id,
      details: { partnerId: id, amount, bankReference },
      ipAddress: req.ip,
    });

    logger.info('Settlement created', { partnerId: id, amount, createdBy: req.user.id });

    res.status(201).json({ settlement: transaction });

  } catch (error) {
    await t.rollback();
    logger.error('Create settlement error', { error: error.message });
    res.status(500).json({ error: 'Failed to create settlement' });
  }
};

/**
 * Get partner statistics
 */
exports.getStats = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    // Get station count
    const stationCount = await ChargingStation.count({
      where: { partnerId: id },
    });

    // Get session stats
    const sessionStats = await Session.findOne({
      where: { ...dateFilter },
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalSessions'],
        [sequelize.fn('SUM', sequelize.col('energyDelivered')), 'totalEnergy'],
        [sequelize.fn('SUM', sequelize.col('totalCost')), 'totalRevenue'],
      ],
      include: [
        {
          model: ChargingStation,
          as: 'station',
          where: { partnerId: id },
          attributes: [],
        },
      ],
      raw: true,
    });

    // Get active sessions
    const activeSessions = await Session.count({
      where: { status: 'active' },
      include: [
        {
          model: ChargingStation,
          as: 'station',
          where: { partnerId: id },
          attributes: [],
        },
      ],
    });

    res.json({
      stats: {
        stationCount,
        totalSessions: parseInt(sessionStats?.totalSessions || 0),
        totalEnergy: parseFloat(sessionStats?.totalEnergy || 0).toFixed(2),
        totalRevenue: parseFloat(sessionStats?.totalRevenue || 0).toFixed(2),
        activeSessions,
      },
    });

  } catch (error) {
    logger.error('Get partner stats error', { error: error.message });
    res.status(500).json({ error: 'Failed to get statistics' });
  }
};
