import { sendWhatsApp } from "../twilio/whatsapp";
import { sendEmail } from "../email/client";
import { leadNotificationHtml } from "../email/templates/lead-notification";
import { isRateLimited } from "../rate-limit";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

interface LeadData {
  id: string;
  customerName: string;
  problem: string;
  address?: string;
  urgency?: string;
}

interface OwnerData {
  name: string;
  phone: string;
  email: string;
}

/** Notify the business owner about a new lead via WhatsApp + email. */
export async function notifyOwnerNewLead(owner: OwnerData, lead: LeadData) {
  const leadUrl = `${APP_URL}/portal/leads/${lead.id}`;

  // WhatsApp notification (primary)
  const whatsappMessage = [
    `🔔 Nieuwe patiënt via Clŷniq`,
    ``,
    `Klant: ${lead.customerName}`,
    `Probleem: ${lead.problem}`,
    lead.address ? `Adres: ${lead.address}` : null,
    lead.urgency ? `Urgentie: ${lead.urgency}` : null,
    ``,
    `Bekijk: ${leadUrl}`,
  ]
    .filter(Boolean)
    .join("\n");

  await sendWhatsApp(owner.phone, whatsappMessage).catch((err) => {
    console.error("[Notification] WhatsApp failed:", JSON.stringify({
      type: "whatsapp_notification",
      leadId: lead.id,
      ownerPhone: owner.phone,
      error: err instanceof Error ? err.message : String(err),
      timestamp: new Date().toISOString(),
    }));
  });

  // Email notification (secondary)
  await sendEmail({
    to: owner.email,
    subject: `Nieuwe lead: ${lead.customerName} — ${lead.problem}`,
    html: leadNotificationHtml({
      ownerName: owner.name,
      customerName: lead.customerName,
      problem: lead.problem,
      address: lead.address,
      urgency: lead.urgency,
      leadUrl,
    }),
  }).catch((err) => {
    console.error("[Notification] Email failed:", JSON.stringify({
      type: "email_notification",
      leadId: lead.id,
      ownerEmail: owner.email,
      error: err instanceof Error ? err.message : String(err),
      timestamp: new Date().toISOString(),
    }));
  });
}

/** Notify the owner when a customer messages while in manual mode. */
export async function notifyOwnerManualMessage(
  ownerPhone: string,
  customerName: string,
  messagePreview: string,
  leadId: string
) {
  const msg = [
    `Nieuw bericht van ${customerName}:`,
    `"${messagePreview.slice(0, 100)}"`,
    ``,
    `Bekijk: ${APP_URL}/portal/leads/${leadId}`,
  ].join("\n");

  await sendWhatsApp(ownerPhone, msg).catch((err) => {
    console.error("[Notification] Manual message WhatsApp failed:", err);
  });
}

/**
 * Notify owner that their Google Calendar integration is broken.
 * Rate limited to 1 alert per 24h per business to prevent spam.
 */
export async function notifyOwnerCalendarBroken(businessId: string, ownerPhone: string, businessName: string) {
  if (isRateLimited(`calendar-broken:${businessId}`, 1, 24 * 60 * 60 * 1000)) {
    return;
  }
  const msg = [
    `⚠️ Clŷniq — Google Calendar koppeling verbroken`,
    ``,
    `De koppeling met uw Google Calendar werkt niet meer. Nieuwe afspraken worden nu niet automatisch in uw agenda gezet.`,
    ``,
    `Log in op ${APP_URL}/portal/settings en koppel uw Google Calendar opnieuw.`,
  ].join("\n");

  await sendWhatsApp(ownerPhone, msg).catch((err) => {
    console.error("[Notification] Calendar broken alert failed:", err);
  });
  console.warn(`[Notification] Calendar broken alert sent to ${businessName}`);
}

/** Notify the owner about a booked appointment. */
export async function notifyOwnerAppointment(
  owner: OwnerData,
  lead: LeadData,
  appointment: { date: string; time: string }
) {
  const msg = [
    `📅 Consult geboekt via Clŷniq`,
    ``,
    `Klant: ${lead.customerName}`,
    `Probleem: ${lead.problem}`,
    lead.address ? `Adres: ${lead.address}` : null,
    `Wanneer: ${appointment.date} om ${appointment.time}`,
    ``,
    `Bekijk: ${APP_URL}/portal/leads/${lead.id}`,
  ]
    .filter(Boolean)
    .join("\n");

  await sendWhatsApp(owner.phone, msg).catch((err) => {
    console.error("[Notification] WhatsApp failed:", err);
  });
}
