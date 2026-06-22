/**
 * EV Driver Controller
 */

const {
  EvDriver,
  DriverWallet,
  DriverVehicle,
  RfidCard,
  Session,
  WalletTransaction,
  AuditLog
} = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

/**
 * List drivers
 */
exports.list = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status, partnerId } = req.query;
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
        { phone: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const { count, rows } = await EvDriver.findAndCountAll({
      where,
      include: [
        { model: DriverWallet, as: 'wallet' },
      ],
      attributes: { exclude: ['password'] },
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.json({
      drivers: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });

  } catch (error) {
    logger.error('List drivers error', { error: error.message });
    res.status(500).json({ error: 'Failed to list drivers' });
  }
};

/**
 * Get driver by ID
 */
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;

    const driver = await EvDriver.findByPk(id, {
      attributes: { exclude: ['password'] },
      include: [
        { model: DriverWallet, as: 'wallet' },
        { model: DriverVehicle, as: 'vehicles' },
        { model: RfidCard, as: 'rfidCards' },
      ],
    });

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    // Check partner scope
    if (req.partnerScope && driver.partnerId !== req.partnerScope) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ driver });

  } catch (error) {
    logger.error('Get driver error', { error: error.message });
    res.status(500).json({ error: 'Failed to get driver' });
  }
};

/**
 * Create driver
 */
exports.create = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { name, email, phone, password, partnerId, address, city, state, pincode } = req.body;

    // Check if email or phone already exists
    const existing = await EvDriver.findOne({
      where: {
        [Op.or]: [
          { email },
          { phone },
        ],
      },
    });

    if (existing) {
      await t.rollback();
      return res.status(400).json({ error: 'Email or phone already in use' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create driver
    const driver = await EvDriver.create({
      name,
      email,
      phone,
      password: hashedPassword,
      partnerId: req.partnerScope || partnerId,
      address,
      city,
      state,
      pincode,
      status: 'active',
    }, { transaction: t });

    // Create wallet
    await DriverWallet.create({
      driverId: driver.id,
      balance: 0,
    }, { transaction: t });

    await t.commit();

    // Audit log
    await AuditLog.create({
      userId: req.user.id,
      partnerId: driver.partnerId,
      action: 'create',
      resource: 'driver',
      resourceId: driver.id,
      details: { name, email, phone },
      ipAddress: req.ip,
    });

    const createdDriver = await EvDriver.findByPk(driver.id, {
      attributes: { exclude: ['password'] },
      include: [{ model: DriverWallet, as: 'wallet' }],
    });

    logger.info('Driver created', { driverId: driver.id, createdBy: req.user.id });

    res.status(201).json({ driver: createdDriver });

  } catch (error) {
    await t.rollback();
    logger.error('Create driver error', { error: error.message });
    res.status(500).json({ error: 'Failed to create driver' });
  }
};

/**
 * Update driver
 */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove password from updates - use separate endpoint
    delete updates.password;

    const driver = await EvDriver.findByPk(id);

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    // Check partner scope
    if (req.partnerScope && driver.partnerId !== req.partnerScope) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check email/phone uniqueness
    if (updates.email || updates.phone) {
      const existing = await EvDriver.findOne({
        where: {
          id: { [Op.ne]: id },
          [Op.or]: [
            ...(updates.email ? [{ email: updates.email }] : []),
            ...(updates.phone ? [{ phone: updates.phone }] : []),
          ],
        },
      });

      if (existing) {
        return res.status(400).json({ error: 'Email or phone already in use' });
      }
    }

    await driver.update(updates);

    // Audit log
    await AuditLog.create({
      userId: req.user.id,
      partnerId: driver.partnerId,
      action: 'update',
      resource: 'driver',
      resourceId: driver.id,
      details: updates,
      ipAddress: req.ip,
    });

    const updatedDriver = await EvDriver.findByPk(id, {
      attributes: { exclude: ['password'] },
      include: [{ model: DriverWallet, as: 'wallet' }],
    });

    logger.info('Driver updated', { driverId: id, updatedBy: req.user.id });

    res.json({ driver: updatedDriver });

  } catch (error) {
    logger.error('Update driver error', { error: error.message });
    res.status(500).json({ error: 'Failed to update driver' });
  }
};

/**
 * Delete driver
 */
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    const driver = await EvDriver.findByPk(id);

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    // Check partner scope
    if (req.partnerScope && driver.partnerId !== req.partnerScope) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check for active sessions
    const activeSessions = await Session.count({
      where: { driverId: id, status: 'active' },
    });

    if (activeSessions > 0) {
      return res.status(400).json({
        error: 'Cannot delete driver with active sessions',
        activeSessions,
      });
    }

    // Soft delete
    await driver.update({ status: 'deleted', deletedAt: new Date() });

    // Audit log
    await AuditLog.create({
      userId: req.user.id,
      partnerId: driver.partnerId,
      action: 'delete',
      resource: 'driver',
      resourceId: id,
      ipAddress: req.ip,
    });

    logger.info('Driver deleted', { driverId: id, deletedBy: req.user.id });

    res.json({ message: 'Driver deleted successfully' });

  } catch (error) {
    logger.error('Delete driver error', { error: error.message });
    res.status(500).json({ error: 'Failed to delete driver' });
  }
};

/**
 * Get driver wallet
 */
