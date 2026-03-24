import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redis from '../lib/redis';

// General API rate limit: 100 requests per 15 minutes per IP
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: true, message: 'Too many requests, please try again later.', code: 429 },
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    // @ts-expect-error - Known issue with type compatibility between ioredis and rate-limit-redis
    sendCommand: (...args: string[]) => redis.call(...args),
  }),
});

// Auth endpoints rate limit: 10 requests per 15 minutes per IP
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: true, message: 'Too many login/signup attempts, please try again later.', code: 429 },
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    // @ts-expect-error - Known issue with type compatibility between ioredis and rate-limit-redis
    sendCommand: (...args: string[]) => redis.call(...args),
  }),
});

// AI generation rate limit: 30 requests per minute per user
// Note: This is per IP for simplicity, would ideally be per user ID from auth token
export const aiRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: { error: true, message: 'AI generation limit reached, please wait a minute.', code: 429 },
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    // @ts-expect-error - Known issue with type compatibility between ioredis and rate-limit-redis
    sendCommand: (...args: string[]) => redis.call(...args),
  }),
});
