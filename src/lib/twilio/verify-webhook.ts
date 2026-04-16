import twilio from "twilio";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

/**
 * Verify that an incoming request is genuinely from Twilio
 * by checking the X-Twilio-Signature header.
 */
export function verifyTwilioWebhook(
  request: Request,
  params: Record<string, string>,
  pathname: string
): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) {
    console.error("[Twilio] Missing TWILIO_AUTH_TOKEN — cannot verify webhook");
    return false;
  }

  const signature = request.headers.get("x-twilio-signature") || "";
  const requestUrl = new URL(request.url);
  const url = `${APP_URL}${requestUrl.pathname}`;

  return twilio.validateRequest(authToken, signature, url, params);
}

/**
 * Parse form data from a Twilio webhook into a Record for verification.
 */
export function formDataToParams(formData: FormData): Record<string, string> {
  const params: Record<string, string> = {};
  formData.forEach((value, key) => {
    params[key] = value.toString();
  });
  return params;
}
