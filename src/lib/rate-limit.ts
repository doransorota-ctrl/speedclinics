/**
 * Simple in-memory rate limiter using sliding window.
 * Suitable for single-instance deployments (Railway).
 */

const hits = new Map<string, number[]>();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  hits.forEach((timestamps, key) => {
    const valid = timestamps.filter((t) => now - t < 15 * 60_000);
    if (valid.length === 0) {
      hits.delete(key);
    } else {
      hits.set(key, valid);
    }
  });
}, 300_000);

/**
 * Check if a request should be rate-limited.
 * @param key - Unique identifier (e.g. IP address, phone number)
 * @param limit - Max requests allowed in the window
 * @param windowMs - Time window in milliseconds (default: 60s)
 * @returns true if the request should be BLOCKED
 */
export function isRateLimited(
  key: string,
  limit: number,
  windowMs = 60_000
): boolean {
  const now = Date.now();
  const timestamps = hits.get(key) ?? [];
  const valid = timestamps.filter((t) => now - t < windowMs);

  if (valid.length >= limit) {
    return true;
  }

  valid.push(now);
  hits.set(key, valid);
  return false;
}

/** Extract client IP from request headers. Prefers x-real-ip (set by proxy, not spoofable). */
export function getClientIp(request: Request): string {
  return (
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}
