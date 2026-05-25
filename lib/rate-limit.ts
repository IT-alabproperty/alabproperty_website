import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import type { NextRequest } from 'next/server'

/**
 * Singleton Redis client. If KV_* env vars aren't set (e.g. local dev without
 * Upstash) we return null and the limiter no-ops — code paths keep working,
 * just without enforcement. This avoids forcing every contributor to set up
 * KV before they can `npm run dev`.
 */
const redis: Redis | null =
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
    ? new Redis({
        url: process.env.KV_REST_API_URL,
        token: process.env.KV_REST_API_TOKEN,
      })
    : null

if (!redis && process.env.NODE_ENV === 'production') {
  // Loud warning in prod logs — but don't crash, the site keeps serving.
  console.warn('[rate-limit] KV_REST_API_URL / KV_REST_API_TOKEN not set — rate limiting DISABLED')
}

/**
 * Builds a sliding-window limiter with a unique prefix so different routes
 * don't share buckets. `requests` per `window` (e.g. `'10 m'`, `'1 m'`).
 */
export function makeLimiter(
  name: string,
  requests: number,
  window: `${number} ${'s' | 'm' | 'h' | 'd'}`,
): Ratelimit | null {
  if (!redis) return null
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window),
    prefix: `rl:${name}`,
    analytics: true,
  })
}

/**
 * Extract a stable client identifier from the request. Behind Vercel/CDN
 * `x-forwarded-for` is the public IP. Falls back to `unknown` so the limiter
 * still works (one bucket for everyone with stripped headers).
 */
export function clientIp(req: NextRequest | Request): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) return xff.split(',')[0]?.trim() || 'unknown'
  return req.headers.get('x-real-ip') ?? 'unknown'
}

export interface RateLimitResult {
  ok: boolean
  /** Seconds until the next allowed request when ok === false. */
  retryAfter: number
  /** Remaining requests in the window when ok === true. */
  remaining: number
}

export async function rateLimit(
  limiter: Ratelimit | null,
  key: string,
): Promise<RateLimitResult> {
  // No Redis or limiter not configured → always pass. Safer fallback than 500.
  if (!limiter) return { ok: true, retryAfter: 0, remaining: Infinity }
  const result = await limiter.limit(key)
  return {
    ok: result.success,
    retryAfter: result.success ? 0 : Math.max(1, Math.ceil((result.reset - Date.now()) / 1000)),
    remaining: result.remaining,
  }
}
