/**
 * Redis Rate Limiter
 *
 * Production-ready rate limiting with Redis backend.
 * Replaces in-memory rate limiter for distributed deployments.
 */

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyPrefix?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  total: number;
}

// Redis client type (simplified interface)
interface RedisClient {
  multi(): RedisPipeline;
  quit(): Promise<void>;
}

interface RedisPipeline {
  incr(key: string): RedisPipeline;
  expire(key: string, seconds: number): RedisPipeline;
  ttl(key: string): RedisPipeline;
  exec(): Promise<Array<[Error | null, any]>>;
}

let redisClient: RedisClient | null = null;

/**
 * Initialize Redis client
 */
export async function initRedisClient(): Promise<RedisClient> {
  if (redisClient) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  try {
    // Dynamic import to handle environments without Redis
    const Redis = (await import('ioredis')).default;
    redisClient = new Redis(redisUrl) as unknown as RedisClient;
    return redisClient;
  } catch (error) {
    console.warn('Redis not available, falling back to in-memory rate limiter');
    // Return mock client that uses in-memory store
    return createInMemoryFallback();
  }
}

/**
 * In-memory fallback when Redis is not available
 */
function createInMemoryFallback(): RedisClient {
  const store = new Map<string, { count: number; expiresAt: number }>();

  return {
    multi() {
      const commands: Array<{ type: string; key: string; value?: number }> = [];
      const results: Array<[Error | null, any]> = [];

      const pipeline: RedisPipeline = {
        incr(key: string) {
          commands.push({ type: 'incr', key });
          return pipeline;
        },
        expire(key: string, seconds: number) {
          commands.push({ type: 'expire', key, value: seconds });
          return pipeline;
        },
        ttl(key: string) {
          commands.push({ type: 'ttl', key });
          return pipeline;
        },
        async exec() {
          const now = Date.now();

          for (const cmd of commands) {
            try {
              if (cmd.type === 'incr') {
                const record = store.get(cmd.key);
                if (!record || now >= record.expiresAt) {
                  store.set(cmd.key, { count: 1, expiresAt: now + 60000 });
                  results.push([null, 1]);
                } else {
                  record.count++;
                  results.push([null, record.count]);
                }
              } else if (cmd.type === 'expire') {
                const record = store.get(cmd.key);
                if (record) {
                  record.expiresAt = now + (cmd.value! * 1000);
                }
                results.push([null, 1]);
              } else if (cmd.type === 'ttl') {
                const record = store.get(cmd.key);
                if (record) {
                  const ttl = Math.ceil((record.expiresAt - now) / 1000);
                  results.push([null, ttl > 0 ? ttl : -1]);
                } else {
                  results.push([null, -2]);
                }
              }
            } catch (error) {
              results.push([error as Error, null]);
            }
          }

          return results;
        },
      };

      return pipeline;
    },
    async quit() {
      store.clear();
    },
  };
}

/**
 * Check rate limit using Redis
 */
export async function checkRateLimit(
  clientId: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const redis = await initRedisClient();
  const key = `${config.keyPrefix || 'ratelimit'}:${clientId}`;
  const windowSeconds = Math.ceil(config.windowMs / 1000);

  try {
    // Use Redis transaction for atomic operations
    const results = await redis
      .multi()
      .incr(key)
      .expire(key, windowSeconds)
      .ttl(key)
      .exec();

    const count = results[0][1] as number;
    const ttl = results[2][1] as number;

    const resetAt = Date.now() + (ttl * 1000);
    const remaining = Math.max(0, config.maxRequests - count);
    const allowed = count <= config.maxRequests;

    return {
      allowed,
      remaining,
      resetAt,
      total: config.maxRequests,
    };
  } catch (error) {
    console.error('Redis rate limit error:', error);
    // Fail open - allow request on Redis error
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: Date.now() + config.windowMs,
      total: config.maxRequests,
    };
  }
}

/**
 * Create rate limiter middleware helper
 */
export function createRateLimiter(config: RateLimitConfig) {
  return {
    /**
     * Check if request is allowed
     */
    async check(clientId: string): Promise<RateLimitResult> {
      return checkRateLimit(clientId, config);
    },

    /**
     * Get rate limit headers for response
     */
    getHeaders(result: RateLimitResult): Record<string, string> {
      const headers: Record<string, string> = {
        'X-RateLimit-Limit': result.total.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': new Date(result.resetAt).toISOString(),
      };

      if (!result.allowed) {
        const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000);
        headers['Retry-After'] = retryAfter.toString();
      }

      return headers;
    },
  };
}

/**
 * Close Redis connection
 */
export async function closeRedisClient(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

/**
 * Reset rate limit for client (for testing)
 */
export async function resetRateLimit(
  clientId: string,
  keyPrefix = 'ratelimit'
): Promise<void> {
  const redis = await initRedisClient();
  const key = `${keyPrefix}:${clientId}`;

  try {
    // Use DEL command via multi
    const Redis = (await import('ioredis')).default;
    const directClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    await directClient.del(key);
    await directClient.quit();
  } catch (error) {
    console.warn('Failed to reset rate limit:', error);
  }
}
