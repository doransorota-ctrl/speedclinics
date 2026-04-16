function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

interface LeadNotificationData {
  ownerName: string;
  customerName: string;
  problem: string;
  address?: string;
  urgency?: string;
  leadUrl: string;
}

export function leadNotificationHtml(data: LeadNotificationData): string {
  const customerName = esc(data.customerName);
  const problem = esc(data.problem);
  const address = data.address ? esc(data.address) : undefined;
  const urgency = data.urgency ? esc(data.urgency) : undefined;
  const leadUrl = encodeURI(data.leadUrl);

  return `
<!DOCTYPE html>
<html lang="nl">
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; color: #1e293b;">
  <div style="text-align: center; margin-bottom: 24px;">
    <div style="display: inline-block; background: #C9998A; color: white; font-weight: bold; padding: 8px 16px; border-radius: 8px; font-size: 18px;">
      ⚡ Clŷniq
    </div>
  </div>

  <h1 style="font-size: 20px; font-weight: 700; margin-bottom: 16px;">
    Nieuwe lead: ${customerName}
  </h1>

  <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px;">
    <table style="width: 100%; font-size: 14px;">
      <tr>
        <td style="color: #64748b; padding: 4px 16px 4px 0; vertical-align: top;">Klant</td>
        <td style="font-weight: 600; padding: 4px 0;">${customerName}</td>
      </tr>
      <tr>
        <td style="color: #64748b; padding: 4px 16px 4px 0; vertical-align: top;">Probleem</td>
        <td style="font-weight: 600; padding: 4px 0;">${problem}</td>
      </tr>
      ${address ? `
      <tr>
        <td style="color: #64748b; padding: 4px 16px 4px 0; vertical-align: top;">Adres</td>
        <td style="font-weight: 600; padding: 4px 0;">${address}</td>
      </tr>` : ""}
      ${urgency ? `
      <tr>
        <td style="color: #64748b; padding: 4px 16px 4px 0; vertical-align: top;">Urgentie</td>
        <td style="font-weight: 600; padding: 4px 0;">${urgency}</td>
      </tr>` : ""}
    </table>
  </div>

  <div style="text-align: center; margin: 24px 0;">
    <a href="${leadUrl}" style="display: inline-block; background: #C9998A; color: white; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px;">
      Bekijk lead
    </a>
  </div>
</body>
</html>`;
}
