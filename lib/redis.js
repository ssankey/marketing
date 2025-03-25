// lib/redis.js
import Redis from 'ioredis';

let redisClient;

// Initialize Redis only on the server side
if (typeof window === 'undefined') {
  // Server-side configuration
  redisClient = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
    enableOfflineQueue: true,
    showFriendlyErrorStack: true,
    maxRetriesPerRequest: null,
  });
} else {
  // Client-side mock
  redisClient = {
    get: () => Promise.resolve(null),
    set: () => Promise.resolve(),
    del: () => Promise.resolve(),
  };
}

// Cache helper functions
export const getCache = async (key) => {
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Redis getCache error:', error);
    return null;
  }
};

export const setCache = async (key, data, expirationInSeconds = 3600) => {
  try {
    await redisClient.set(
      key,
      JSON.stringify(data),
      'EX',
      expirationInSeconds
    );
    return true;
  } catch (error) {
    console.error('Redis setCache error:', error);
    return false;
  }
};

export const delCache = async (key) => {
  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    console.error('Redis delCache error:', error);
    return false;
  }
};

// Export the Redis client as default
export default redisClient;