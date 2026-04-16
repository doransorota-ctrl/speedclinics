import { NextResponse } from "next/server";
import { demoBookingSchema } from "@/lib/validation";
import { sendEmail } from "@/lib/email/client";
import { isRateLimited, getClientIp } from "@/lib/rate-limit";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export async function POST(request: Request) {
  try {
    // Rate limit: 3 demo bookings per IP per minute
    const ip = getClientIp(request);
    if (isRateLimited(`demo:${ip}`, 3)) {
      return NextResponse.json(
        { error: "Te veel verzoeken. Probeer het later opnieuw." },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Honeypot check
    if (body.honeypot) {
      return NextResponse.json({ success: true });
    }

    // Validate
    const result = demoBookingSchema.safeParse(body);
    if (!result.success) {
      const firstError = result.error.errors[0];
      return NextResponse.json(
        { error: firstError.message },
        { status: 400 }
      );
    }

    const data = result.data;

    // ─── Send to webhook ──────────────────────────────────
    if (process.env.WEBHOOK_URL) {
      await fetch(process.env.WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(process.env.WEBHOOK_SECRET
            ? { Authorization: `Bearer ${process.env.WEBHOOK_SECRET}` }
            : {}),
        },
        body: JSON.stringify({
          type: "demo_booking",
          data,
          timestamp: new Date().toISOString(),
        }),
      }).catch((err) => {
        console.error("Webhook failed:", err);
      });
    }

    // ─── Notify admin via email ───────────────────────────
    if (ADMIN_EMAIL) {
      await sendEmail({
        to: ADMIN_EMAIL,
        subject: `Nieuwe demo aanvraag: ${data.name}`,
        html: `
          <h2>Nieuwe demo aanvraag</h2>
          <table style="border-collapse:collapse;">
            <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Naam</td><td>${esc(data.name)}</td></tr>
            <tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Telefoon</td><td><a href="tel:${esc(data.phone)}">${esc(data.phone)}</a></td></tr>
            ${data.trade ? `<tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Vak</td><td>${esc(data.trade)}</td></tr>` : ""}
            ${data.interest ? `<tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Bron</td><td>${esc(data.interest)}</td></tr>` : ""}
            ${data.calculator_loss_yearly ? `<tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Berekend verlies</td><td>&euro;${data.calculator_loss_yearly.toLocaleString("nl-NL")}/jaar (&euro;${(data.calculator_loss_monthly ?? 0).toLocaleString("nl-NL")}/maand)</td></tr>` : ""}
            ${data.calculator_missed_calls ? `<tr><td style="padding:4px 12px 4px 0;font-weight:bold;">Calculator invoer</td><td>${data.calculator_missed_calls} gemist/week, &euro;${data.calculator_hourly_rate}/uur, ${data.calculator_job_hours} uur/klus</td></tr>` : ""}
          </table>
          <p style="margin-top:16px;">App deze persoon om Speed Clinics in te stellen.</p>
        `,
      }).catch((err) => {
        console.error("[Notification] Admin email failed:", err);
      });
    }

    // ─── Notify admin via WhatsApp ──────────────────────
    const ADMIN_PHONE = process.env.ADMIN_PHONE;
    if (ADMIN_PHONE) {
      const { sendWhatsApp } = await import("@/lib/twilio/whatsapp");
      sendWhatsApp(ADMIN_PHONE, `Nieuwe aanvraag!\n\nNaam: ${data.name}\nTelefoon: ${data.phone}\n${data.trade ? `Vak: ${data.trade}\n` : ""}${data.calculator_loss_yearly ? `Berekend verlies: \u20AC${data.calculator_loss_yearly.toLocaleString("nl-NL")}/jaar\n` : ""}App deze persoon om Speed Clinics in te stellen.`).catch(() => {});
    }

    console.log("[Demo] New demo booking:", {
      name: data.name,
      trade: data.trade,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Demo booking error:", error);
    return NextResponse.json(
      { error: "Er ging iets mis. Probeer het opnieuw." },
      { status: 500 }
    );
  }
}
