/**
 * Rate limiter for MCP endpoints
 * Uses in-memory store for development, Redis for production
 */

interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

// In-memory store for development/fallback
const memoryStore = new Map<string, { count: number; resetAt: number }>();

/**
 * Check rate limit for a specific key and client
 */
export async function checkRateLimit(
  key: string,
  clientId: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const { maxRequests, windowMs } = options;
  const storeKey = `${key}:${clientId}`;
  const now = Date.now();

  // Try Redis first if available
  if (process.env.REDIS_URL) {
    try {
      return await checkRedisRateLimit(storeKey, maxRequests, windowMs, now);
    } catch (error) {
      console.warn('[RateLimiter] Redis error, falling back to memory:', error);
    }
  }

  // Fallback to in-memory
  return checkMemoryRateLimit(storeKey, maxRequests, windowMs, now);
}

/**
 * Memory-based rate limiting (for development)
 */
function checkMemoryRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
  now: number
): RateLimitResult {
  const record = memoryStore.get(key);

  // Reset window if expired
  if (!record || now >= record.resetAt) {
    const resetAt = now + windowMs;
    memoryStore.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt,
    };
  }

  // Check if limit exceeded
  if (record.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: record.resetAt,
    };
  }

  // Increment count
  record.count++;
  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetAt: record.resetAt,
  };
}

/**
 * Redis-based rate limiting (for production)
 */
async function checkRedisRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
  now: number
): Promise<RateLimitResult> {
  // Dynamic import to avoid loading Redis in development
  const { Redis } = await import('ioredis');
  const redis = new Redis(process.env.REDIS_URL!);

  try {
    const redisKey = `ratelimit:${key}`;
    const windowStart = now - windowMs;

    // Use sliding window with sorted set
    const pipeline = redis.pipeline();

    // Remove old entries
    pipeline.zremrangebyscore(redisKey, 0, windowStart);

    // Add current request
    pipeline.zadd(redisKey, now, `${now}-${Math.random()}`);

    // Count requests in window
    pipeline.zcard(redisKey);

    // Set expiry
    pipeline.pexpire(redisKey, windowMs);

    const results = await pipeline.exec();
    const count = results?.[2]?.[1] as number || 0;

    const resetAt = now + windowMs;
    const allowed = count <= maxRequests;
    const remaining = Math.max(0, maxRequests - count);

    return { allowed, remaining, resetAt };
  } finally {
    await redis.quit();
  }
}

/**
 * Clear rate limit for a key (useful for testing)
 */
export async function clearRateLimit(key: string, clientId: string): Promise<void> {
  const storeKey = `${key}:${clientId}`;

  memoryStore.delete(storeKey);

  if (process.env.REDIS_URL) {
    try {
      const { Redis } = await import('ioredis');
      const redis = new Redis(process.env.REDIS_URL);
      await redis.del(`ratelimit:${storeKey}`);
      await redis.quit();
    } catch (error) {
      console.warn('[RateLimiter] Failed to clear Redis key:', error);
    }
  }
}
