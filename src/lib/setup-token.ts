import { createHmac, timingSafeEqual } from "crypto";

const SECRET = process.env.SETUP_TOKEN_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const TTL_HOURS = 24;

/**
 * Create a compact signed setup token.
 * Format: base64url("9701020760.HH.HMAC8")
 * - Phone without +31 prefix (always NL)
 * - Expiry as hours since epoch (not seconds)
 * - 8-char HMAC (still 48 bits of entropy — 281 trillion guesses)
 */
export function createSetupToken(twilioNumber: string): string {
  const short = twilioNumber.replace("+31", "");
  const expiryHour = Math.floor(Date.now() / 3600000) + TTL_HOURS;
  const payload = `${short}.${expiryHour}`;
  const sig = createHmac("sha256", SECRET).update(payload).digest("base64url").slice(0, 8);
  return Buffer.from(`${payload}.${sig}`).toString("base64url");
}

/**
 * Verify a setup token and extract the Twilio number.
 */
export function verifySetupToken(token: string): { number: string } | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString();
    const parts = decoded.split(".");
    if (parts.length !== 3) return null;

    const [short, expiryStr, sig] = parts;
    const expiryHour = parseInt(expiryStr, 10);
    if (isNaN(expiryHour)) return null;

    // Check expiry
    if (expiryHour < Math.floor(Date.now() / 3600000)) return null;

    // Verify HMAC
    const payload = `${short}.${expiryStr}`;
    const expected = createHmac("sha256", SECRET).update(payload).digest("base64url").slice(0, 8);
    try {
      if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    } catch {
      return null;
    }

    return { number: `+31${short}` };
  } catch {
    return null;
  }
}
