import { createServiceRoleClient } from "@/lib/supabase/server";
import { setWhatsAppProfile } from "@/lib/twilio/whatsapp";
import { twilioClient } from "./client";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://speedleads.nl";
const SPEED_LEADS_DEFAULT_ABOUT = "Speed Leads — WhatsApp leadopvolging";

/**
 * Assign an available pool number to a business, or buy a new one if the pool is empty.
 * Skips "reserved" numbers (shared WhatsApp sender).
 * Returns the assigned phone number, or null if none available and buying failed.
 */
export async function assignOrBuyNumber(
  businessId: string,
  businessName: string
): Promise<string | null> {
  const supabase = createServiceRoleClient();

  // Check pool for released numbers (FIFO)
  const { data: poolRow, error } = await supabase
    .from("phone_number_pool")
    .select("id, twilio_number")
    .eq("status", "approved")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("[Pool] Error querying pool:", error);
  }

  const now = new Date().toISOString();

  if (poolRow) {
    // Reuse a released number from the pool
    await supabase
      .from("phone_number_pool")
      .update({ status: "assigned", assigned_business_id: businessId, assigned_at: now, updated_at: now })
      .eq("id", poolRow.id);

    await supabase
      .from("businesses")
      .update({ twilio_number: poolRow.twilio_number })
      .eq("id", businessId);

    // Ensure voice webhook is configured on the reused number
    try {
      const numbers = await twilioClient.incomingPhoneNumbers.list({ phoneNumber: poolRow.twilio_number, limit: 1 });
      if (numbers[0]) {
        await twilioClient.incomingPhoneNumbers(numbers[0].sid).update({
          voiceUrl: `${APP_URL}/api/twilio/voice/incoming`,
          voiceMethod: "POST",
        });
      }
    } catch (err) {
      console.error(`[Pool] Failed to update voice webhook for ${poolRow.twilio_number}:`, err);
    }

    console.log(`[Pool] Reused ${poolRow.twilio_number} for business ${businessId}`);
    return poolRow.twilio_number;
  }

  // Pool empty — buy a new number
  console.log("[Pool] No approved numbers available — buying from Twilio");
  try {
    const { buyTwilioNumber } = await import("@/lib/twilio/provision");
    const result = await buyTwilioNumber(businessName || "Speed Leads");
    if (!result) {
      console.error("[Pool] Could not buy a number from Twilio");
      return null;
    }

    await supabase.from("phone_number_pool").insert({
      twilio_number: result.phoneNumber,
      twilio_sid: result.sid,
      status: "assigned",
      assigned_business_id: businessId,
      assigned_at: now,
    });

    await supabase
      .from("businesses")
      .update({ twilio_number: result.phoneNumber })
      .eq("id", businessId);

    console.log(`[Pool] Bought and assigned ${result.phoneNumber} to business ${businessId}`);
    return result.phoneNumber;
  } catch (err) {
    console.error("[Pool] Buy failed:", err);
    return null;
  }
}

/**
 * Release a business's pool number back to the pool.
 * Clears businesses.twilio_number and resets the pool row to "approved".
 * Also resets the WhatsApp Business Profile to generic Speed Leads defaults.
 */
export async function releasePoolNumber(businessId: string): Promise<void> {
  const supabase = createServiceRoleClient();

  const { data: poolRow } = await supabase
    .from("phone_number_pool")
    .select("id, twilio_number, meta_phone_number_id")
    .eq("assigned_business_id", businessId)
    .eq("status", "assigned")
    .maybeSingle();

  if (!poolRow) {
    // Business may have had no pool number (e.g. signed up when pool was empty)
    console.log(`[Pool] No assigned pool number found for business ${businessId} — nothing to release`);
    return;
  }

  const now = new Date().toISOString();

  // Reset pool row to approved
  await supabase
    .from("phone_number_pool")
    .update({
      status: "approved",
      assigned_business_id: null,
      assigned_at: null,
      updated_at: now,
    })
    .eq("id", poolRow.id);

  // Clear twilio_number from business
  await supabase
    .from("businesses")
    .update({ twilio_number: null, whatsapp_personal: false })
    .eq("id", businessId);

  console.log(`[Pool] Released ${poolRow.twilio_number} from business ${businessId}`);

  // Reset WhatsApp profile to generic defaults
  if (poolRow.meta_phone_number_id) {
    await setWhatsAppProfile(poolRow.meta_phone_number_id, {
      about: SPEED_LEADS_DEFAULT_ABOUT,
    }).catch((err) => {
      console.error("[Pool] setWhatsAppProfile reset failed (non-fatal):", err);
    });
  }
}
