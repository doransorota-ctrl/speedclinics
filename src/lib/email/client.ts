import { Resend } from "resend";

let _resend: Resend | null = null;

function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY || "");
  }
  return _resend;
}

const EMAIL_FROM = process.env.EMAIL_FROM || "Speed Leads <noreply@speedleads.nl>";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  return `${local[0]}***@${domain}`;
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
  if (!process.env.RESEND_API_KEY) {
    console.warn(`[Email] RESEND_API_KEY not set — skipping email to ${maskEmail(to)}`);
    return null;
  }

  console.log(`[Email] Sending to ${maskEmail(to)}`);

  const result = await getResend().emails.send({
    from: EMAIL_FROM,
    to,
    subject,
    html,
    text,
  });

  if ("error" in result && result.error) {
    console.error("[Email] Resend API error:", result.error);
  } else {
    console.log("[Email] Sent successfully:", result);
  }

  return result;
}
