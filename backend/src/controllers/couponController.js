/**
 * Coupon Controller
 */

const { Coupon, CouponUsage, EvDriver, AuditLog } = require('../models');
const { Op } = require('sequelize');
const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * List coupons
 */
exports.list = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, partnerId, type } = req.query;
    const offset = (page - 1) * limit;

    const where = {};

    if (status === 'active') {
      where.isActive = true;
      where.validFrom = { [Op.lte]: new Date() };
      where.validUntil = { [Op.gte]: new Date() };
    } else if (status === 'inactive') {
      where.isActive = false;
    } else if (status === 'expired') {
      where.validUntil = { [Op.lt]: new Date() };
    }

    if (req.partnerScope) {
      where.partnerId = req.partnerScope;
    } else if (partnerId) {
      where.partnerId = partnerId;
    }

    if (type) {
      where.type = type;
    }

    const { count, rows } = await Coupon.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.json({
      coupons: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });

  } catch (error) {
    logger.error('List coupons error', { error: error.message });
    res.status(500).json({ error: 'Failed to list coupons' });
  }
};

/**
 * Get coupon by ID
 */
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findByPk(id);

    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }

    // Get usage count
    const usageCount = await CouponUsage.count({
      where: { couponId: id },
    });

    res.json({
      coupon: {
        ...coupon.toJSON(),
        usageCount,
      },
    });

  } catch (error) {
    logger.error('Get coupon error', { error: error.message });
    res.status(500).json({ error: 'Failed to get coupon' });
  }
};

/**
 * Create coupon
 */
exports.create = async (req, res) => {
  try {
    const {
      code,
      description,
      type,
      value,
      minOrderAmount,
      maxDiscount,
      usageLimit,
      perUserLimit = 1,
      validFrom,
      validUntil,
      partnerId,
      applicableTo,
    } = req.body;

    // Generate code if not provided
    const couponCode = code || generateCouponCode();

    // Check if code exists
    const existing = await Coupon.findOne({ where: { code: couponCode } });
    if (existing) {
      return res.status(400).json({ error: 'Coupon code already exists' });
    }

    const coupon = await Coupon.create({
      code: couponCode,
      description,
      type,
      value,
      minOrderAmount,
      maxDiscount,
      usageLimit,
      perUserLimit,
      validFrom: new Date(validFrom),
      validUntil: new Date(validUntil),
      partnerId: req.partnerScope || partnerId,
      applicableTo,
      isActive: true,
      usageCount: 0,
    });

    // Audit log
    await AuditLog.create({
      userId: req.user.id,
      partnerId: coupon.partnerId,
      action: 'create',
      resource: 'coupon',
      resourceId: coupon.id,
      details: { code: couponCode, type, value },
      ipAddress: req.ip,
    });

    logger.info('Coupon created', { couponId: coupon.id, code: couponCode });

    res.status(201).json({ coupon });

  } catch (error) {
    logger.error('Create coupon error', { error: error.message });
    res.status(500).json({ error: 'Failed to create coupon' });
  }
};

/**
 * Update coupon
 */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const coupon = await Coupon.findByPk(id);

    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }

    // Check partner scope
    if (req.partnerScope && coupon.partnerId !== req.partnerScope) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Don't allow code change
    delete updates.code;

    await coupon.update(updates);

    // Audit log
    await AuditLog.create({
      userId: req.user.id,
      partnerId: coupon.partnerId,
      action: 'update',
      resource: 'coupon',
      resourceId: coupon.id,
      details: updates,
      ipAddress: req.ip,
    });

    logger.info('Coupon updated', { couponId: id });

    res.json({ coupon });

  } catch (error) {
    logger.error('Update coupon error', { error: error.message });
    res.status(500).json({ error: 'Failed to update coupon' });
  }
};

/**
 * Delete coupon
 */
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findByPk(id);

    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }

    // Check partner scope
    if (req.partnerScope && coupon.partnerId !== req.partnerScope) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await coupon.destroy();

    // Audit log
    await AuditLog.create({
      userId: req.user.id,
      partnerId: coupon.partnerId,
      action: 'delete',
      resource: 'coupon',
      resourceId: id,
      ipAddress: req.ip,
    });

    logger.info('Coupon deleted', { couponId: id });

    res.json({ message: 'Coupon deleted successfully' });

  } catch (error) {
    logger.error('Delete coupon error', { error: error.message });
    res.status(500).json({ error: 'Failed to delete coupon' });
  }
};

/**
 * Validate coupon
 */
exports.validate = async (req, res) => {
  try {
    const { code, driverId, orderAmount } = req.body;

    const coupon = await Coupon.findOne({ where: { code } });

    if (!coupon) {
      return res.status(404).json({ valid: false, error: 'Coupon not found' });
    }

    // Check if active
    if (!coupon.isActive) {
      return res.json({ valid: false, error: 'Coupon is not active' });
    }

    // Check validity period
    const now = new Date();
    if (now < new Date(coupon.validFrom) || now > new Date(coupon.validUntil)) {
      return res.json({ valid: false, error: 'Coupon is expired or not yet valid' });
    }

    // Check usage limit
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
      return res.json({ valid: false, error: 'Coupon usage limit reached' });
    }

    // Check per-user limit
    if (driverId && coupon.perUserLimit) {
      const userUsage = await CouponUsage.count({
        where: { couponId: coupon.id, driverId },
      });

      if (userUsage >= coupon.perUserLimit) {
        return res.json({ valid: false, error: 'You have already used this coupon' });
      }
    }

    // Check minimum order amount
    if (coupon.minOrderAmount && orderAmount < coupon.minOrderAmount) {
      return res.json({
        valid: false,
        error: `Minimum order amount is ₹${coupon.minOrderAmount}`,
      });
    }

    // Calculate discount
    let discount = 0;
    if (coupon.type === 'percentage') {
      discount = (orderAmount * coupon.value) / 100;
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else {
      discount = coupon.value;
    }

    res.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        discount: parseFloat(discount.toFixed(2)),
      },
    });

  } catch (error) {
    logger.error('Validate coupon error', { error: error.message });
    res.status(500).json({ error: 'Failed to validate coupon' });
  }
};

/**
 * Apply coupon (record usage)
 */
exports.apply = async (req, res) => {
  try {
    const { code, driverId, sessionId, orderAmount, discount } = req.body;

    const coupon = await Coupon.findOne({ where: { code } });

    if (!coupon) {
      return res.status(404).json({ error: 'Coupon not found' });
    }

    // Record usage
    await CouponUsage.create({
      couponId: coupon.id,
      driverId,
      sessionId,
      orderAmount,
      discountAmount: discount,
    });

    // Update usage count
    await coupon.increment('usageCount');

    logger.info('Coupon applied', { couponId: coupon.id, driverId, discount });

    res.json({ message: 'Coupon applied successfully' });

  } catch (error) {
    logger.error('Apply coupon error', { error: error.message });
    res.status(500).json({ error: 'Failed to apply coupon' });
  }
};

/**
 * Get coupon usage history
 */
exports.getUsage = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await CouponUsage.findAndCountAll({
      where: { couponId: id },
      include: [
        { model: EvDriver, as: 'driver', attributes: ['id', 'name', 'email'] },
      ],
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.json({
      usage: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });

  } catch (error) {
    logger.error('Get coupon usage error', { error: error.message });
    res.status(500).json({ error: 'Failed to get usage' });
  }
};

/**
 * Generate unique coupon code
 */
function generateCouponCode() {
  const prefix = 'EV';
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `${prefix}${random}`;
}