exports.getWallet = async (req, res) => {
  try {
    const { id } = req.params;

    const wallet = await DriverWallet.findOne({
      where: { driverId: id },
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
 * Add funds to wallet (admin action)
 */
exports.topupWallet = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { amount, description = 'Admin top-up' } = req.body;

    if (amount <= 0) {
      await t.rollback();
      return res.status(400).json({ error: 'Amount must be positive' });
    }

    const wallet = await DriverWallet.findOne({
      where: { driverId: id },
      transaction: t,
      lock: true,
    });

    if (!wallet) {
      await t.rollback();
      return res.status(404).json({ error: 'Wallet not found' });
    }

    const newBalance = wallet.balance + amount;

    await wallet.update({
      balance: newBalance,
      lastTransactionAt: new Date(),
    }, { transaction: t });

    // Create wallet transaction
    await WalletTransaction.create({
      walletId: wallet.id,
      type: 'credit',
      amount,
      balanceAfter: newBalance,
      description,
      referenceType: 'admin_topup',
    }, { transaction: t });

    await t.commit();

    // Audit log
    await AuditLog.create({
      userId: req.user.id,
      action: 'topup_wallet',
      resource: 'driver',
      resourceId: id,
      details: { amount, newBalance },
      ipAddress: req.ip,
    });

    logger.info('Wallet topped up', { driverId: id, amount, newBalance, by: req.user.id });

    res.json({
      message: 'Wallet topped up successfully',
      wallet: { ...wallet.toJSON(), balance: newBalance },
    });

  } catch (error) {
    await t.rollback();
    logger.error('Topup wallet error', { error: error.message });
    res.status(500).json({ error: 'Failed to top up wallet' });
  }
};

/**
 * Get wallet transactions
 */
exports.getWalletTransactions = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20, type, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;

    const wallet = await DriverWallet.findOne({ where: { driverId: id } });
    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found' });
    }

    const where = { walletId: wallet.id };

    if (type) {
      where.type = type;
    }

    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    const { count, rows } = await WalletTransaction.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.json({
      transactions: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });

  } catch (error) {
    logger.error('Get wallet transactions error', { error: error.message });
    res.status(500).json({ error: 'Failed to get transactions' });
  }
};

/**
 * Get driver vehicles
 */
exports.getVehicles = async (req, res) => {
  try {
    const { id } = req.params;

    const vehicles = await DriverVehicle.findAll({
      where: { driverId: id },
      order: [['isPrimary', 'DESC'], ['createdAt', 'DESC']],
    });

    res.json({ vehicles });

  } catch (error) {
    logger.error('Get vehicles error', { error: error.message });
    res.status(500).json({ error: 'Failed to get vehicles' });
  }
};

/**
 * Add vehicle
 */
exports.addVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const { make, model, year, registrationNumber, batteryCapacity, connectorType, isPrimary } = req.body;

    const driver = await EvDriver.findByPk(id);
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    // If this is primary, unset other primary vehicles
    if (isPrimary) {
      await DriverVehicle.update(
        { isPrimary: false },
        { where: { driverId: id } }
      );
    }

    const vehicle = await DriverVehicle.create({
      driverId: id,
      make,
      model,
      year,
      registrationNumber,
      batteryCapacity,
      connectorType,
      isPrimary: isPrimary || false,
    });

    logger.info('Vehicle added', { driverId: id, vehicleId: vehicle.id });

    res.status(201).json({ vehicle });

  } catch (error) {
    logger.error('Add vehicle error', { error: error.message });
    res.status(500).json({ error: 'Failed to add vehicle' });
  }
};

/**
 * Get driver sessions
 */
exports.getSessions = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20, status, startDate, endDate } = req.query;
    const offset = (page - 1) * limit;

    const where = { driverId: id };

    if (status) {
      where.status = status;
    }

    if (startDate && endDate) {
      where.startTime = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    const { count, rows } = await Session.findAndCountAll({
      where,
      include: [
        {
          association: 'station',
          attributes: ['id', 'name'],
          include: [{ association: 'location', attributes: ['name', 'address'] }],
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
    logger.error('Get driver sessions error', { error: error.message });
    res.status(500).json({ error: 'Failed to get sessions' });
  }
};

/**
 * Get driver statistics
 */
exports.getStats = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    const where = { driverId: id };
    if (startDate && endDate) {
      where.startTime = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    const stats = await Session.findOne({
      where,
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'totalSessions'],
        [sequelize.fn('SUM', sequelize.col('energyDelivered')), 'totalEnergy'],
        [sequelize.fn('SUM', sequelize.col('totalCost')), 'totalSpent'],
        [sequelize.fn('SUM', sequelize.col('duration')), 'totalDuration'],
      ],
      raw: true,
    });

    const wallet = await DriverWallet.findOne({ where: { driverId: id } });

    res.json({
      stats: {
        totalSessions: parseInt(stats?.totalSessions || 0),
        totalEnergy: parseFloat(stats?.totalEnergy || 0).toFixed(2),
        totalSpent: parseFloat(stats?.totalSpent || 0).toFixed(2),
        totalDuration: parseInt(stats?.totalDuration || 0),
        walletBalance: wallet?.balance || 0,
      },
    });

  } catch (error) {
    logger.error('Get driver stats error', { error: error.message });
    res.status(500).json({ error: 'Failed to get statistics' });
  }
};
