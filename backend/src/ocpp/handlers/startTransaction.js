/**
 * OCPP StartTransaction Handler
 */

const {
  ChargingStation,
  Connector,
  Session,
  RfidCard,
  EvDriver,
  Tariff
} = require('../../models');
const logger = require('../../utils/logger');
const { getIO } = require('../../socket');

/**
 * Handle StartTransaction from charge point
 */
async function startTransactionHandler(chargePointId, payload) {
  const { connectorId, idTag, meterStart, timestamp, reservationId } = payload;

  logger.info('StartTransaction received', { chargePointId, connectorId, idTag, meterStart });

  try {
    // Find station
    const station = await ChargingStation.findOne({
      where: { ocppIdentity: chargePointId },
      include: [
        {
          model: Connector,
          as: 'connectors',
          where: { connectorId },
          required: false,
        },
      ],
    });

    if (!station) {
      logger.error('Station not found for StartTransaction', { chargePointId });
      return {
        transactionId: 0,
        idTagInfo: { status: 'Invalid' },
      };
    }

    // Find RFID card and driver
    const rfidCard = await RfidCard.findOne({
      where: { cardNumber: idTag },
      include: [{ model: EvDriver, as: 'driver' }],
    });

    if (!rfidCard || !rfidCard.driver) {
      logger.warn('Unknown idTag for StartTransaction', { chargePointId, idTag });
      return {
        transactionId: 0,
        idTagInfo: { status: 'Invalid' },
      };
    }

    // Get applicable tariff
    const tariff = await Tariff.findOne({
      where: {
        partnerId: station.partnerId,
        isActive: true,
      },
      order: [['createdAt', 'DESC']],
    });

    // Create session
    const session = await Session.create({
      stationId: station.id,
      connectorId: station.connectors?.[0]?.id,
      connectorNumber: connectorId,
      driverId: rfidCard.driver.id,
      tariffId: tariff?.id,
      startMethod: reservationId ? 'reservation' : 'rfid',
      idTag,
      meterStart,
      startTime: timestamp ? new Date(timestamp) : new Date(),
      status: 'active',
      reservationId: reservationId || null,
    });

    // Update connector status
    await Connector.update(
      {
        status: 'Charging',
        currentSessionId: session.id,
      },
      {
        where: {
          stationId: station.id,
          connectorId
        }
      }
    );

    // Emit real-time update
    try {
      const io = getIO();
      io.to(`station:${station.id}`).emit('session:started', {
        sessionId: session.id,
        stationId: station.id,
        connectorId,
        driverId: rfidCard.driver.id,
        startTime: session.startTime,
      });

      io.to(`driver:${rfidCard.driver.id}`).emit('session:started', {
        sessionId: session.id,
        stationId: station.id,
        stationName: station.name,
      });
    } catch (socketError) {
      logger.debug('Socket emit skipped', { error: socketError.message });
    }

    logger.info('Transaction started', {
      chargePointId,
      transactionId: session.id,
      driverId: rfidCard.driver.id
    });

    return {
      transactionId: parseInt(session.id.replace(/-/g, '').slice(0, 8), 16), // Convert UUID to numeric ID
      idTagInfo: {
        status: 'Accepted',
      },
    };

  } catch (error) {
    logger.error('StartTransaction handler error', { chargePointId, error: error.message });
    return {
      transactionId: 0,
      idTagInfo: { status: 'Invalid' },
    };
  }
}

module.exports = startTransactionHandler;
