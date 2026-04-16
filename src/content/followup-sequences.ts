/**
 * Clŷniq — Follow-up Sequences
 *
 * These are ready-to-implement message templates.
 * Replace {{tags}} with actual personalization data.
 *
 * Send via: WhatsApp (primary) or email (fallback)
 * Tool options: Twilio, Resend, Customer.io, or manual
 */

export const trialSequence = {
  // ─── Immediate welcome (send on signup) ─────────────────
  welcome: {
    delay: "immediate",
    channel: "whatsapp",
    nl: `Hoi {{name}}! Welkom bij Clŷniq. 🎉

Ik ben [jouw naam], en ik ga je helpen om nooit meer een klant mis te lopen.

Volgende stap: ik neem vandaag nog even contact met je op om alles in te stellen. Duurt max 10 minuten.

Heb je alvast vragen? Stuur ze hier!`,
    en: `Hi {{name}}! Welcome to Clŷniq.

I'm [your name], and I'm going to help you never miss a customer again.

Next step: I'll reach out today to get everything set up. Takes 10 minutes max.

Any questions? Just send them here!`,
  },

  // ─── Day 1: Activation reminder ─────────────────────────
  day1: {
    delay: "24h",
    channel: "whatsapp",
    nl: `Hoi {{name}}, hoe gaat het? Heb je al een gemiste oproep gehad?

Als je hulp nodig hebt met de setup, laat het me weten — ik regel het in 10 minuten voor je.

Het enige wat je hoeft te doen:
1. "Doorschakelen bij geen gehoor" aanzetten op je telefoon
2. Je beschikbaarheid doorgeven

Dan doet Clŷniq de rest.`,
    en: `Hi {{name}}, how's it going? Had any missed calls yet?

If you need help with setup, let me know — I'll sort it in 10 minutes.

All you need to do:
1. Turn on "forward on no answer" on your phone
2. Share your availability

Clŷniq handles the rest.`,
  },

  // ─── Day 3: Value reminder ──────────────────────────────
  day3: {
    delay: "72h",
    channel: "whatsapp",
    nl: `Hoi {{name}}, snelle vraag: wist je dat je deze week waarschijnlijk al een paar klanten bent misgelopen?

De gemiddelde vakman mist 62% van zijn oproepen. Elke gemiste oproep = een klant die je concurrent belt.

Is Clŷniq al actief bij je? Zo niet, laat het me weten — dan zetten we het vandaag nog aan.`,
    en: `Hi {{name}}, quick question: did you know you probably already missed a few customers this week?

The average tradesperson misses 62% of calls. Every missed call = a customer calling your competitor.

Is Clŷniq active yet? If not, let me know — we'll set it up today.`,
  },

  // ─── Day 7: Midpoint check-in ──────────────────────────
  day7: {
    delay: "7d",
    channel: "whatsapp",
    nl: `Hoi {{name}}, je bent nu een week bezig met Clŷniq.

Snelle check-in:
- Hoeveel leads heeft de AI voor je opgepakt?
- Zijn er afspraken ingepland?

Als het goed werkt, top. Als er iets beter kan, laat het me weten — ik pas het meteen aan.

Je hebt nog 7 dagen in je proefperiode.`,
    en: `Hi {{name}}, you've been using Clŷniq for a week now.

Quick check-in:
- How many leads has the AI picked up for you?
- Any appointments booked?

If it's working well, great. If anything could be better, let me know — I'll adjust it right away.

You have 7 days left in your trial.`,
  },

  // ─── Day 12: Urgency + results ─────────────────────────
  day12: {
    delay: "12d",
    channel: "whatsapp",
    nl: `Hoi {{name}}, je proefperiode loopt over 2 dagen af.

Wil je Clŷniq blijven gebruiken? Dan hoef je niks te doen — het loopt automatisch door.

Wil je stoppen? Stuur me even een berichtje. Geen gedoe.

Maar bedenk: elke dag zonder Clŷniq is een dag waarop je klanten misloopt die je concurrent wél oppakt.`,
    en: `Hi {{name}}, your trial ends in 2 days.

Want to keep using Clŷniq? You don't need to do anything — it continues automatically.

Want to stop? Just message me. No hassle.

But remember: every day without Clŷniq is a day where you miss customers your competitor picks up.`,
  },

  // ─── Day 14: Conversion ─────────────────────────────────
  day14: {
    delay: "14d",
    channel: "whatsapp",
    nl: `Hoi {{name}}, je proefperiode is vandaag afgelopen.

Hoe bevalt het? Ik zie dat Clŷniq {{leads_count}} leads voor je heeft opgepakt in de afgelopen 2 weken.

Doorgaan? Kies je plan op speedleads.nl/prijzen.

Vragen? Stuur me een berichtje — ik help je graag.`,
    en: `Hi {{name}}, your trial ended today.

How was it? I can see Clŷniq picked up {{leads_count}} leads for you over the past 2 weeks.

Want to continue? Choose your plan at speedleads.nl/pricing.

Questions? Message me — happy to help.`,
  },
} as const;

export const demoSequence = {
  // ─── Instant confirmation ───────────────────────────────
  confirmation: {
    delay: "immediate",
    channel: "whatsapp",
    nl: `Hoi {{name}}, bedankt voor je interesse in Clŷniq!

Ik neem zo snel mogelijk contact met je op om een demo in te plannen. Meestal binnen een paar uur.

In de tussentijd: heb je specifieke vragen? Stuur ze hier!`,
    en: `Hi {{name}}, thanks for your interest in Clŷniq!

I'll reach out as soon as possible to schedule a demo. Usually within a few hours.

In the meantime: any specific questions? Send them here!`,
  },

  // ─── 24h reminder ───────────────────────────────────────
  reminder24h: {
    delay: "24h",
    channel: "whatsapp",
    nl: `Hoi {{name}}, ik wilde even checken — heb je mijn bericht ontvangen over de demo?

Ik kan je in 15 minuten laten zien hoe Clŷniq werkt. Wanneer schikt het je?`,
    en: `Hi {{name}}, just checking in — did you get my message about the demo?

I can show you how Clŷniq works in 15 minutes. When works for you?`,
  },

  // ─── Missed demo follow-up ─────────────────────────────
  missedDemo: {
    delay: "1h after missed",
    channel: "whatsapp",
    nl: `Hoi {{name}}, ik zie dat we elkaar net gemist hebben.

Geen probleem! Wanneer schikt het je om opnieuw in te plannen? Ik ben flexibel.`,
    en: `Hi {{name}}, looks like we just missed each other.

No problem! When works for you to reschedule? I'm flexible.`,
  },
} as const;
