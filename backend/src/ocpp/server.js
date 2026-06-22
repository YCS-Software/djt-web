/**
 * OCPP 1.6J WebSocket Server
 */

const WebSocket = require('ws');
const url = require('url');
const { v4: uuidv4 } = require('uuid');
const ocppConfig = require('../config/ocpp');
const redis = require('../config/redis');
const logger = require('../utils/logger');
const { ChargingStation, OcppLog } = require('../models');

// Message handlers
const bootNotificationHandler = require('./handlers/bootNotification');
const heartbeatHandler = require('./handlers/heartbeat');
const statusNotificationHandler = require('./handlers/statusNotification');
const authorizeHandler = require('./handlers/authorize');
const startTransactionHandler = require('./handlers/startTransaction');
const stopTransactionHandler = require('./handlers/stopTransaction');
const meterValuesHandler = require('./handlers/meterValues');

// Store active connections
const connections = new Map();
const pendingRequests = new Map();

/**
 * Start OCPP WebSocket server
 */
function startOCPPServer(port) {
  const wss = new WebSocket.Server({
    port,
    path: ocppConfig.server.path,
  });

  wss.on('connection', async (ws, req) => {
    const parsedUrl = url.parse(req.url, true);
    const pathParts = parsedUrl.pathname.split('/').filter(Boolean);
    const chargePointId = pathParts[pathParts.length - 1];

    if (!chargePointId) {
      logger.warn('OCPP connection without charge point ID');
      ws.close(4001, 'No charge point ID');
      return;
    }

    logger.info('OCPP connection attempt', { chargePointId, ip: req.socket.remoteAddress });

    // Validate charge point exists
    const station = await ChargingStation.findOne({
      where: { ocppIdentity: chargePointId },
    });

    if (!station) {
      logger.warn('Unknown charge point connection', { chargePointId });
      ws.close(4001, 'Unknown charge point');
      return;
    }

    // Store connection
    connections.set(chargePointId, {
      ws,
      stationId: station.id,
      connectedAt: new Date(),
    });

    // Store in Redis for distributed systems
    await redis.hset('ocpp:connections', chargePointId, JSON.stringify({
      stationId: station.id,
      connectedAt: new Date().toISOString(),
    }));

    logger.info('OCPP connection established', { chargePointId, stationId: station.id });

    // Handle incoming messages
    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        await handleMessage(chargePointId, message, ws);
      } catch (error) {
        logger.error('OCPP message parse error', { chargePointId, error: error.message });
      }
    });

    // Handle connection close
    ws.on('close', async (code, reason) => {
      logger.info('OCPP connection closed', { chargePointId, code, reason: reason.toString() });

      connections.delete(chargePointId);
      await redis.hdel('ocpp:connections', chargePointId);

      // Mark station as offline
      await ChargingStation.update(
        { isOnline: false },
        { where: { ocppIdentity: chargePointId } }
      );
    });

    // Handle errors
    ws.on('error', (error) => {
      logger.error('OCPP WebSocket error', { chargePointId, error: error.message });
    });
  });

  wss.on('error', (error) => {
    logger.error('OCPP server error', { error: error.message });
  });

  logger.info(`OCPP 1.6J server started on port ${port}`);

  return wss;
}

/**
 * Handle incoming OCPP message
 */
async function handleMessage(chargePointId, message, ws) {
  const [messageTypeId, messageId, ...rest] = message;

  // Log incoming message
  await logOcppMessage(chargePointId, 'incoming', messageTypeId, messageId, rest);

  switch (messageTypeId) {
    case ocppConfig.messageTypes.CALL:
      await handleCall(chargePointId, messageId, rest[0], rest[1], ws);
      break;

    case ocppConfig.messageTypes.CALLRESULT:
      await handleCallResult(chargePointId, messageId, rest[0]);
      break;

    case ocppConfig.messageTypes.CALLERROR:
      await handleCallError(chargePointId, messageId, rest[0], rest[1], rest[2]);
      break;

    default:
      logger.warn('Unknown OCPP message type', { chargePointId, messageTypeId });
  }
}

/**
 * Handle CALL message (request from charge point)
 */
