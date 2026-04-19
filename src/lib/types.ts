/** Shared TypeScript interfaces — used across portal, API routes, and hooks */

export interface Business {
  id: string;
  owner_id: string;
  name: string;
  trade: string;
  phone: string;
  email: string;
  service_area: string | null;

  // Address
  address_line1: string | null;
  postal_code: string | null;
  city: string | null;
  country: string | null;

  // Plan & billing
  plan: "speed-leads" | "website" | "compleet";
  status: "pending_payment" | "trialing" | "active" | "past_due" | "cancelled" | "paused";
  trial_starts_at: string | null;
  subscription_ends_at: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;

  // Onboarding & features
  speed_leads_active: boolean;
  is_active: boolean;
  employees: string | null;
  has_whatsapp: boolean;
  has_website: boolean;
  website_url: string | null;
  monthly_leads: string | null;
  calendar_type: "google" | "calendly" | null;
  twilio_number: string | null;
  prompt_mode: "service" | "sales";
  onboarding_step: string;
  onboarding_completed_at: string | null;
  forwarding_confirmed: boolean;
  available_hours: Record<string, { start: string; end: string } | null> | null;
  slot_duration_minutes: number | null;
  max_appointments_per_day: number | null;
  google_review_link: string | null;
  whatsapp_profile_picture_handle: string | null;
  demo_followup_message: string | null;
  treatment_info: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  business_id: string;
  customer_phone: string;
  customer_name: string | null;
  source: "missed_call" | "whatsapp" | "form" | "manual";
  status: "active" | "qualified" | "appointment_set" | "converted" | "lost" | "archived";
  inbound_call_sid: string | null;
  conversation_mode: "ai" | "manual";
  problem_summary: string | null;
  problem_details: string | null;
  address: string | null;
  urgency: "low" | "medium" | "high" | "emergency" | null;
  appointment_start: string | null;
  appointment_end: string | null;
  google_event_id: string | null;
  first_response_at: string | null;
  flagged: boolean;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  lead_id: string;
  business_id: string;
  sender: "customer" | "ai" | "owner";
  body: string;
  channel: "whatsapp" | "sms" | "voice";
  twilio_sid: string | null;
  twilio_status: string | null;
  created_at: string;
}
