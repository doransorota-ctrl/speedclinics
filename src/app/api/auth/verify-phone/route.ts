import { createHmac, timingSafeEqual } from "crypto";
import { twilioClient } from "@/lib/twilio/client";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isRateLimited, getClientIp } from "@/lib/rate-limit";

const HMAC_SECRET = process.env.TWILIO_AUTH_TOKEN || "fallback-dev-secret";

function hashOtp(code: string): string {
  return createHmac("sha256", HMAC_SECRET).update(code).digest("hex");
}

const TWILIO_MESSAGING_SERVICE_SID = process.env.TWILIO_MESSAGING_SERVICE_SID || "";
const TWILIO_FROM = process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_VOICE_NUMBER || "";
const E164_REGEX = /^\+[1-9]\d{7,14}$/;

// In-memory stores — sufficient for single-instance Railway deploy
const otpStore = new Map<string, { code: string; expires: number }>();
const attemptStore = new Map<string, { count: number; lockedUntil: number }>();

function generateCode(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return (array[0] % 1_000_000).toString().padStart(6, "0");
}

/**
 * POST /api/auth/verify-phone
 * Body: { phone, action: "send" } → sends SMS with 6-digit code
 * Body: { phone, code, action: "verify" } → checks the code
 *
 * Requires authenticated Supabase session.
 */
export async function POST(request: Request) {
  try {
    // Auth gate — only logged-in users can verify phone
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { phone, code, action } = await request.json();

    if (!phone || typeof phone !== "string") {
      return Response.json({ error: "Phone number required" }, { status: 400 });
    }

    // Normalize to E.164
    let normalized = phone.replace(/[\s\-().]/g, "");
    if (normalized.startsWith("0")) normalized = "+31" + normalized.slice(1);
    if (!normalized.startsWith("+")) normalized = "+" + normalized;

    if (!E164_REGEX.test(normalized)) {
      return Response.json({ error: "Ongeldig telefoonnummer" }, { status: 400 });
    }

    const ip = getClientIp(request);

    if (action === "send") {
      // Rate limit: 3 per phone per 10 min, 5 per IP per 10 min
      if (isRateLimited(`otp-send:phone:${normalized}`, 5, 10 * 60_000)) {
        return Response.json({ error: "Te veel verzoeken. Probeer het later opnieuw." }, { status: 429 });
      }
      if (isRateLimited(`otp-send:ip:${ip}`, 5, 10 * 60_000)) {
        return Response.json({ error: "Te veel verzoeken. Probeer het later opnieuw." }, { status: 429 });
      }

      const otp = generateCode();
      otpStore.set(normalized, { code: hashOtp(otp), expires: Date.now() + 5 * 60 * 1000 });
      attemptStore.delete(normalized); // Reset attempts on new code

      await twilioClient.messages.create({
        to: normalized,
        ...(TWILIO_MESSAGING_SERVICE_SID
          ? { messagingServiceSid: TWILIO_MESSAGING_SERVICE_SID }
          : { from: TWILIO_FROM }),
        body: `Je Speed Leads verificatiecode is ${otp}`,
      });

      return Response.json({ ok: true, phone: normalized });
    }

    if (action === "verify") {
      if (!code || typeof code !== "string") {
        return Response.json({ error: "Code required" }, { status: 400 });
      }

      // Check lockout
      const attempts = attemptStore.get(normalized) ?? { count: 0, lockedUntil: 0 };
      if (attempts.lockedUntil > Date.now()) {
        return Response.json({ error: "Te veel pogingen. Vraag een nieuwe code aan." }, { status: 429 });
      }

      const stored = otpStore.get(normalized);
      if (!stored) {
        return Response.json({ error: "Geen code verstuurd voor dit nummer" }, { status: 400 });
      }
      if (stored.expires < Date.now()) {
        otpStore.delete(normalized);
        return Response.json({ error: "Code verlopen" }, { status: 400 });
      }

      let codeMatch = false;
      try {
        codeMatch = timingSafeEqual(Buffer.from(hashOtp(code)), Buffer.from(stored.code));
      } catch {
        // Buffer length mismatch — code is invalid
      }
      if (!codeMatch) {
        const newCount = attempts.count + 1;
        if (newCount >= 5) {
          attemptStore.set(normalized, { count: newCount, lockedUntil: Date.now() + 15 * 60 * 1000 });
          otpStore.delete(normalized);
          return Response.json({ error: "Te veel pogingen. Vraag een nieuwe code aan." }, { status: 429 });
        }
        attemptStore.set(normalized, { count: newCount, lockedUntil: 0 });
        return Response.json({ error: "Ongeldige code" }, { status: 400 });
      }

      // Valid — clean up
      otpStore.delete(normalized);
      attemptStore.delete(normalized);

      // Store verified phone in user metadata (survives deploys, persistent)
      await supabase.auth.updateUser({
        data: { verified_phone: normalized, phone_verified_at: new Date().toISOString() }
      });

      return Response.json({ ok: true, verified: true, phone: normalized });
    }

    return Response.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("[VerifyPhone] Error:", error);
    return Response.json({ error: "Failed to process request" }, { status: 500 });
  }
}
