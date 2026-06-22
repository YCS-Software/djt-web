/**
 * RFID Card Controller
 */

const { RfidCard, EvDriver, CardRequest, AuditLog } = require('../models');
const { Op } = require('sequelize');
const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * List RFID cards
 */
exports.list = async (req, res) => {
  try {
    const { page = 1, limit = 20, driverId, status, search } = req.query;
    const offset = (page - 1) * limit;

    const where = {};

    if (driverId) {
      where.driverId = driverId;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.cardNumber = { [Op.iLike]: `%${search}%` };
    }

    const { count, rows } = await RfidCard.findAndCountAll({
      where,
      include: [
        { model: EvDriver, as: 'driver', attributes: ['id', 'name', 'email', 'phone'] },
      ],
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.json({
      cards: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });

  } catch (error) {
    logger.error('List cards error', { error: error.message });
    res.status(500).json({ error: 'Failed to list cards' });
  }
};

/**
 * Get card by ID
 */
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;

    const card = await RfidCard.findByPk(id, {
      include: [
        { model: EvDriver, as: 'driver', attributes: { exclude: ['password'] } },
      ],
    });

    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    res.json({ card });

  } catch (error) {
    logger.error('Get card error', { error: error.message });
    res.status(500).json({ error: 'Failed to get card' });
  }
};

/**
 * Create/Issue new card
 */
exports.create = async (req, res) => {
  try {
    const { driverId, cardNumber, expiryDate, parentIdTag } = req.body;

    // Check if card number already exists
    if (cardNumber) {
      const existing = await RfidCard.findOne({ where: { cardNumber } });
      if (existing) {
        return res.status(400).json({ error: 'Card number already exists' });
      }
    }

    // Verify driver exists
    const driver = await EvDriver.findByPk(driverId);
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    // Generate card number if not provided
    const finalCardNumber = cardNumber || generateCardNumber();

    const card = await RfidCard.create({
      driverId,
      cardNumber: finalCardNumber,
      expiryDate,
      parentIdTag,
      status: 'active',
    });

    // Audit log
    await AuditLog.create({
      userId: req.user.id,
      action: 'create',
      resource: 'rfid_card',
      resourceId: card.id,
      details: { driverId, cardNumber: finalCardNumber },
      ipAddress: req.ip,
    });

    const createdCard = await RfidCard.findByPk(card.id, {
      include: [{ model: EvDriver, as: 'driver', attributes: ['id', 'name'] }],
    });

    logger.info('RFID card created', { cardId: card.id, driverId, createdBy: req.user.id });

    res.status(201).json({ card: createdCard });

  } catch (error) {
    logger.error('Create card error', { error: error.message });
    res.status(500).json({ error: 'Failed to create card' });
  }
};

/**
 * Update card
 */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, expiryDate, parentIdTag } = req.body;

    const card = await RfidCard.findByPk(id);

    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    await card.update({
      status: status || card.status,
      expiryDate: expiryDate !== undefined ? expiryDate : card.expiryDate,
      parentIdTag: parentIdTag !== undefined ? parentIdTag : card.parentIdTag,
    });

    // Audit log
    await AuditLog.create({
      userId: req.user.id,
      action: 'update',
      resource: 'rfid_card',
      resourceId: card.id,
      details: { status, expiryDate },
      ipAddress: req.ip,
    });

    const updatedCard = await RfidCard.findByPk(id, {
      include: [{ model: EvDriver, as: 'driver', attributes: ['id', 'name'] }],
    });

    logger.info('RFID card updated', { cardId: id, updatedBy: req.user.id });

    res.json({ card: updatedCard });

  } catch (error) {
    logger.error('Update card error', { error: error.message });
    res.status(500).json({ error: 'Failed to update card' });
  }
};

/**
 * Block card
 */
