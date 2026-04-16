import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/client";
import { isRateLimited, getClientIp } from "@/lib/rate-limit";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "info@clyniq.nl";

export async function POST(request: Request) {
  // Rate limit: 3 contact form submissions per hour
  const ip = getClientIp(request);
  if (isRateLimited(`contact:${ip}`, 3, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Te veel verzoeken. Probeer het later opnieuw." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { name, email, phone, message } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Naam, e-mail en bericht zijn verplicht." },
        { status: 400 }
      );
    }

    // Send email to admin
    await sendEmail({
      to: ADMIN_EMAIL,
      subject: `Contactformulier: ${name}`,
      html: `
        <h2>Nieuw bericht via contactformulier</h2>
        <p><strong>Naam:</strong> ${escapeHtml(name)}</p>
        <p><strong>E-mail:</strong> ${escapeHtml(email)}</p>
        <p><strong>Telefoon:</strong> ${escapeHtml(phone || "Niet opgegeven")}</p>
        <p><strong>Bericht:</strong></p>
        <p>${escapeHtml(message)}</p>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Contact] Failed to send email:", err);
    return NextResponse.json(
      { error: "Er ging iets mis. Probeer het later opnieuw." },
      { status: 500 }
    );
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
