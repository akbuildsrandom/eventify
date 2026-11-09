import { Redis } from '@upstash/redis';
import { env } from './env.js';

class MemoryCache {
  constructor() {
    this.store = new Map();
  }

  async get(key) {
    const item = this.store.get(key);
    if (!item) return null;
    if (item.expiry && Date.now() > item.expiry) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key, value, options = {}) {
    let expiry = null;
    if (options.ex) {
      expiry = Date.now() + options.ex * 1000;
    }
    this.store.set(key, { value, expiry });
    return 'OK';
  }

  async del(key) {
    return this.store.delete(key) ? 1 : 0;
  }

  async flushall() {
    this.store.clear();
    return 'OK';
  }

  async incr(key) {
    const current = (await this.get(key)) || 0;
    const next = Number(current) + 1;
    const item = this.store.get(key);
    this.store.set(key, { value: next, expiry: item ? item.expiry : null });
    return next;
  }

  async expire(key, seconds) {
    const item = this.store.get(key);
    if (!item) return 0;
    item.expiry = Date.now() + seconds * 1000;
    return 1;
  }
}

let redisClient;
let isRedisAvailable = false;

if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
  try {
    redisClient = new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    });
    isRedisAvailable = true;
    console.log('⚡ Upstash Redis client initialized');
  } catch (err) {
    console.warn('⚠️ Failed to initialize Upstash Redis. Falling back to in-memory store:', err.message);
    redisClient = new MemoryCache();
  }
} else {
  // Resilient in-memory fallback for local development or when Upstash is not configured
  redisClient = new MemoryCache();
  isRedisAvailable = false;
}

export const cache = {
  client: redisClient,
  isRemote: isRedisAvailable,

  async get(key) {
    try {
      const val = await redisClient.get(key);
      if (typeof val === 'string') {
        try {
          return JSON.parse(val);
        } catch {
          return val;
        }
      }
      return val;
    } catch (err) {
      console.warn(`[Cache Error] GET ${key}:`, err.message);
      return null;
    }
  },

  async set(key, value, ttlSeconds = 300) {
    try {
      const serialized = typeof value === 'object' ? JSON.stringify(value) : value;
      return await redisClient.set(key, serialized, { ex: ttlSeconds });
    } catch (err) {
      console.warn(`[Cache Error] SET ${key}:`, err.message);
      return null;
    }
  },

  async del(key) {
    try {
      return await redisClient.del(key);
    } catch (err) {
      console.warn(`[Cache Error] DEL ${key}:`, err.message);
      return null;
    }
  },

  async invalidatePattern(prefix) {
    // In-memory or Redis key invalidation
    if (redisClient instanceof MemoryCache) {
      for (const k of redisClient.store.keys()) {
        if (k.startsWith(prefix)) {
          redisClient.store.delete(k);
        }
      }
    }
  },
};

export default cache;