exports.block = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const card = await RfidCard.findByPk(id);

    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    await card.update({ status: 'blocked' });

    // Audit log
    await AuditLog.create({
      userId: req.user.id,
      action: 'block',
      resource: 'rfid_card',
      resourceId: card.id,
      details: { reason },
      ipAddress: req.ip,
    });

    logger.info('RFID card blocked', { cardId: id, blockedBy: req.user.id, reason });

    res.json({ message: 'Card blocked successfully' });

  } catch (error) {
    logger.error('Block card error', { error: error.message });
    res.status(500).json({ error: 'Failed to block card' });
  }
};

/**
 * Unblock card
 */
exports.unblock = async (req, res) => {
  try {
    const { id } = req.params;

    const card = await RfidCard.findByPk(id);

    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    await card.update({ status: 'active' });

    // Audit log
    await AuditLog.create({
      userId: req.user.id,
      action: 'unblock',
      resource: 'rfid_card',
      resourceId: card.id,
      ipAddress: req.ip,
    });

    logger.info('RFID card unblocked', { cardId: id, unblockedBy: req.user.id });

    res.json({ message: 'Card unblocked successfully' });

  } catch (error) {
    logger.error('Unblock card error', { error: error.message });
    res.status(500).json({ error: 'Failed to unblock card' });
  }
};

/**
 * Delete card
 */
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    const card = await RfidCard.findByPk(id);

    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    await card.destroy();

    // Audit log
    await AuditLog.create({
      userId: req.user.id,
      action: 'delete',
      resource: 'rfid_card',
      resourceId: id,
      ipAddress: req.ip,
    });

    logger.info('RFID card deleted', { cardId: id, deletedBy: req.user.id });

    res.json({ message: 'Card deleted successfully' });

  } catch (error) {
    logger.error('Delete card error', { error: error.message });
    res.status(500).json({ error: 'Failed to delete card' });
  }
};

/**
 * List card requests
 */
exports.listRequests = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (status) {
      where.status = status;
    }

    const { count, rows } = await CardRequest.findAndCountAll({
      where,
      include: [
        { model: EvDriver, as: 'driver', attributes: ['id', 'name', 'email', 'phone'] },
      ],
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.json({
      requests: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });

  } catch (error) {
    logger.error('List card requests error', { error: error.message });
    res.status(500).json({ error: 'Failed to list requests' });
  }
};

/**
 * Approve card request
 */
exports.approveRequest = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await CardRequest.findByPk(id);

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request is not pending' });
    }

    // Generate and create card
    const cardNumber = generateCardNumber();
    const card = await RfidCard.create({
      driverId: request.driverId,
      cardNumber,
      status: 'active',
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000 * 3), // 3 years
    });

    await request.update({
      status: 'approved',
      approvedBy: req.user.id,
      approvedAt: new Date(),
      cardId: card.id,
    });

    // Audit log
    await AuditLog.create({
      userId: req.user.id,
      action: 'approve_card_request',
      resource: 'card_request',
      resourceId: id,
      details: { cardId: card.id, cardNumber },
      ipAddress: req.ip,
    });

    logger.info('Card request approved', { requestId: id, cardId: card.id, approvedBy: req.user.id });

    res.json({ message: 'Request approved', card });

  } catch (error) {
    logger.error('Approve request error', { error: error.message });
    res.status(500).json({ error: 'Failed to approve request' });
  }
};

/**
 * Reject card request
 */
exports.rejectRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const request = await CardRequest.findByPk(id);

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request is not pending' });
    }

    await request.update({
      status: 'rejected',
      rejectedBy: req.user.id,
      rejectedAt: new Date(),
      rejectionReason: reason,
    });

    // Audit log
    await AuditLog.create({
      userId: req.user.id,
      action: 'reject_card_request',
      resource: 'card_request',
      resourceId: id,
      details: { reason },
      ipAddress: req.ip,
    });

    logger.info('Card request rejected', { requestId: id, rejectedBy: req.user.id, reason });

    res.json({ message: 'Request rejected' });

  } catch (error) {
    logger.error('Reject request error', { error: error.message });
    res.status(500).json({ error: 'Failed to reject request' });
  }
};

/**
 * Generate card number
 */
function generateCardNumber() {
  return 'EVCARD' + crypto.randomBytes(6).toString('hex').toUpperCase();
}
