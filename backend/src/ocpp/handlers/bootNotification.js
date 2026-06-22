/**
 * OCPP BootNotification Handler
 */

const { ChargingStation } = require('../../models');
const ocppConfig = require('../../config/ocpp');
const logger = require('../../utils/logger');

/**
 * Handle BootNotification from charge point
 */
async function bootNotificationHandler(chargePointId, payload) {
  logger.info('BootNotification received', { chargePointId, payload });

  const {
    chargePointVendor,
    chargePointModel,
    chargePointSerialNumber,
    firmwareVersion,
    iccid,
    imsi,
  } = payload;

  try {
    // Update station information
    await ChargingStation.update(
      {
        vendor: chargePointVendor,
        model: chargePointModel,
        serialNumber: chargePointSerialNumber,
        firmwareVersion,
        iccid,
        imsi,
        isOnline: true,
        lastBoot: new Date(),
        bootNotification: payload,
      },
      { where: { ocppIdentity: chargePointId } }
    );

    logger.info('Station registered successfully', { chargePointId });

    return {
      status: ocppConfig.registrationStatus.Accepted,
      currentTime: new Date().toISOString(),
      interval: ocppConfig.heartbeat.interval,
    };

  } catch (error) {
    logger.error('BootNotification handler error', { chargePointId, error: error.message });

    return {
      status: ocppConfig.registrationStatus.Rejected,
      currentTime: new Date().toISOString(),
      interval: ocppConfig.heartbeat.interval,
    };
  }
}

module.exports = bootNotificationHandler;
