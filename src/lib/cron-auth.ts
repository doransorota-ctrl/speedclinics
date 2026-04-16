import { timingSafeEqual } from "crypto";

const CRON_SECRET = process.env.CRON_SECRET;

/** Verify cron secret using timing-safe comparison to prevent timing attacks. */
export function isValidCronSecret(authHeader: string | null): boolean {
  if (!CRON_SECRET || !authHeader) return false;
  const expected = Buffer.from(`Bearer ${CRON_SECRET}`);
  const actual = Buffer.from(authHeader);
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}
