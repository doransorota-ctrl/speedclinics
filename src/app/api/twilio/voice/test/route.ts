import { createServerSupabaseClient } from "@/lib/supabase/server";
import { testCallTwiml } from "@/lib/twilio/voice";
import { initiateTestCall } from "@/lib/twilio/provision";
import { verifyTwilioWebhook, formDataToParams } from "@/lib/twilio/verify-webhook";

/**
 * POST /api/twilio/voice/test
 *
 * Two uses:
 * 1. Called by the frontend to initiate a test call (JSON body or no body)
 * 2. Called by Twilio as the TwiML URL when the test call connects
 */
export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") || "";

  // If Twilio is requesting TwiML (form-urlencoded), return the test message
  if (contentType.includes("application/x-www-form-urlencoded")) {
    const formData = await request.formData();
    const params = formDataToParams(formData);
    if (!verifyTwilioWebhook(request, params, "/api/twilio/voice/test")) {
      return new Response("Forbidden", { status: 403 });
    }
    return new Response(testCallTwiml(), {
      headers: { "Content-Type": "text/xml" },
    });
  }

  // Otherwise: frontend is initiating a test call
  try {
    const supabase = createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const { data: business } = await supabase
      .from("businesses")
      .select("phone, twilio_number")
      .eq("owner_id", user.id)
      .single();

    if (!business?.phone) {
      return Response.json({ error: "No phone number on file" }, { status: 400 });
    }

    // Call FROM the shared VOICE_NUMBER, not the business's own number.
    // If forwarding works, the call lands on business.twilio_number → triggers incoming route.
    const callSid = await initiateTestCall(business.phone);
    return Response.json({ ok: true, callSid });
  } catch (error) {
    console.error("[Voice/Test] Error:", error);
    return Response.json({ error: "Failed to initiate test call" }, { status: 500 });
  }
}
