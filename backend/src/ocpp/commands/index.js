/**
 * OCPP Central System Commands
 * Commands sent from central system to charge point
 */

const { sendCall, isConnected } = require('../server');
const { ChargingStation, Session } = require('../../models');
const logger = require('../../utils/logger');

/**
 * Send RemoteStartTransaction command
 */
async function remoteStartTransaction(chargePointId, connectorId, idTag) {
  logger.info('Sending RemoteStartTransaction', { chargePointId, connectorId, idTag });

  const payload = {
    connectorId,
    idTag,
  };

  const response = await sendCall(chargePointId, 'RemoteStartTransaction', payload);

  return response.status === 'Accepted';
}

/**
 * Send RemoteStopTransaction command
 */
async function remoteStopTransaction(chargePointId, transactionId) {
  logger.info('Sending RemoteStopTransaction', { chargePointId, transactionId });

  const payload = {
    transactionId,
  };

  const response = await sendCall(chargePointId, 'RemoteStopTransaction', payload);

  return response.status === 'Accepted';
}

/**
 * Send Reset command
 */
async function reset(chargePointId, type = 'Soft') {
  logger.info('Sending Reset', { chargePointId, type });

  const payload = {
    type, // 'Hard' or 'Soft'
  };

  const response = await sendCall(chargePointId, 'Reset', payload);

  return response.status === 'Accepted';
}

/**
 * Send ChangeConfiguration command
 */
async function changeConfiguration(chargePointId, key, value) {
  logger.info('Sending ChangeConfiguration', { chargePointId, key, value });

  const payload = {
    key,
    value,
  };

  const response = await sendCall(chargePointId, 'ChangeConfiguration', payload);

  return response.status === 'Accepted';
}

/**
 * Send GetConfiguration command
 */
async function getConfiguration(chargePointId, keys = []) {
  logger.info('Sending GetConfiguration', { chargePointId, keys });

  const payload = {};
  if (keys.length > 0) {
    payload.key = keys;
  }

  return await sendCall(chargePointId, 'GetConfiguration', payload);
}

/**
 * Send UnlockConnector command
 */
async function unlockConnector(chargePointId, connectorId) {
  logger.info('Sending UnlockConnector', { chargePointId, connectorId });

  const payload = {
    connectorId,
  };

  const response = await sendCall(chargePointId, 'UnlockConnector', payload);

  return response.status === 'Unlocked';
}

/**
 * Send ClearCache command
 */
async function clearCache(chargePointId) {
  logger.info('Sending ClearCache', { chargePointId });

  const response = await sendCall(chargePointId, 'ClearCache', {});

  return response.status === 'Accepted';
}

/**
 * Send ChangeAvailability command
 */
async function changeAvailability(chargePointId, connectorId, type) {
  logger.info('Sending ChangeAvailability', { chargePointId, connectorId, type });

  const payload = {
    connectorId,
    type, // 'Operative' or 'Inoperative'
  };

  const response = await sendCall(chargePointId, 'ChangeAvailability', payload);

  return response.status === 'Accepted' || response.status === 'Scheduled';
}

/**
 * Send ReserveNow command
 */
async function reserveNow(chargePointId, connectorId, expiryDate, idTag, reservationId, parentIdTag = null) {
  logger.info('Sending ReserveNow', { chargePointId, connectorId, reservationId });

  const payload = {
    connectorId,
    expiryDate: expiryDate.toISOString(),
    idTag,
    reservationId,
  };

  if (parentIdTag) {
    payload.parentIdTag = parentIdTag;
  }

  const response = await sendCall(chargePointId, 'ReserveNow', payload);

  return response.status === 'Accepted';
}

/**
 * Send CancelReservation command
 */
async function cancelReservation(chargePointId, reservationId) {
  logger.info('Sending CancelReservation', { chargePointId, reservationId });

  const payload = {
    reservationId,
  };

  const response = await sendCall(chargePointId, 'CancelReservation', payload);

  return response.status === 'Accepted';
}

/**
 * Send TriggerMessage command
 */
async function triggerMessage(chargePointId, requestedMessage, connectorId = null) {
  logger.info('Sending TriggerMessage', { chargePointId, requestedMessage, connectorId });

  const payload = {
    requestedMessage, // 'BootNotification', 'Heartbeat', 'MeterValues', 'StatusNotification'
  };

  if (connectorId !== null) {
    payload.connectorId = connectorId;
  }

  const response = await sendCall(chargePointId, 'TriggerMessage', payload);

  return response.status === 'Accepted';
}

/**
 * Send UpdateFirmware command
 */
async function updateFirmware(chargePointId, location, retrieveDate, retries = 3, retryInterval = 60) {
  logger.info('Sending UpdateFirmware', { chargePointId, location });

  const payload = {
    location,
    retrieveDate: retrieveDate.toISOString(),
    retries,
    retryInterval,
  };

  // This command has no response payload, just confirmation
  await sendCall(chargePointId, 'UpdateFirmware', payload);

  return true;
}

/**
 * Send GetDiagnostics command
 */
async function getDiagnostics(chargePointId, location, startTime = null, stopTime = null, retries = 3, retryInterval = 60) {
  logger.info('Sending GetDiagnostics', { chargePointId, location });

  const payload = {
    location,
    retries,
    retryInterval,
  };

  if (startTime) {
    payload.startTime = startTime.toISOString();
  }
  if (stopTime) {
    payload.stopTime = stopTime.toISOString();
  }

  const response = await sendCall(chargePointId, 'GetDiagnostics', payload);

  return response.fileName || null;
}

/**
 * Send DataTransfer command
 */
async function dataTransfer(chargePointId, vendorId, messageId = null, data = null) {
  logger.info('Sending DataTransfer', { chargePointId, vendorId, messageId });

  const payload = {
    vendorId,
  };

  if (messageId) {
    payload.messageId = messageId;
  }
  if (data) {
    payload.data = typeof data === 'string' ? data : JSON.stringify(data);
  }

  const response = await sendCall(chargePointId, 'DataTransfer', payload);

  return {
    status: response.status,
    data: response.data,
  };
}

module.exports = {
  remoteStartTransaction,
  remoteStopTransaction,
  reset,
  changeConfiguration,
  getConfiguration,
  unlockConnector,
  clearCache,
  changeAvailability,
  reserveNow,
  cancelReservation,
  triggerMessage,
  updateFirmware,
  getDiagnostics,
  dataTransfer,
};
