/**
 * EV Charging Management Platform - Main Application Entry
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const http = require('http');

// Import configurations
const { sequelize } = require('./models');
const redis = require('./config/redis');
const logger = require('./utils/logger');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const rateLimiter = require('./middleware/rateLimiter');

// Import routes
const routes = require('./routes');

// Import Socket.IO
const { initSocket: initializeSocket } = require('./socket');

// Import OCPP Server
const { startOCPPServer } = require('./ocpp/server');

// Import Job Queue
const { scheduleRecurringJobs: initializeQueues } = require('./jobs');

const app = express();
const server = http.createServer(app);

// Trust proxy (for rate limiting behind nginx)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  credentials: true,
}));

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Request logging
app.use(morgan('combined', {
  stream: { write: (message) => logger.info(message.trim()) },
}));

// Rate limiting
app.use(rateLimiter);

// Health check endpoint
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {},
  };

  // Check database
  try {
    await sequelize.authenticate();
    health.services.database = 'ok';
  } catch (error) {
    health.services.database = 'error';
    health.status = 'degraded';
    logger.error('Database health check failed', { error: error.message });
  }

  // Check Redis
  try {
    await redis.ping();
    health.services.redis = 'ok';
  } catch (error) {
    health.services.redis = 'error';
    health.status = 'degraded';
    logger.error('Redis health check failed', { error: error.message });
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

// API routes
app.use('/api/v1', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
});

// Error handler
app.use(errorHandler);

// Initialize services and start server
async function startServer() {
  try {
    // Connect to database
    await sequelize.authenticate();
    logger.info('Database connection established');

    // Sync models (development only)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      logger.info('Database models synchronized');
    }

    // Initialize Redis connection
    await redis.ping();
    logger.info('Redis connection established');

    // Initialize Socket.IO
    initializeSocket(server);
    logger.info('Socket.IO initialized');

    // Initialize job queues
    initializeQueues();
    logger.info('Job queues initialized');

    // Start HTTP server
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      logger.info(`API server running on port ${PORT}`);
    });

    // Start OCPP WebSocket server
    const OCPP_PORT = process.env.OCPP_PORT || 9000;
    startOCPPServer(OCPP_PORT);
    logger.info(`OCPP server running on port ${OCPP_PORT}`);

  } catch (error) {
    logger.error('Failed to start server', { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...');

  server.close(() => {
    logger.info('HTTP server closed');
  });

  try {
    await sequelize.close();
    logger.info('Database connection closed');

    await redis.quit();
    logger.info('Redis connection closed');

    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', { error: error.message });
    process.exit(1);
  }
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

// Start the server
startServer();

module.exports = app;
