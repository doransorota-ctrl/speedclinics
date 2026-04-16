import { twilioClient } from "./client";
import { formatDutchPhone } from "../phone";

const WHATSAPP_NUMBER = process.env.TWILIO_WHATSAPP_NUMBER;
const WHATSAPP_TEMPLATE_SID = process.env.TWILIO_WHATSAPP_TEMPLATE_SID;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://speedleads.nl";
const STATUS_CALLBACK = `${APP_URL}/api/twilio/status`;

/** Template SIDs from environment — each maps to a pre-approved WhatsApp template */
export const TEMPLATES = {
  MISSED_CALL_GREETING: process.env.TEMPLATE_MISSED_CALL_GREETING,
  APPOINTMENT_REMINDER: process.env.TEMPLATE_APPOINTMENT_REMINDER,
  OWNER_MISSED_CALL: process.env.TEMPLATE_OWNER_MISSED_CALL,
  OWNER_APPOINTMENT_BOOKED: process.env.TEMPLATE_OWNER_APPOINTMENT_BOOKED,
  OWNER_APPOINTMENT_CANCELLED: process.env.TEMPLATE_OWNER_APPOINTMENT_CANCELLED,
  OWNER_REMINDER: process.env.TEMPLATE_OWNER_REMINDER,
  CUSTOMER_CHOICE_MENU: process.env.TEMPLATE_CUSTOMER_CHOICE_MENU,
  OWNER_APPOINTMENT_RESCHEDULED: process.env.TEMPLATE_OWNER_APPOINTMENT_RESCHEDULED,
  REVIEW_REQUEST: process.env.TEMPLATE_REVIEW_REQUEST,
  SETUP_CHECKOUT: process.env.TEMPLATE_SETUP_CHECKOUT,
  SETUP_CALENDAR: process.env.TEMPLATE_SETUP_CALENDAR,
  SETUP_FORWARDING: process.env.TEMPLATE_SETUP_FORWARDING,
} as const;

/**
 * Send a freeform WhatsApp message.
 * Falls back to generic template if outside 24h window.
 * @param from Optional per-business WhatsApp number. Defaults to TWILIO_WHATSAPP_NUMBER.
 */
export async function sendWhatsApp(to: string, body: string, from?: string, mediaUrl?: string[]) {
  const fromNumber = from ?? WHATSAPP_NUMBER;
  if (!fromNumber) {
    console.warn("[Twilio] No WhatsApp from-number configured, skipping send");
    return null;
  }

  const formatted = formatDutchPhone(to);

  try {
    const message = await twilioClient.messages.create({
      from: `whatsapp:${fromNumber}`,
      to: `whatsapp:${formatted}`,
      body,
      statusCallback: STATUS_CALLBACK,
      ...(mediaUrl && mediaUrl.length > 0 ? { mediaUrl } : {}),
    });
    return message;
  } catch (err: unknown) {
    const errorCode = (err as { code?: number })?.code;
    // 63016 = freeform message outside 24h window
    if (errorCode === 63016 && WHATSAPP_TEMPLATE_SID) {
      console.log(`[Twilio] 24h window expired for ***${formatted.slice(-4)}, falling back to generic template`);
      return sendWhatsAppTemplate(to, undefined, from);
    }
    throw err;
  }
}

/**
 * Send a pre-approved WhatsApp template by SID with variables.
 * Use for business-initiated messages (outside 24h window).
 * @param from Optional per-business WhatsApp number. Defaults to TWILIO_WHATSAPP_NUMBER.
 */
export async function sendNamedTemplate(
  to: string,
  templateSid: string,
  variables: Record<string, string>,
  from?: string
) {
  const fromNumber = from ?? WHATSAPP_NUMBER;
  if (!fromNumber) {
    console.warn("[Twilio] No WhatsApp from-number configured, skipping template send");
    return null;
  }
  if (!templateSid) {
    console.warn("[Twilio] No template SID provided, skipping template send");
    return null;
  }

  const formatted = formatDutchPhone(to);

  const message = await twilioClient.messages.create({
    from: `whatsapp:${fromNumber}`,
    to: `whatsapp:${formatted}`,
    contentSid: templateSid,
    contentVariables: JSON.stringify(variables),
    statusCallback: STATUS_CALLBACK,
  });
  return message;
}

/** Send a generic pre-approved WhatsApp template (fallback for expired 24h window). */
export async function sendWhatsAppTemplate(
  to: string,
  variables?: Record<string, string>,
  from?: string
) {
  const fromNumber = from ?? WHATSAPP_NUMBER;
  if (!fromNumber || !WHATSAPP_TEMPLATE_SID) {
    console.warn("[Twilio] Template SID not configured, skipping template send");
    return null;
  }

  const formatted = formatDutchPhone(to);

  const message = await twilioClient.messages.create({
    from: `whatsapp:${fromNumber}`,
    to: `whatsapp:${formatted}`,
    contentSid: WHATSAPP_TEMPLATE_SID,
    ...(variables ? { contentVariables: JSON.stringify(variables) } : {}),
    statusCallback: STATUS_CALLBACK,
  });
  return message;
}

/** Send an SMS via Twilio. */
export async function sendSMS(from: string, to: string, body: string) {
  const message = await twilioClient.messages.create({
    from,
    to,
    body,
  });
  return message;
}

/**
 * Update the WhatsApp Business Profile for a given phone number.
 * Requires WHATSAPP_ACCESS_TOKEN (permanent Meta system user token) to be set.
 * Silently skips if the token is not configured.
 *
 * @param metaPhoneNumberId  The Meta Graph API phone number ID (stored in phone_number_pool.meta_phone_number_id)
 * @param profile.about      Short "about" / status text visible to customers
 * @param profile.profilePictureUrl  Optional public URL of the business logo
 */
export async function setWhatsAppProfile(
  metaPhoneNumberId: string,
  profile: { about: string; profilePictureHandle?: string }
): Promise<void> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!accessToken) {
    console.warn("[Meta] WHATSAPP_ACCESS_TOKEN not set — skipping profile update");
    return;
  }

  const body: Record<string, unknown> = { about: profile.about };
  if (profile.profilePictureHandle) {
    body.profile_picture_handle = profile.profilePictureHandle;
  }

  const res = await fetch(
    `https://graph.facebook.com/v18.0/${metaPhoneNumberId}/whatsapp_business_profile`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`[Meta] Profile update failed ${res.status}: ${text}`);
  }

  console.log(`[Meta] WhatsApp profile updated for phone_number_id=${metaPhoneNumberId}`);
}

/**
 * Upload image bytes directly to Meta's media API.
 * Returns the profile_picture_handle to pass to setWhatsAppProfile.
 * Returns null if WHATSAPP_ACCESS_TOKEN is not set or the upload fails.
 */
export async function uploadProfilePictureToMeta(
  metaPhoneNumberId: string,
  buffer: ArrayBuffer,
  contentType: string
): Promise<string | null> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!accessToken) {
    console.warn("[Meta] WHATSAPP_ACCESS_TOKEN not set — skipping picture upload");
    return null;
  }

  const formData = new FormData();
  formData.append("file", new Blob([buffer], { type: contentType }), "logo.jpg");
  formData.append("type", contentType);
  formData.append("messaging_product", "whatsapp");

  const uploadRes = await fetch(
    `https://graph.facebook.com/v18.0/${metaPhoneNumberId}/media`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: formData,
    }
  );

  if (!uploadRes.ok) {
    console.error("[Meta] Picture upload failed:", await uploadRes.text());
    return null;
  }
  const data = await uploadRes.json() as { h?: string };
  return data.h ?? null;
}
