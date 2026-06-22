/**
 * OCPP Heartbeat Handler
 */

const { ChargingStation } = require('../../models');
const logger = require('../../utils/logger');

/**
 * Handle Heartbeat from charge point
 */
async function heartbeatHandler(chargePointId, payload) {
  logger.debug('Heartbeat received', { chargePointId });

  try {
    // Update last heartbeat timestamp
    await ChargingStation.update(
      {
        lastHeartbeat: new Date(),
        isOnline: true,
      },
      { where: { ocppIdentity: chargePointId } }
    );

    return {
      currentTime: new Date().toISOString(),
    };

  } catch (error) {
    logger.error('Heartbeat handler error', { chargePointId, error: error.message });

    return {
      currentTime: new Date().toISOString(),
    };
  }
}

module.exports = heartbeatHandler;
