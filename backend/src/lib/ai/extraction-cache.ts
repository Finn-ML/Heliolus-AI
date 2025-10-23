/**
 * Redis Caching Layer for Website Extraction
 * Story 2.1 Phase 1: Cache extraction results for 24 hours
 */

import crypto from 'crypto';
import type { WebsiteExtractionResult } from './website-extractor.js';

// Lazy import Redis to avoid initialization errors in tests
let redis: any = null;
let redisAvailable: boolean | null = null;

async function getRedis() {
  // If we already know Redis is unavailable, skip
  if (redisAvailable === false) {
    return null;
  }

  if (!redis) {
    try {
      const { default: Redis } = await import('ioredis');
      redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
        maxRetriesPerRequest: 1,
        enableReadyCheck: false,
        lazyConnect: true,
        retryStrategy: () => null, // Disable automatic reconnection
        reconnectOnError: () => false, // Never reconnect on errors
      });

      // Suppress error spam - we handle this gracefully
      redis.on('error', () => {
        // Silently ignore - we already logged that Redis is unavailable
      });

      // Test connection
      await redis.connect();
      await redis.ping();
      redisAvailable = true;
      console.log('[Cache] Redis connected successfully');
    } catch (error) {
      console.log('[Cache] Redis not available, caching disabled');
      redisAvailable = false;

      // Clean up failed connection
      if (redis) {
        redis.disconnect();
        redis = null;
      }

      return null;
    }
  }
  return redis;
}

const CACHE_PREFIX = 'website_extraction:';
const CACHE_TTL = 24 * 60 * 60; // 24 hours in seconds

/**
 * Generate cache key from URL
 */
function generateCacheKey(url: string): string {
  const hash = crypto.createHash('sha256').update(url.toLowerCase()).digest('hex');
  return `${CACHE_PREFIX}${hash}`;
}

/**
 * Get cached extraction result
 */
export async function getCachedExtraction(url: string): Promise<WebsiteExtractionResult | null> {
  try {
    const redisClient = await getRedis();

    // If Redis is not available, skip caching
    if (!redisClient) {
      return null;
    }

    const cacheKey = generateCacheKey(url);
    const cached = await redisClient.get(cacheKey);

    if (!cached) {
      return null;
    }

    const result: WebsiteExtractionResult = JSON.parse(cached);
    console.log(`[Cache HIT] Website extraction for ${url}`);
    return result;
  } catch (error) {
    console.error(`[Cache ERROR] Failed to get cached extraction: ${error}`);
    return null; // Fail gracefully
  }
}

/**
 * Cache extraction result
 */
export async function cacheExtraction(url: string, result: WebsiteExtractionResult): Promise<void> {
  try {
    const redisClient = await getRedis();

    // If Redis is not available, skip caching
    if (!redisClient) {
      return;
    }

    const cacheKey = generateCacheKey(url);
    const serialized = JSON.stringify(result);

    await redisClient.setex(cacheKey, CACHE_TTL, serialized);
    console.log(`[Cache SET] Website extraction cached for ${url} (TTL: 24h)`);
  } catch (error) {
    console.error(`[Cache ERROR] Failed to cache extraction: ${error}`);
    // Fail gracefully - don't throw error if caching fails
  }
}

/**
 * Clear cache for specific URL
 */
export async function clearExtractionCache(url: string): Promise<void> {
  try {
    const redisClient = await getRedis();

    // If Redis is not available, skip
    if (!redisClient) {
      return;
    }

    const cacheKey = generateCacheKey(url);
    await redisClient.del(cacheKey);
    console.log(`[Cache DEL] Cleared cache for ${url}`);
  } catch (error) {
    console.error(`[Cache ERROR] Failed to clear cache: ${error}`);
  }
}
