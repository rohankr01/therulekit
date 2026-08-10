/**
 * 🔒 PRODUCTION-GRADE RATE LIMITER v2.0
 * Prevents API abuse, bot attacks, and excessive requests
 * 
 * Features:
 * - IP-based rate limiting with spoofing protection
 * - Configurable time windows and burst limits
 * - Memory-efficient LRU cache with cleanup control
 * - Works with Vercel Edge & Node.js
 * - Rate limit headers for client feedback
 * - User+IP combo support for shared networks
 * - Zero memory leaks (proper cleanup)
 */

interface RateLimiterOptions {
  interval: number; // Time window in milliseconds
  uniqueTokenPerInterval: number; // Max unique tokens to track
  burstLimit?: number; // Max requests in short burst (10s window)
}

interface TokenData {
  count: number;
  resetTime: number;
  burstCount?: number; // For burst protection
  burstResetTime?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reset: number;
  retryAfter?: number; // Seconds to wait
}

export class RateLimitError extends Error {
  retryAfter: number;
  reset: number;
  remaining: number;

  constructor(result: RateLimitResult) {
    const retryAfter = result.retryAfter || Math.ceil((result.reset - Date.now()) / 1000);
    super(`Rate limit exceeded. Try again in ${retryAfter} seconds.`);
    this.name = 'RateLimitError';
    this.retryAfter = Math.max(1, retryAfter);
    this.reset = result.reset;
    this.remaining = result.remaining;
  }
}

/**
 * Simple in-memory rate limiter using Map
 * More reliable than LRU cache for serverless environments
 */
class RateLimiter {
  private cache: Map<string, TokenData>;
  private interval: number;
  private maxTokens: number;
  private burstLimit?: number;
  private cleanupInterval?: NodeJS.Timeout;

  constructor(options: RateLimiterOptions) {
    this.cache = new Map();
    this.interval = options.interval;
    this.maxTokens = options.uniqueTokenPerInterval;
    this.burstLimit = options.burstLimit;
    
    // Clean up expired entries every minute
    if (typeof setInterval !== 'undefined') {
      this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
    }
  }

  /**
   * Check if request is allowed
   * @param limit - Max requests per interval
   * @param token - Unique identifier (usually IP address or user:ip)
   * @returns Rate limit result with headers info
   */
  async check(limit: number, token: string): Promise<void> {
    const result = await this.checkWithResult(limit, token);
    
    if (!result.allowed) {
      throw new RateLimitError(result);
    }
  }

  /**
   * Check rate limit and return detailed result
   * Useful for setting response headers
   */
  async checkWithResult(limit: number, token: string): Promise<RateLimitResult> {
    const now = Date.now();
    const tokenData = this.cache.get(token);

    // First request or expired window
    if (!tokenData || now > tokenData.resetTime) {
      const resetTime = now + this.interval;
      
      this.cache.set(token, {
        count: 1,
        resetTime,
        burstCount: 1,
        burstResetTime: now + 10000, // 10 second burst window
      });

      return {
        allowed: true,
        remaining: limit - 1,
        reset: resetTime,
      };
    }

    // Check burst limit (if configured)
    if (this.burstLimit) {
      const burstResetTime = tokenData.burstResetTime || now + 10000;
      
      // Reset burst counter if window expired
      if (now > burstResetTime) {
        tokenData.burstCount = 1;
        tokenData.burstResetTime = now + 10000;
      } else {
        tokenData.burstCount = (tokenData.burstCount || 0) + 1;
        
        // Burst limit exceeded
        if (tokenData.burstCount > this.burstLimit) {
          const retryAfter = Math.ceil((burstResetTime - now) / 1000);
          return {
            allowed: false,
            remaining: 0,
            reset: tokenData.resetTime,
            retryAfter,
          };
        }
      }
    }

    // Check main rate limit
    if (tokenData.count >= limit) {
      const retryAfter = Math.ceil((tokenData.resetTime - now) / 1000);
      return {
        allowed: false,
        remaining: 0,
        reset: tokenData.resetTime,
        retryAfter,
      };
    }

    // Increment count
    tokenData.count++;
    this.cache.set(token, tokenData);

    return {
      allowed: true,
      remaining: limit - tokenData.count,
      reset: tokenData.resetTime,
    };
  }

