import getRedisClient from '../config/redis.js';

const defaultTtl = 300;

export const get = async (key) => {
  const redis = getRedisClient();
  const val = await redis.get(key);
  return val ? JSON.parse(val) : null;
};

export const set = async (key, value, ttlSeconds = defaultTtl) => {
  const redis = getRedisClient();
  await redis.setex(key, ttlSeconds, JSON.stringify(value));
};

export const del = async (key) => {
  const redis = getRedisClient();
  await redis.del(key);
};

export const invalidatePattern = async (pattern) => {
  const redis = getRedisClient();
  const keys = await redis.keys(pattern);
  if (keys.length) await redis.del(...keys);
};
