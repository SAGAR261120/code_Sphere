import Redis from 'ioredis';

let client;

// In-memory fallback used when Redis is unavailable (dev only)
function createMemoryClient() {
  const store = new Map();
  const timers = new Map();

  const memClient = {
    async get(key) { return store.get(key) ?? null; },
    async set(key, value) { store.set(key, value); return 'OK'; },
    async setex(key, ttl, value) {
      store.set(key, value);
      if (timers.has(key)) clearTimeout(timers.get(key));
      timers.set(key, setTimeout(() => { store.delete(key); timers.delete(key); }, ttl * 1000));
      return 'OK';
    },
    async del(...keys) {
      let count = 0;
      for (const k of keys.flat()) { if (store.delete(k)) { clearTimeout(timers.get(k)); timers.delete(k); count++; } }
      return count;
    },
    async keys(pattern) {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
      return [...store.keys()].filter((k) => regex.test(k));
    },
    async exists(key) { return store.has(key) ? 1 : 0; },
    async incr(key) {
      const v = parseInt(store.get(key) || '0') + 1;
      store.set(key, String(v));
      return v;
    },
    async expire(key, ttl) {
      if (!store.has(key)) return 0;
      if (timers.has(key)) clearTimeout(timers.get(key));
      timers.set(key, setTimeout(() => { store.delete(key); timers.delete(key); }, ttl * 1000));
      return 1;
    },
    on() { return this; },
    status: 'ready',
  };
  return memClient;
}

export async function connectRedis() {
  const url = process.env.REDIS_URL || 'redis://localhost:6379';

  const redis = new Redis(url, {
    lazyConnect: true,
    retryStrategy: () => null, // don't retry — fail fast so we can fall back
    maxRetriesPerRequest: 1,
  });

  redis.on('error', () => {}); // suppress error log; we handle below

  try {
    await redis.connect();
    redis.on('error', (err) => console.error('Redis error:', err.message));
    redis.on('connect', () => console.log('Redis connected'));
    client = redis;
    console.log('Redis connected');
  } catch {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Redis is required in production. Set REDIS_URL in .env');
    }
    console.warn('⚠️  Redis unavailable — using in-memory cache (dev only, not suitable for production)');
    client = createMemoryClient();
  }

  return client;
}

export function getRedis() {
  if (!client) throw new Error('Redis not initialized. Call connectRedis first.');
  return client;
}

export default { connectRedis, getRedis };
