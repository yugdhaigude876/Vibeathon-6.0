/**
 * Simple in-memory rate limiter for API route protection.
 *
 * NOTE: This is an in-memory solution suitable for single-process deployments.
 * For serverless/multi-instance environments, use an external store like Redis/Upstash.
 */

interface RateLimitEntry {
  count: number
  resetTime: number
}

// Global map: key = "userId:endpoint", value = rate limit entry
const rateLimitStore = new Map<string, RateLimitEntry>()

// Periodically clean up expired entries to avoid memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of rateLimitStore.entries()) {
      if (now >= entry.resetTime) {
        rateLimitStore.delete(key)
      }
    }
  }, 60_000) // cleanup every minute
}

/**
 * Checks if the given user has exceeded the rate limit for an endpoint.
 *
 * @param userId       - The authenticated user's ID
 * @param endpoint     - A string identifier for the API endpoint (e.g. 'POST /api/orders')
 * @param maxRequests  - Maximum number of requests allowed within the window
 * @param windowMs     - Time window in milliseconds (default: 60 seconds)
 * @returns `true` if the request is allowed, `false` if rate-limited
 */
export function checkRateLimit(
  userId: string,
  endpoint: string,
  maxRequests: number,
  windowMs: number = 60_000
): boolean {
  const key = `${userId}:${endpoint}`
  const now = Date.now()
  const existing = rateLimitStore.get(key)

  if (!existing) {
    // First request from this user for this endpoint
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (now >= existing.resetTime) {
    // Window has passed — reset counter
    rateLimitStore.set(key, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (existing.count < maxRequests) {
    // Within window and under limit
    existing.count++
    return true
  }

  // Over limit within current window
  return false
}

/**
 * Returns an HTTP 429 Response when a rate limit is exceeded.
 */
export function rateLimitExceededResponse(retryAfterMs?: number) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (retryAfterMs) {
    headers['Retry-After'] = String(Math.ceil(retryAfterMs / 1000))
  }
  return new Response(
    JSON.stringify({ error: 'Too many requests. Please try again later.' }),
    { status: 429, headers }
  )
}
