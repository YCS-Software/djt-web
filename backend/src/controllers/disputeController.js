/**
 * Dispute Controller
 */

const { Dispute, Session, EvDriver, ChargingStation, AuditLog } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

/**
 * List disputes
 */
exports.list = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, priority, partnerId } = req.query;
    const offset = (page - 1) * limit;

    const where = {};

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    // Partner scope through session -> station
    let sessionInclude = {
      model: Session,
      as: 'session',
      include: [
        {
          model: ChargingStation,
          as: 'station',
          attributes: ['id', 'name', 'partnerId'],
        },
      ],
    };

    if (req.partnerScope || partnerId) {
      sessionInclude.include[0].where = {
        partnerId: req.partnerScope || partnerId,
      };
    }

    const { count, rows } = await Dispute.findAndCountAll({
      where,
      include: [
        sessionInclude,
        { model: EvDriver, as: 'driver', attributes: ['id', 'name', 'email', 'phone'] },
      ],
      limit: parseInt(limit),
      offset,
      order: [
        ['priority', 'DESC'],
        ['createdAt', 'DESC'],
      ],
    });

    res.json({
      disputes: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });

  } catch (error) {
    logger.error('List disputes error', { error: error.message });
    res.status(500).json({ error: 'Failed to list disputes' });
  }
};

/**
 * Get dispute by ID
 */
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;

    const dispute = await Dispute.findByPk(id, {
      include: [
        {
          model: Session,
          as: 'session',
          include: [
            {
              model: ChargingStation,
              as: 'station',
              include: [{ association: 'location' }],
            },
          ],
        },
        { model: EvDriver, as: 'driver', attributes: { exclude: ['password'] } },
      ],
    });

    if (!dispute) {
      return res.status(404).json({ error: 'Dispute not found' });
    }

    res.json({ dispute });

  } catch (error) {
    logger.error('Get dispute error', { error: error.message });
    res.status(500).json({ error: 'Failed to get dispute' });
  }
};

/**
 * Create dispute
 */
exports.create = async (req, res) => {
  try {
    const { sessionId, driverId, type, description, amount } = req.body;

    // Verify session exists
    const session = await Session.findByPk(sessionId, {
      include: [{ model: ChargingStation, as: 'station' }],
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Check for existing open dispute
    const existing = await Dispute.findOne({
      where: {
        sessionId,
        status: { [Op.notIn]: ['resolved', 'closed'] },
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'Open dispute already exists for this session' });
    }

    const dispute = await Dispute.create({
      sessionId,
      driverId,
      type,
      description,
      amount,
      status: 'open',
      priority: amount > 500 ? 'high' : 'medium',
    });

    // Audit log
    await AuditLog.create({
      userId: req.user?.id,
      partnerId: session.station?.partnerId,
      action: 'create',
      resource: 'dispute',
      resourceId: dispute.id,
      details: { sessionId, type, amount },
      ipAddress: req.ip,
    });

    const createdDispute = await Dispute.findByPk(dispute.id, {
      include: [
        { model: Session, as: 'session' },
        { model: EvDriver, as: 'driver', attributes: ['id', 'name'] },
      ],
    });

    logger.info('Dispute created', { disputeId: dispute.id, sessionId });

    res.status(201).json({ dispute: createdDispute });

  } catch (error) {
    logger.error('Create dispute error', { error: error.message });
    res.status(500).json({ error: 'Failed to create dispute' });
  }
};

/**
 * Update dispute
 */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, priority, assignedTo, resolution, refundAmount } = req.body;

    const dispute = await Dispute.findByPk(id);

    if (!dispute) {
      return res.status(404).json({ error: 'Dispute not found' });
    }

    const updates = {};

    if (status) {
      updates.status = status;
      if (status === 'resolved') {
        updates.resolvedAt = new Date();
        updates.resolvedBy = req.user.id;
      }
    }

    if (priority) updates.priority = priority;
    if (assignedTo) updates.assignedTo = assignedTo;
    if (resolution) updates.resolution = resolution;
    if (refundAmount !== undefined) updates.refundAmount = refundAmount;

    await dispute.update(updates);

    // Audit log
    await AuditLog.create({
      userId: req.user.id,
      action: 'update',
      resource: 'dispute',
      resourceId: dispute.id,
      details: updates,
      ipAddress: req.ip,
    });

    const updatedDispute = await Dispute.findByPk(id, {
      include: [
        { model: Session, as: 'session' },
        { model: EvDriver, as: 'driver', attributes: ['id', 'name'] },
      ],
    });

    logger.info('Dispute updated', { disputeId: id, updates });

    res.json({ dispute: updatedDispute });

  } catch (error) {
    logger.error('Update dispute error', { error: error.message });
    res.status(500).json({ error: 'Failed to update dispute' });
  }
};

