function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

interface TrialReminderData {
  firstName: string;
  daysLeft: number;
  leadsCount: number;
  billingUrl: string;
}

export function trialReminderHtml(data: TrialReminderData): string {
  const firstName = esc(data.firstName);
  const billingUrl = encodeURI(data.billingUrl);

  return `
<!DOCTYPE html>
<html lang="nl">
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1e293b;">
  <div style="text-align: center; margin-bottom: 32px;">
    <div style="display: inline-block; background: #25a867; color: white; font-weight: bold; padding: 8px 16px; border-radius: 8px; font-size: 18px;">
      ⚡ Clŷniq
    </div>
  </div>

  <h1 style="font-size: 24px; font-weight: 700; margin-bottom: 8px;">
    Je proefperiode eindigt over ${data.daysLeft} dagen
  </h1>

  <p style="font-size: 16px; color: #475569; line-height: 1.6;">
    Hoi ${firstName}, je proefperiode loopt bijna af.
    ${data.leadsCount > 0
      ? `Clŷniq heeft <strong>${data.leadsCount} leads</strong> voor je opgevangen.`
      : "Zodra je doorschakelen instelt, vangt Clŷniq je gemiste oproepen op."
    }
  </p>

  <p style="font-size: 16px; color: #475569; line-height: 1.6;">
    Wil je doorgaan? Voeg een betaalmethode toe en je abonnement gaat automatisch door.
  </p>

  <div style="text-align: center; margin: 32px 0;">
    <a href="${billingUrl}" style="display: inline-block; background: #25a867; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
      Bekijk abonnement
    </a>
  </div>

  <p style="font-size: 14px; color: #94a3b8;">
    Wil je stoppen? Je hoeft niks te doen — zonder betaalmethode stopt het automatisch.
  </p>
</body>
</html>`;
}
