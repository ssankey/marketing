// // lib/redis.js
// import Redis from 'ioredis';

// let redisClient;

// // Initialize Redis only on the server side
// if (typeof window === 'undefined') {
//   // Server-side configuration
//   redisClient = new Redis({
//     host: process.env.REDIS_HOST || 'localhost',
//     port: process.env.REDIS_PORT || 6379,
//     password: process.env.REDIS_PASSWORD,
//     enableOfflineQueue: true,
//     showFriendlyErrorStack: true,
//     maxRetriesPerRequest: null,
//   });
// } else {
//   // Client-side mock
//   redisClient = {
//     get: () => Promise.resolve(null),
//     set: () => Promise.resolve(),
//     del: () => Promise.resolve(),
//   };
// }

// // Cache helper functions
// export const getCache = async (key) => {
//   try {
//     const data = await redisClient.get(key);
//     return data ? JSON.parse(data) : null;
//   } catch (error) {
//     console.error('Redis getCache error:', error);
//     return null;
//   }
// };

// export const setCache = async (key, data, expirationInSeconds = 3600) => {
//   try {
//     await redisClient.set(
//       key,
//       JSON.stringify(data),
//       'EX',
//       expirationInSeconds
//     );
//     return true;
//   } catch (error) {
//     console.error('Redis setCache error:', error);
//     return false;
//   }
// };

// export const delCache = async (key) => {
//   try {
//     await redisClient.del(key);
//     return true;
//   } catch (error) {
//     console.error('Redis delCache error:', error);
//     return false;
//   }
// };

// // Export the Redis client as default
// export default redisClient;

// lib/redis.js
import Redis from 'ioredis';

let redisClient;

if (typeof window === 'undefined') {
  redisClient = new Redis({
    host:     process.env.REDIS_HOST || 'localhost',
    port:     parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD,

    // ✅ Reconnect strategy — exponential backoff, max 10s between retries
    retryStrategy: (times) => {
      if (times > 10) {
        console.error('[Redis] Too many reconnect attempts, giving up');
        return null; // stop retrying
      }
      const delay = Math.min(times * 500, 10000);
      console.log(`[Redis] Reconnecting in ${delay}ms (attempt ${times})`);
      return delay;
    },

    // ✅ Keep connection alive — sends TCP keepalive every 60s
    keepAlive: 60000,

    // ✅ Auto-reconnect on timeout
    connectTimeout: 10000,
    commandTimeout: 5000,

    enableOfflineQueue: true,
    maxRetriesPerRequest: 3,
    lazyConnect: false,
  });

  redisClient.on('connect',       () => console.log('[Redis] Connected'));
  redisClient.on('ready',         () => console.log('[Redis] Ready'));
  redisClient.on('error',  (err)  => console.error('[Redis] Error:', err.message));
  redisClient.on('close',         () => console.log('[Redis] Connection closed'));
  redisClient.on('reconnecting',  () => console.log('[Redis] Reconnecting...'));

} else {
  // Client-side mock — Redis only runs server-side
  redisClient = {
    get:  () => Promise.resolve(null),
    set:  () => Promise.resolve(),
    del:  () => Promise.resolve(),
    ping: () => Promise.resolve('PONG'),
  };
}

export const getCache = async (key) => {
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('[Redis] getCache error:', error.message);
    return null; // graceful fallback — don't crash the API
  }
};

export const setCache = async (key, data, expirationInSeconds = 3600) => {
  try {
    await redisClient.set(key, JSON.stringify(data), 'EX', expirationInSeconds);
    return true;
  } catch (error) {
    console.error('[Redis] setCache error:', error.message);
    return false;
  }
};

export const delCache = async (key) => {
  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    console.error('[Redis] delCache error:', error.message);
    return false;
  }
};

export default redisClient;