/**
 * Reservation Controller
 */

const {
  Reservation,
  Connector,
  ChargingStation,
  EvDriver,
  AuditLog
} = require('../models');
const { Op } = require('sequelize');
const ocppCommands = require('../ocpp/commands');
const { isConnected } = require('../ocpp/server');
const logger = require('../utils/logger');

/**
 * List reservations
 */
exports.list = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      driverId,
      stationId,
      startDate,
      endDate
    } = req.query;
    const offset = (page - 1) * limit;

    const where = {};

    if (status) {
      where.status = status;
    }

    if (driverId) {
      where.driverId = driverId;
    }

    if (stationId) {
      where.stationId = stationId;
    }

    if (startDate && endDate) {
      where.startTime = {
        [Op.between]: [new Date(startDate), new Date(endDate)],
      };
    }

    const { count, rows } = await Reservation.findAndCountAll({
      where,
      include: [
        {
          model: ChargingStation,
          as: 'station',
          attributes: ['id', 'name', 'ocppIdentity'],
          include: [{ association: 'location', attributes: ['name', 'address'] }],
        },
        {
          model: Connector,
          as: 'connector',
          attributes: ['id', 'connectorId', 'type', 'status'],
        },
        {
          model: EvDriver,
          as: 'driver',
          attributes: ['id', 'name', 'phone'],
        },
      ],
      limit: parseInt(limit),
      offset,
      order: [['startTime', 'ASC']],
    });

    res.json({
      reservations: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    });

  } catch (error) {
    logger.error('List reservations error', { error: error.message });
    res.status(500).json({ error: 'Failed to list reservations' });
  }
};

/**
 * Get reservation by ID
 */
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;

    const reservation = await Reservation.findByPk(id, {
      include: [
        {
          model: ChargingStation,
          as: 'station',
          include: [{ association: 'location' }],
        },
        { model: Connector, as: 'connector' },
        { model: EvDriver, as: 'driver', attributes: { exclude: ['password'] } },
      ],
    });

    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    res.json({ reservation });

  } catch (error) {
    logger.error('Get reservation error', { error: error.message });
    res.status(500).json({ error: 'Failed to get reservation' });
  }
};

/**
 * Create reservation
 */
exports.create = async (req, res) => {
  try {
    const { connectorId, driverId, startTime, endTime, idTag } = req.body;

    // Get connector with station
    const connector = await Connector.findByPk(connectorId, {
      include: [{ model: ChargingStation, as: 'station' }],
    });

    if (!connector) {
      return res.status(404).json({ error: 'Connector not found' });
    }

    // Check connector availability
    if (connector.status !== 'Available') {
      return res.status(400).json({ error: 'Connector is not available' });
    }

    // Check for overlapping reservations
    const overlap = await Reservation.findOne({
      where: {
        connectorId,
        status: { [Op.in]: ['pending', 'confirmed'] },
        [Op.or]: [
          {
            startTime: { [Op.between]: [startTime, endTime] },
          },
          {
            endTime: { [Op.between]: [startTime, endTime] },
          },
          {
            [Op.and]: [
              { startTime: { [Op.lte]: startTime } },
              { endTime: { [Op.gte]: endTime } },
            ],
          },
        ],
      },
    });

    if (overlap) {
      return res.status(400).json({ error: 'Time slot not available' });
    }

    // Get driver's RFID
    const driver = await EvDriver.findByPk(driverId);
    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    // Create reservation
    const reservation = await Reservation.create({
      stationId: connector.stationId,
      connectorId,
      driverId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      idTag: idTag || `RES_${driverId.slice(0, 8)}`,
      status: 'pending',
    });

    // Send reservation to charger if connected
    if (isConnected(connector.station.ocppIdentity)) {
      const reservationId = parseInt(reservation.id.replace(/-/g, '').slice(0, 8), 16);

      const success = await ocppCommands.reserveNow(
        connector.station.ocppIdentity,
        connector.connectorId,
        new Date(endTime),
        reservation.idTag,
        reservationId
      );

      if (success) {
        await reservation.update({ status: 'confirmed' });
      }
    }

    // Audit log
    await AuditLog.create({
      userId: req.user?.id,
      partnerId: connector.station?.partnerId,
      action: 'create',
      resource: 'reservation',
      resourceId: reservation.id,
      details: { connectorId, driverId, startTime, endTime },
      ipAddress: req.ip,
    });

    const createdReservation = await Reservation.findByPk(reservation.id, {
      include: [
        { model: ChargingStation, as: 'station', attributes: ['id', 'name'] },
        { model: Connector, as: 'connector' },
      ],
    });

    logger.info('Reservation created', { reservationId: reservation.id });

    res.status(201).json({ reservation: createdReservation });

  } catch (error) {
    logger.error('Create reservation error', { error: error.message });
    res.status(500).json({ error: 'Failed to create reservation' });
  }
};

