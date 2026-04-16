import { twilioClient } from "./client";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://clyniq.nl";
const VOICE_NUMBER = process.env.TWILIO_VOICE_NUMBER;
const ADDRESS_SID = process.env.TWILIO_ADDRESS_SID;

/**
 * Search for and buy a Dutch phone number from Twilio.
 * Configures voice and SMS webhook URLs on the purchased number.
 * Returns the phone number and SID, or null if no numbers available.
 */
export async function buyTwilioNumber(friendlyName: string): Promise<{
  phoneNumber: string;
  sid: string;
} | null> {
  // Search for available Dutch mobile numbers (NL has no "local" category in Twilio)
  const mobileNumbers = await twilioClient.availablePhoneNumbers("NL")
    .mobile.list({ limit: 1, voiceEnabled: true, smsEnabled: true });

  let numberToBuy = mobileNumbers[0]?.phoneNumber;

  // Fallback: try national numbers
  if (!numberToBuy) {
    const nationalNumbers = await twilioClient.availablePhoneNumbers("NL")
      .national.list({ limit: 1, voiceEnabled: true, smsEnabled: true });
    numberToBuy = nationalNumbers[0]?.phoneNumber;
  }

  if (!numberToBuy) {
    console.error("[Provision] No Dutch numbers available from Twilio");
    return null;
  }

  if (!ADDRESS_SID) {
    console.error("[Provision] TWILIO_ADDRESS_SID not configured — required for NL numbers");
    return null;
  }

  // Buy the number and configure webhooks
  const purchased = await twilioClient.incomingPhoneNumbers.create({
    phoneNumber: numberToBuy,
    addressSid: ADDRESS_SID,
    friendlyName: friendlyName.slice(0, 64),
    voiceUrl: `${APP_URL}/api/twilio/voice/incoming`,
    voiceMethod: "POST",
    smsUrl: `${APP_URL}/api/twilio/whatsapp/incoming`,
    smsMethod: "POST",
  });

  console.log(`[Provision] Bought ${purchased.phoneNumber} (${purchased.sid}) for "${friendlyName}"`);
  return { phoneNumber: purchased.phoneNumber, sid: purchased.sid };
}

/**
 * Initiate a test call to verify call forwarding is working.
 * Calls the user's personal number — if they don't answer,
 * the call should forward to the shared Clŷniq number.
 */
export async function initiateTestCall(userPhone: string, fromNumber?: string) {
  const caller = fromNumber || VOICE_NUMBER;
  if (!caller) {
    throw new Error("No from-number available for test call");
  }

  const call = await twilioClient.calls.create({
    from: caller,
    to: userPhone,
    url: `${APP_URL}/api/twilio/voice/test`,
    method: "POST",
    timeout: 35, // Ring long enough for carrier forwarding (usually 20-25 sec) to trigger
  });

  return call.sid;
}
