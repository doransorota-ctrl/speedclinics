import { createServiceRoleClient } from "@/lib/supabase/server";
import { verifyTwilioWebhook, formDataToParams } from "@/lib/twilio/verify-webhook";

function twimlOk() {
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
    { headers: { "Content-Type": "text/xml" } }
  );
}

/** Twilio message status callback — updates message delivery status. */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    // Verify request is from Twilio
    const params = formDataToParams(formData);
    if (!verifyTwilioWebhook(request, params, "/api/twilio/status")) {
      return new Response("Forbidden", { status: 403 });
    }

    const messageSid = formData.get("MessageSid") as string;
    const status = formData.get("MessageStatus") as string;

    if (messageSid && status) {
      const supabase = createServiceRoleClient();

      await supabase
        .from("messages")
        .update({ twilio_status: status })
        .eq("twilio_sid", messageSid);
    }

    return twimlOk();
  } catch (error) {
    console.error("[Twilio Status] Error:", error);
    return twimlOk();
  }
}
