/**
 * OCPP StatusNotification Handler
 */

const { ChargingStation, Connector, Session } = require('../../models');
const logger = require('../../utils/logger');
const { getIO } = require('../../socket');

/**
 * Handle StatusNotification from charge point
 */
async function statusNotificationHandler(chargePointId, payload) {
  const { connectorId, status, errorCode, info, timestamp, vendorId, vendorErrorCode } = payload;

  logger.info('StatusNotification received', { chargePointId, connectorId, status, errorCode });

  try {
    const station = await ChargingStation.findOne({
      where: { ocppIdentity: chargePointId },
    });

    if (!station) {
      logger.warn('Station not found for StatusNotification', { chargePointId });
      return {};
    }

    if (connectorId === 0) {
      // Connector 0 refers to the whole charge point
      await ChargingStation.update(
        {
          status,
          errorCode,
          lastStatusUpdate: timestamp ? new Date(timestamp) : new Date(),
        },
        { where: { id: station.id } }
      );
    } else {
      // Update specific connector
      const [updated] = await Connector.update(
        {
          status,
          errorCode,
          info,
          vendorId,
          vendorErrorCode,
          lastStatusUpdate: timestamp ? new Date(timestamp) : new Date(),
        },
        {
          where: {
            stationId: station.id,
            connectorId,
          },
        }
      );

      if (updated === 0) {
        // Connector doesn't exist, create it
        await Connector.create({
          stationId: station.id,
          connectorId,
          status,
          errorCode,
          info,
          vendorId,
          vendorErrorCode,
          lastStatusUpdate: timestamp ? new Date(timestamp) : new Date(),
        });
      }

      // Update overall station status based on connectors
      await updateStationStatus(station.id);
    }

    // Emit real-time update
    try {
      const io = getIO();
      io.to(`station:${station.id}`).emit('connector:status', {
        stationId: station.id,
        connectorId,
        status,
        errorCode,
        timestamp: timestamp || new Date().toISOString(),
      });

      io.to(`partner:${station.partnerId}`).emit('station:status', {
        stationId: station.id,
        connectorId,
        status,
      });
    } catch (socketError) {
      // Socket might not be initialized
      logger.debug('Socket emit skipped', { error: socketError.message });
    }

    return {};

  } catch (error) {
    logger.error('StatusNotification handler error', { chargePointId, error: error.message });
    return {};
  }
}

/**
 * Update station status based on connector statuses
 */
async function updateStationStatus(stationId) {
  const connectors = await Connector.findAll({
    where: { stationId },
    attributes: ['status'],
  });

  if (connectors.length === 0) return;

  const statuses = connectors.map(c => c.status);

  let stationStatus = 'Available';

  if (statuses.every(s => s === 'Faulted')) {
    stationStatus = 'Faulted';
  } else if (statuses.every(s => s === 'Unavailable')) {
    stationStatus = 'Unavailable';
  } else if (statuses.some(s => s === 'Charging')) {
    stationStatus = 'Charging';
  } else if (statuses.some(s => s === 'Occupied')) {
    stationStatus = 'Occupied';
  } else if (statuses.some(s => s === 'Reserved')) {
    stationStatus = 'Reserved';
  } else if (statuses.some(s => s === 'Preparing')) {
    stationStatus = 'Preparing';
  } else if (statuses.some(s => s === 'Finishing')) {
    stationStatus = 'Finishing';
  }

  await ChargingStation.update(
    { status: stationStatus },
    { where: { id: stationId } }
  );
}

module.exports = statusNotificationHandler;
