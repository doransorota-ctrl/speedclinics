function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

interface WelcomeEmailData {
  firstName: string;
  businessName: string;
  forwardingNumber?: string;
  portalUrl: string;
}

export function welcomeEmailHtml(data: WelcomeEmailData): string {
  const firstName = esc(data.firstName);
  const businessName = esc(data.businessName);
  const forwardingNumber = data.forwardingNumber ? esc(data.forwardingNumber) : undefined;
  const portalUrl = encodeURI(data.portalUrl);

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
    Welkom, ${firstName}!
  </h1>

  <p style="font-size: 16px; color: #475569; line-height: 1.6;">
    Je account voor <strong>${businessName}</strong> is aangemaakt.
    Nog even instellen en je mist nooit meer een klant.
  </p>

  ${forwardingNumber ? `
  <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 24px 0;">
    <p style="margin: 0 0 4px 0; font-size: 14px; color: #475569;">Je Clŷniq nummer:</p>
    <p style="margin: 0; font-size: 20px; font-weight: 700; color: #166534;">${forwardingNumber}</p>
    <p style="margin: 8px 0 0 0; font-size: 13px; color: #64748b;">
      Stel doorschakelen bij geen gehoor in op je telefoon met dit nummer.
    </p>
  </div>
  ` : ""}

  <div style="text-align: center; margin: 32px 0;">
    <a href="${portalUrl}" style="display: inline-block; background: #25a867; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
      Ga naar mijn dashboard
    </a>
  </div>

  <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 32px;">
    <p style="font-size: 13px; color: #94a3b8; line-height: 1.5;">
      Hulp nodig met instellen? Antwoord op deze e-mail of stuur een WhatsApp.
      <br>Groet, het Clŷniq team
    </p>
  </div>
</body>
</html>`;
}

export function welcomeEmailText(data: WelcomeEmailData): string {
  return `Welkom bij Clŷniq, ${data.firstName}!

Je account voor ${data.businessName} is aangemaakt.

${data.forwardingNumber ? `Je Clŷniq nummer: ${data.forwardingNumber}\nStel doorschakelen bij geen gehoor in op je telefoon.\n` : ""}
Ga naar je dashboard: ${data.portalUrl}

Hulp nodig? Antwoord op deze e-mail.
— Clŷniq`;
}