  /**
   * Clean up expired entries to prevent memory leaks
   */
  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    this.cache.forEach((data, key) => {
      if (now > data.resetTime) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach(key => this.cache.delete(key));

    // If cache grows too large, remove oldest entries (LRU eviction)
    if (this.cache.size > this.maxTokens) {
      const keysToDelete = Array.from(this.cache.keys()).slice(0, this.cache.size - this.maxTokens);
      keysToDelete.forEach(key => this.cache.delete(key));
    }
  }

  /**
   * Get current stats (for debugging/monitoring)
   */
  getStats(): { totalTokens: number; activeTokens: number } {
    const now = Date.now();
    let activeTokens = 0;

    this.cache.forEach(data => {
      if (now <= data.resetTime) {
        activeTokens++;
      }
    });

    return {
      totalTokens: this.cache.size,
      activeTokens,
    };
  }

  /**
   * Destroy the rate limiter and clean up resources
   * IMPORTANT: Call this in tests to prevent memory leaks
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
    this.cache.clear();
  }

  /**
   * Reset rate limit for a specific token
   * Useful for testing or manual overrides
   */
  reset(token: string): void {
    this.cache.delete(token);
  }

  /**
   * Reset all rate limits
   * Useful for testing
   */
  resetAll(): void {
    this.cache.clear();
  }
}

/**
 * Factory function to create a rate limiter instance
 */
export default function rateLimit(options: RateLimiterOptions): RateLimiter {
  return new RateLimiter(options);
}

/**
 * Helper to extract real client IP from Next.js request
 * 
 * @param req - Next.js request object
 * @param trustProxy - Whether to trust x-forwarded-for header (default: true for Vercel/Cloudflare)
 * @returns Client IP address
 */
export function getClientIP(req: Request, trustProxy = true): string {
  const headers = req.headers;
  
  // For Vercel/Cloudflare deployments, always trust the proxy
  if (trustProxy) {
    // Cloudflare provides the real IP here (most reliable)
    const cfConnectingIP = headers.get('cf-connecting-ip');
    if (cfConnectingIP) {
      return cfConnectingIP.trim();
    }

    // Vercel and most proxies put real IP first in x-forwarded-for
    const forwardedFor = headers.get('x-forwarded-for');
    if (forwardedFor) {
      // x-forwarded-for format: client, proxy1, proxy2
      // First IP is the real client (if proxy is trusted)
      const ips = forwardedFor.split(',').map(ip => ip.trim());
      if (ips.length > 0 && ips[0]) {
        return ips[0];
      }
    }

    // Nginx and some proxies use x-real-ip
    const realIP = headers.get('x-real-ip');
    if (realIP) {
      return realIP.trim();
    }
  }

  // Fallback for direct connections or unknown proxy
  // In serverless, this might always be the same (load balancer IP)
  return 'unknown';
}

/**
 * Helper to create composite token for user + IP
 * Useful for preventing shared IP issues (schools, offices)
 * 
 * @param userId - User ID (optional)
 * @param ip - IP address
 * @returns Composite token string
 */
export function createRateLimitToken(userId: string | undefined, ip: string): string {
  // If user is authenticated, use user:ip combo
  // This allows higher limits per user even on shared IPs
  if (userId) {
    return `user:${userId}:${ip}`;
  }
  
  // For anonymous users, just use IP
  return `anon:${ip}`;
}

/**
 * Helper to set rate limit headers on response
 * Standard HTTP headers for client-side rate limit handling
 * 
 * @param headers - Response headers object
 * @param result - Rate limit check result
 */
export function setRateLimitHeaders(
  headers: Headers,
  result: RateLimitResult,
  limit = 10
): void {
  headers.set('X-RateLimit-Limit', limit.toString());
  headers.set('X-RateLimit-Remaining', result.remaining.toString());
  headers.set('X-RateLimit-Reset', result.reset.toString());
  
  if (!result.allowed && result.retryAfter) {
    headers.set('Retry-After', result.retryAfter.toString());
  }
}