/**
 * Resolve dispute
 */
exports.resolve = async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution, refundAmount, action } = req.body;

    const dispute = await Dispute.findByPk(id, {
      include: [
        {
          model: Session,
          as: 'session',
          include: [{ model: ChargingStation, as: 'station' }],
        },
        { model: EvDriver, as: 'driver' },
      ],
    });

    if (!dispute) {
      return res.status(404).json({ error: 'Dispute not found' });
    }

    if (dispute.status === 'resolved' || dispute.status === 'closed') {
      return res.status(400).json({ error: 'Dispute already resolved/closed' });
    }

    await dispute.update({
      status: 'resolved',
      resolution,
      refundAmount: refundAmount || 0,
      resolvedAt: new Date(),
      resolvedBy: req.user.id,
    });

    // Process refund if applicable
    if (refundAmount > 0 && action === 'refund') {
      // TODO: Implement refund logic
      // This would create a wallet transaction or payment refund
    }

    // Audit log
    await AuditLog.create({
      userId: req.user.id,
      partnerId: dispute.session?.station?.partnerId,
      action: 'resolve',
      resource: 'dispute',
      resourceId: dispute.id,
      details: { resolution, refundAmount, action },
      ipAddress: req.ip,
    });

    logger.info('Dispute resolved', { disputeId: id, refundAmount });

    res.json({ message: 'Dispute resolved successfully' });

  } catch (error) {
    logger.error('Resolve dispute error', { error: error.message });
    res.status(500).json({ error: 'Failed to resolve dispute' });
  }
};

/**
 * Add comment to dispute
 */
exports.addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { comment } = req.body;

    const dispute = await Dispute.findByPk(id);

    if (!dispute) {
      return res.status(404).json({ error: 'Dispute not found' });
    }

    const comments = dispute.comments || [];
    comments.push({
      userId: req.user.id,
      userName: req.user.name || req.user.email,
      comment,
      createdAt: new Date().toISOString(),
    });

    await dispute.update({ comments });

    logger.info('Comment added to dispute', { disputeId: id });

    res.json({ message: 'Comment added', comments });

  } catch (error) {
    logger.error('Add comment error', { error: error.message });
    res.status(500).json({ error: 'Failed to add comment' });
  }
};

/**
 * Get dispute statistics
 */
exports.getStats = async (req, res) => {
  try {
    const partnerId = req.partnerScope || req.query.partnerId;

    const stationWhere = partnerId ? { partnerId } : {};

    const byStatus = await Dispute.findAll({
      attributes: [
        'status',
        [require('../config/database').fn('COUNT', require('../config/database').col('Dispute.id')), 'count'],
      ],
      include: [{
        model: Session,
        as: 'session',
        attributes: [],
        include: [{
          model: ChargingStation,
          as: 'station',
          where: Object.keys(stationWhere).length > 0 ? stationWhere : undefined,
          attributes: [],
        }],
      }],
      group: ['Dispute.status'],
      raw: true,
    });

    const byType = await Dispute.findAll({
      attributes: [
        'type',
        [require('../config/database').fn('COUNT', require('../config/database').col('Dispute.id')), 'count'],
      ],
      include: [{
        model: Session,
        as: 'session',
        attributes: [],
        include: [{
          model: ChargingStation,
          as: 'station',
          where: Object.keys(stationWhere).length > 0 ? stationWhere : undefined,
          attributes: [],
        }],
      }],
      group: ['Dispute.type'],
      raw: true,
    });

    res.json({ byStatus, byType });

  } catch (error) {
    logger.error('Dispute stats error', { error: error.message });
    res.status(500).json({ error: 'Failed to get statistics' });
  }
};
