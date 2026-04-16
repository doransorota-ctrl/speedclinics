import { z } from "zod";

/** Trial signup form schema */
export const trialSignupSchema = z.object({
  firstName: z
    .string()
    .min(1, "Vul je voornaam in")
    .max(50, "Naam is te lang"),
  businessName: z
    .string()
    .min(1, "Vul je bedrijfsnaam in")
    .max(100, "Bedrijfsnaam is te lang"),
  email: z
    .string()
    .min(1, "Vul je e-mailadres in")
    .email("Vul een geldig e-mailadres in"),
  phone: z
    .string()
    .min(1, "Vul je telefoonnummer in")
    .regex(
      /^\+?[0-9\s\-()]{8,20}$/,
      "Vul een geldig telefoonnummer in"
    ),
  trade: z.string().min(1, "Selecteer je vakgebied"),
  employees: z.string().min(1, "Selecteer het aantal medewerkers"),
  hasWhatsApp: z.string().min(1, "Geef aan of je WhatsApp gebruikt"),
  hasWebsite: z.string().min(1, "Geef aan of je een website hebt"),
  // Address
  addressLine1: z
    .string()
    .min(1, "Vul je straat en huisnummer in")
    .max(200, "Adres is te lang"),
  postalCode: z
    .string()
    .min(1, "Vul je postcode in")
    .max(20, "Postcode is te lang"),
  city: z
    .string()
    .min(1, "Vul je plaats in")
    .max(100, "Plaatsnaam is te lang"),
  country: z.enum(["NL", "BE", "DE"]).default("NL"),
  monthlyLeads: z.string().optional(),
  vatNumber: z
    .string()
    .regex(/^(NL\d{9}B\d{2})?$/, "Vul een geldig BTW-nummer in (bijv. NL123456789B01)")
    .optional()
    .or(z.literal("")),
  plan: z.enum(["speed-leads", "website", "compleet"]).default("speed-leads"),
  consent: z
    .boolean()
    .refine((v) => v === true, "Je moet akkoord gaan met het privacybeleid"),
  // Hidden / auto-filled fields
  honeypot: z.string().max(0).optional(), // anti-spam
  utm_source: z.string().max(256).optional(),
  utm_medium: z.string().max(256).optional(),
  utm_campaign: z.string().max(256).optional(),
  utm_term: z.string().max(256).optional(),
  utm_content: z.string().max(256).optional(),
  gclid: z.string().max(512).optional(),
  fbclid: z.string().max(512).optional(),
  landing_page: z.string().max(1024).optional(),
  referrer: z.string().max(1024).optional(),
});

export type TrialSignupData = z.infer<typeof trialSignupSchema>;

/** Demo booking form schema */
export const demoBookingSchema = z.object({
  name: z.string().min(1, "Vul je naam in").max(100),
  email: z.string().email().optional().or(z.literal("")),
  phone: z
    .string()
    .min(1, "Vul je telefoonnummer in")
    .regex(/^\+?[0-9\s\-()]{8,20}$/, "Vul een geldig telefoonnummer in"),
  trade: z.string().max(100).optional(),
  interest: z.string().max(256).optional(),
  message: z.string().max(500).optional(),
  honeypot: z.string().max(0).optional(),
  utm_source: z.string().max(256).optional(),
  utm_medium: z.string().max(256).optional(),
  utm_campaign: z.string().max(256).optional(),
  // Calculator context (optional, sent from /calculator inline form)
  calculator_loss_monthly: z.number().optional(),
  calculator_loss_yearly: z.number().optional(),
  calculator_missed_calls: z.number().optional(),
  calculator_hourly_rate: z.number().optional(),
  calculator_job_hours: z.number().optional(),
});

export type DemoBookingData = z.infer<typeof demoBookingSchema>;

/** Google OAuth signup (profile step) schema */
export const googleSignupSchema = z.object({
  businessName: z
    .string()
    .min(1, "Vul je bedrijfsnaam in")
    .max(100, "Bedrijfsnaam is te lang"),
  phone: z
    .string()
    .min(1, "Vul je telefoonnummer in")
    .regex(
      /^\+?[0-9\s\-()]{8,20}$/,
      "Vul een geldig telefoonnummer in"
    ),
  trade: z.string().min(1, "Selecteer je vakgebied"),
  employees: z.string().max(50).optional(),
  addressLine1: z
    .string()
    .min(1, "Vul je straat en huisnummer in")
    .max(200, "Adres is te lang"),
  postalCode: z
    .string()
    .min(1, "Vul je postcode in")
    .max(20, "Postcode is te lang"),
  city: z
    .string()
    .min(1, "Vul je plaats in")
    .max(100, "Plaatsnaam is te lang"),
  country: z.enum(["NL", "BE", "DE"]).default("NL"),
  vatNumber: z
    .string()
    .regex(/^(NL\d{9}B\d{2})?$/, "Vul een geldig BTW-nummer in (bijv. NL123456789B01)")
    .optional()
    .or(z.literal("")),
  plan: z.enum(["speed-leads", "website", "compleet"]).default("speed-leads"),
});

export type GoogleSignupData = z.infer<typeof googleSignupSchema>;
