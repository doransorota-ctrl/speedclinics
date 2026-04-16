/**
 * Generate TwiML responses for incoming voice calls.
 * Uses Google Neural2-D (Dutch female) — most natural sounding.
 */

const VOICE = "Polly.Laura-Neural";

/** Play a short message and hang up. Used when the owner didn't answer. */
export function missedCallTwiml(businessName: string): string {
  // Phonetic spelling so Dutch TTS pronounces English names correctly
  const name = (businessName || "Wij").replace(/Speed Clinics/gi, "Spied Liedz");
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${VOICE}">${escapeXml(name)} is even niet bereikbaar. Je krijgt zo een WhatsApp-bericht.</Say>
  <Hangup/>
</Response>`;
}

/** TwiML for a forwarding verification test call. */
export function testCallTwiml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${VOICE}">Dit is een testoproep van Spied Liedz. Je doorschakeling werkt.</Say>
  <Hangup/>
</Response>`;
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
