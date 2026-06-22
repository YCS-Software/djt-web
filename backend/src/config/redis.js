/**
 * Redis Configuration
 */

// Set REDIS_MOCK=true to use an in-memory Redis (no Redis server needed for local dev).
const Redis = process.env.REDIS_MOCK === 'true' ? require('ioredis-mock') : require('ioredis');
const logger = require('../utils/logger');

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: process.env.REDIS_DB || 0,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: false,
};

const redis = new Redis(redisConfig);

redis.on('connect', () => {
  logger.info('Redis client connected');
});

redis.on('ready', () => {
  logger.info('Redis client ready');
});

redis.on('error', (error) => {
  logger.error('Redis client error', { error: error.message });
});

redis.on('close', () => {
  logger.warn('Redis client connection closed');
});

redis.on('reconnecting', () => {
  logger.info('Redis client reconnecting');
});

// Cache utility functions
const cache = {
  /**
   * Get value from cache
   */
  async get(key) {
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  },

  /**
   * Set value in cache with optional TTL (in seconds)
   */
  async set(key, value, ttl = 300) {
    const serialized = JSON.stringify(value);
    if (ttl) {
      await redis.setex(key, ttl, serialized);
    } else {
      await redis.set(key, serialized);
    }
  },

  /**
   * Delete key from cache
   */
  async del(key) {
    await redis.del(key);
  },

  /**
   * Delete keys matching pattern
   */
  async delPattern(pattern) {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  },

  /**
   * Check if key exists
   */
  async exists(key) {
    return await redis.exists(key);
  },

  /**
   * Set hash field
   */
  async hset(key, field, value) {
    await redis.hset(key, field, JSON.stringify(value));
  },

  /**
   * Get hash field
   */
  async hget(key, field) {
    const value = await redis.hget(key, field);
    return value ? JSON.parse(value) : null;
  },

  /**
   * Get all hash fields
   */
  async hgetall(key) {
    const data = await redis.hgetall(key);
    const result = {};
    for (const [field, value] of Object.entries(data)) {
      result[field] = JSON.parse(value);
    }
    return result;
  },

  /**
   * Delete hash field
   */
  async hdel(key, field) {
    await redis.hdel(key, field);
  },

  /**
   * Increment value
   */
  async incr(key) {
    return await redis.incr(key);
  },

  /**
   * Set expiry on key
   */
  async expire(key, seconds) {
    await redis.expire(key, seconds);
  },

  /**
   * Publish message to channel
   */
  async publish(channel, message) {
    await redis.publish(channel, JSON.stringify(message));
  },
};

module.exports = redis;
module.exports.cache = cache;
