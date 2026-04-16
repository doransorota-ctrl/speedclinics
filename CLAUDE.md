# Speed Clinics

Speed Clinics is een AI-receptie voor cosmetische klinieken in Nederland. Wanneer een patiënt buiten openingstijden contact opneemt, beantwoordt het systeem automatisch vragen over behandelingen via WhatsApp, adviseert de patiënt en plant consulten in. Op maat ingericht per kliniek.

## Tech Stack

- **Framework:** Next.js 14 (App Router), React 18, TypeScript
- **Database:** Supabase (PostgreSQL + Auth + RLS)
- **AI:** OpenAI GPT-5.4-mini (Responses API, `reasoning.effort: "low"`)
- **WhatsApp/Voice:** Twilio (WhatsApp Business API, Programmable Voice)
- **Calendar:** Google Calendar API (OAuth2, FreeBusy)
- **Payments:** Stripe (subscriptions, checkout)
- **Email:** Resend
- **Hosting:** Railway (TZ=Europe/Amsterdam)
- **CSS:** Tailwind CSS 3.4

## Lokaal draaien

```bash
npm install
cp .env.example .env.local  # Vul minimaal Supabase + Twilio + OpenAI in
npm run dev                  # http://localhost:3000
```

## Architectuur

```
Klant belt → Twilio voice webhook (/api/twilio/voice/incoming)
  → Voicemail + WhatsApp greeting naar beller
  → Lead aangemaakt in Supabase

Klant reageert via WhatsApp → Twilio webhook (/api/twilio/whatsapp/incoming)
  → AI genereert response (src/lib/ai/conversation.ts)
  → Typing delay (1.5-4s) → WhatsApp response
  → Bij bevestiging: Google Calendar event aangemaakt
  → Owner krijgt WhatsApp notificatie

Portal: /portal/* (Supabase auth)
  → Dashboard, Leads, Agenda, Settings, Outreach (sales mode)
```

## Belangrijke directories

| Directory | Wat |
|-----------|-----|
| `src/lib/ai/` | AI prompts, conversation engine, OpenAI client |
| `src/lib/twilio/` | WhatsApp send, voice TwiML, webhook verification, number pool |
| `src/lib/calendar/` | Google Calendar OAuth, availability, slot-matcher |
| `src/app/api/twilio/` | Incoming webhooks (voice + WhatsApp) — core business logic |
| `src/app/portal/` | Dashboard pages (leads, agenda, settings, outreach) |
| `src/content/nl.ts` | Alle Nederlandse copy (landing page, signup, dashboard) |
| `src/lib/types.ts` | Shared TypeScript interfaces (Business, Lead, Message) |
| `supabase/schema.sql` | Database schema |
| `.env.example` | Alle environment variables (72+) |

## Conventies

### Code
- Gebruik `formatDutchPhone()` (`src/lib/phone.ts`) voor alle telefoonnummers
- Alle API routes: authenticatie via `createServerSupabaseClient()` of `createServiceRoleClient()`
- WhatsApp berichten: altijd `statusCallback` meegeven voor delivery tracking
- AI responses: altijd typing delay (1.5-4s gebaseerd op reply lengte) voor menselijk gevoel

### AI Prompts (`src/lib/ai/prompts.ts`)
- Toon: casual, kort, als een vakman die appt. Geen callcenter-taal.
- Max 2 zinnen per bericht
- NOOIT meerdere vragen in één bericht
- NOOIT herhalen wat de klant net zei
- Verboden woorden met alternatieven: "vervelend"→"balen", "begrijp ik"→"snap ik", "dankjewel"→"top"
- `appointmentStart/End` ALLEEN na expliciete bevestiging door klant
- Altijd `###INFO###` JSON na elk bericht

### Nederlandse UI
- Altijd u/uw in UI-copy (formeel, premium kliniek-toon)
- Prijzen altijd excl. BTW
- Data format: dag + tijd ("maandag om 14:00"), nooit ISO timestamps

### WhatsApp
- Marketing templates: €0.15/bericht (Meta fee)
- Service messages (klant reageert eerst): gratis binnen 24u
- Auto-reply detectie in code: skip AI processing
- Media berichten (voice notes, foto's): vraag om tekst

## Niet doen

- NOOIT `gathered_info` wissen bij state === "ended" (klant kan herstarten)
- NOOIT aanhalingstekens in AI responses
- NOOIT ISO timestamps tonen aan klanten
- NOOIT `.env`, credentials, of API keys committen
- NOOIT `git push --force` of `git reset --hard`
- NOOIT features bouwen die niet direct nodig zijn voor verkoop
- NOOIT CSV bestanden committen (bevatten telefoonnummers)

## Conversation State Machine

```
greeting → qualifying → scheduling → confirmed → (manual mode)
                                   ↘ ended (wrong trade, customer decline)
```

States: `greeting` | `qualifying` | `scheduling` | `confirmed` | `ended`
Conversation modes: `ai` (automatisch) | `manual` (owner neemt over)

## Database

Zie `supabase/schema.sql` voor het volledige schema. Belangrijkste tabellen:
- `businesses` — klant-accounts met instellingen
- `leads` — alle leads met status, contact info, afspraak details
- `messages` — chat historie per lead
- `ai_contexts` — conversation state + gathered info per lead
- `phone_number_pool` — Twilio nummer toewijzing
- `calendar_tokens` — Google Calendar OAuth tokens

## Environment Variables

Zie `.env.example` voor alle variabelen. Minimaal nodig voor development:
- `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` + `SUPABASE_SERVICE_ROLE_KEY`
- `TWILIO_ACCOUNT_SID` + `TWILIO_AUTH_TOKEN` + `TWILIO_WHATSAPP_NUMBER`
- `OPENAI_API_KEY`
- `NEXT_PUBLIC_APP_URL`

## Cron Jobs

| Route | Interval | Functie |
|-------|----------|---------|
| `/api/cron/followup` | Elk uur | Follow-up naar leads zonder reactie (4-24u oud, 09:00-20:00) |
| `/api/cron/cleanup` | Dagelijks | Archiveer stale leads, verwijder oude data (30+ dagen) |

## Sales Mode vs Service Mode

Het systeem heeft twee modes (`business.prompt_mode`):
- **service** — voor eindklanten van vakmensen (gemiste oproepen opvangen)
- **sales** — voor Doran's eigen outreach (Speed Leads verkopen aan vakmensen)

Sales mode heeft extra features: outreach pagina, bulk WhatsApp, lead flagging, handmatige gesprekken.