/**
 * Cancel reservation
 */
exports.cancel = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const reservation = await Reservation.findByPk(id, {
      include: [
        {
          model: Connector,
          as: 'connector',
          include: [{ model: ChargingStation, as: 'station' }],
        },
      ],
    });

    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    if (reservation.status === 'cancelled' || reservation.status === 'completed') {
      return res.status(400).json({ error: 'Reservation cannot be cancelled' });
    }

    // Cancel on charger if connected
    if (isConnected(reservation.connector.station.ocppIdentity)) {
      const reservationId = parseInt(reservation.id.replace(/-/g, '').slice(0, 8), 16);

      await ocppCommands.cancelReservation(
        reservation.connector.station.ocppIdentity,
        reservationId
      );
    }

    await reservation.update({
      status: 'cancelled',
      cancelledAt: new Date(),
      cancellationReason: reason,
    });

    // Audit log
    await AuditLog.create({
      userId: req.user?.id,
      partnerId: reservation.connector?.station?.partnerId,
      action: 'cancel',
      resource: 'reservation',
      resourceId: id,
      details: { reason },
      ipAddress: req.ip,
    });

    logger.info('Reservation cancelled', { reservationId: id });

    res.json({ message: 'Reservation cancelled successfully' });

  } catch (error) {
    logger.error('Cancel reservation error', { error: error.message });
    res.status(500).json({ error: 'Failed to cancel reservation' });
  }
};

/**
 * Get available slots
 */
exports.getAvailableSlots = async (req, res) => {
  try {
    const { connectorId, date } = req.query;

    if (!connectorId || !date) {
      return res.status(400).json({ error: 'Connector ID and date required' });
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get existing reservations
    const reservations = await Reservation.findAll({
      where: {
        connectorId,
        status: { [Op.in]: ['pending', 'confirmed'] },
        startTime: { [Op.between]: [startOfDay, endOfDay] },
      },
      order: [['startTime', 'ASC']],
    });

    // Generate available slots (30-min increments)
    const slots = [];
    const slotDuration = 30 * 60 * 1000; // 30 minutes

    let currentTime = startOfDay.getTime();
    const now = Date.now();

    while (currentTime < endOfDay.getTime()) {
      const slotStart = new Date(currentTime);
      const slotEnd = new Date(currentTime + slotDuration);

      // Skip past slots
      if (slotEnd.getTime() > now) {
        // Check if slot overlaps with any reservation
        const isBooked = reservations.some(res => {
          const resStart = new Date(res.startTime).getTime();
          const resEnd = new Date(res.endTime).getTime();
          return (currentTime < resEnd && (currentTime + slotDuration) > resStart);
        });

        slots.push({
          start: slotStart.toISOString(),
          end: slotEnd.toISOString(),
          available: !isBooked,
        });
      }

      currentTime += slotDuration;
    }

    res.json({ slots });

  } catch (error) {
    logger.error('Get available slots error', { error: error.message });
    res.status(500).json({ error: 'Failed to get available slots' });
  }
};

/**
 * Get upcoming reservations for driver
 */
exports.getUpcoming = async (req, res) => {
  try {
    const { driverId } = req.query;

    const reservations = await Reservation.findAll({
      where: {
        driverId,
        status: { [Op.in]: ['pending', 'confirmed'] },
        startTime: { [Op.gte]: new Date() },
      },
      include: [
        {
          model: ChargingStation,
          as: 'station',
          include: [{ association: 'location', attributes: ['name', 'address'] }],
        },
        { model: Connector, as: 'connector' },
      ],
      order: [['startTime', 'ASC']],
      limit: 10,
    });

    res.json({ reservations });

  } catch (error) {
    logger.error('Get upcoming reservations error', { error: error.message });
    res.status(500).json({ error: 'Failed to get reservations' });
  }
};