async function handleCall(chargePointId, messageId, action, payload, ws) {
  logger.debug('OCPP CALL received', { chargePointId, action, messageId });

  let response;

  try {
    switch (action) {
      case 'BootNotification':
        response = await bootNotificationHandler(chargePointId, payload);
        break;

      case 'Heartbeat':
        response = await heartbeatHandler(chargePointId, payload);
        break;

      case 'StatusNotification':
        response = await statusNotificationHandler(chargePointId, payload);
        break;

      case 'Authorize':
        response = await authorizeHandler(chargePointId, payload);
        break;

      case 'StartTransaction':
        response = await startTransactionHandler(chargePointId, payload);
        break;

      case 'StopTransaction':
        response = await stopTransactionHandler(chargePointId, payload);
        break;

      case 'MeterValues':
        response = await meterValuesHandler(chargePointId, payload);
        break;

      case 'DiagnosticsStatusNotification':
      case 'FirmwareStatusNotification':
        response = {};
        break;

      default:
        logger.warn('Unsupported OCPP action', { chargePointId, action });
        sendError(ws, messageId, 'NotImplemented', `Action ${action} not implemented`);
        return;
    }

    // Send CALLRESULT
    sendCallResult(ws, messageId, response);
    await logOcppMessage(chargePointId, 'outgoing', 3, messageId, response, action);

  } catch (error) {
    logger.error('OCPP handler error', { chargePointId, action, error: error.message });
    sendError(ws, messageId, 'InternalError', error.message);
  }
}

/**
 * Handle CALLRESULT (response from charge point)
 */
async function handleCallResult(chargePointId, messageId, payload) {
  const pending = pendingRequests.get(messageId);

  if (pending) {
    pending.resolve(payload);
    pendingRequests.delete(messageId);
    logger.debug('OCPP CALLRESULT received', { chargePointId, messageId });
  } else {
    logger.warn('Unexpected CALLRESULT', { chargePointId, messageId });
  }
}

/**
 * Handle CALLERROR (error from charge point)
 */
async function handleCallError(chargePointId, messageId, errorCode, errorDescription, errorDetails) {
  const pending = pendingRequests.get(messageId);

  if (pending) {
    pending.reject(new Error(`${errorCode}: ${errorDescription}`));
    pendingRequests.delete(messageId);
    logger.warn('OCPP CALLERROR received', { chargePointId, messageId, errorCode, errorDescription });
  }
}

/**
 * Send CALL message to charge point
 */
async function sendCall(chargePointId, action, payload) {
  const connection = connections.get(chargePointId);

  if (!connection || connection.ws.readyState !== WebSocket.OPEN) {
    throw new Error(`Charge point ${chargePointId} not connected`);
  }

  const messageId = uuidv4();
  const message = [ocppConfig.messageTypes.CALL, messageId, action, payload];

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      pendingRequests.delete(messageId);
      reject(new Error(`Timeout waiting for response to ${action}`));
    }, ocppConfig.messageTimeout);

    pendingRequests.set(messageId, {
      resolve: (result) => {
        clearTimeout(timeout);
        resolve(result);
      },
      reject: (error) => {
        clearTimeout(timeout);
        reject(error);
      },
    });

    connection.ws.send(JSON.stringify(message));
    logOcppMessage(chargePointId, 'outgoing', 2, messageId, payload, action);

    logger.debug('OCPP CALL sent', { chargePointId, action, messageId });
  });
}

/**
 * Send CALLRESULT
 */
function sendCallResult(ws, messageId, payload) {
  const message = [ocppConfig.messageTypes.CALLRESULT, messageId, payload];
  ws.send(JSON.stringify(message));
}

/**
 * Send CALLERROR
 */
function sendError(ws, messageId, errorCode, errorDescription, errorDetails = {}) {
  const message = [ocppConfig.messageTypes.CALLERROR, messageId, errorCode, errorDescription, errorDetails];
  ws.send(JSON.stringify(message));
}

/**
 * Log OCPP message to database
 */
async function logOcppMessage(chargePointId, direction, messageType, messageId, payload, action = null) {
  try {
    const station = await ChargingStation.findOne({
      where: { ocppIdentity: chargePointId },
      attributes: ['id'],
    });

    await OcppLog.create({
      stationId: station?.id,
      ocppIdentity: chargePointId,
      direction,
      messageType: messageType.toString(),
      messageId,
      action,
      payload: typeof payload === 'object' ? payload : { data: payload },
    });
  } catch (error) {
    logger.error('Failed to log OCPP message', { error: error.message });
  }
}

/**
 * Check if charge point is connected
 */
function isConnected(chargePointId) {
  const connection = connections.get(chargePointId);
  return connection && connection.ws.readyState === WebSocket.OPEN;
}

/**
 * Get all connected charge points
 */
function getConnectedChargePoints() {
  return Array.from(connections.keys());
}

module.exports = {
  startOCPPServer,
  sendCall,
  isConnected,
  getConnectedChargePoints,
};
