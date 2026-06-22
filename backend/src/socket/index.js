/**
 * Socket.IO Server for Real-time Updates
 */

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const logger = require('../utils/logger');

let io = null;

/**
 * Initialize Socket.IO server
 */
function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;

      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, jwtConfig.accessToken.secret);
      socket.user = decoded;

      logger.debug('Socket authenticated', { userId: decoded.id, role: decoded.role });

      next();
    } catch (error) {
      logger.warn('Socket authentication failed', { error: error.message });
      next(new Error('Authentication failed'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    const { user } = socket;

    logger.info('Socket connected', { userId: user.id, socketId: socket.id });

    // Join user-specific room
    socket.join(`user:${user.id}`);

    // Join role-based room
    socket.join(`role:${user.role}`);

    // Join partner room if applicable
    if (user.partnerId) {
      socket.join(`partner:${user.partnerId}`);
    }

    // Handle joining specific rooms
    socket.on('join:station', (stationId) => {
      socket.join(`station:${stationId}`);
      logger.debug('Joined station room', { userId: user.id, stationId });
    });

    socket.on('leave:station', (stationId) => {
      socket.leave(`station:${stationId}`);
      logger.debug('Left station room', { userId: user.id, stationId });
    });

    socket.on('join:session', (sessionId) => {
      socket.join(`session:${sessionId}`);
      logger.debug('Joined session room', { userId: user.id, sessionId });
    });

    socket.on('leave:session', (sessionId) => {
      socket.leave(`session:${sessionId}`);
      logger.debug('Left session room', { userId: user.id, sessionId });
    });

    // Handle driver-specific events
    if (user.role === 'driver') {
      socket.join(`driver:${user.driverId || user.id}`);
    }

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      logger.info('Socket disconnected', { userId: user.id, socketId: socket.id, reason });
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error('Socket error', { userId: user.id, error: error.message });
    });
  });

  logger.info('Socket.IO server initialized');

  return io;
}

/**
 * Get Socket.IO instance
 */
function getIO() {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
}

/**
 * Emit event to specific user
 */
function emitToUser(userId, event, data) {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
}

/**
 * Emit event to specific partner
 */
function emitToPartner(partnerId, event, data) {
  if (!io) return;
  io.to(`partner:${partnerId}`).emit(event, data);
}

/**
 * Emit event to specific station room
 */
function emitToStation(stationId, event, data) {
  if (!io) return;
  io.to(`station:${stationId}`).emit(event, data);
}

/**
 * Emit event to specific driver
 */
function emitToDriver(driverId, event, data) {
  if (!io) return;
  io.to(`driver:${driverId}`).emit(event, data);
}

/**
 * Emit event to specific role
 */
function emitToRole(role, event, data) {
  if (!io) return;
  io.to(`role:${role}`).emit(event, data);
}

/**
 * Broadcast event to all connected clients
 */
function broadcast(event, data) {
  if (!io) return;
  io.emit(event, data);
}

module.exports = {
  initSocket,
  getIO,
  emitToUser,
  emitToPartner,
  emitToStation,
  emitToDriver,
  emitToRole,
  broadcast,
};
