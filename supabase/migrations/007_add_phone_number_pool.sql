-- Phone number pool for automated WhatsApp number assignment
-- Numbers are pre-approved for WhatsApp Business API before any customer signs up.
-- On signup: one approved number is assigned to the business (status → assigned).
-- On cancellation: number is released back to pool (status → approved).

CREATE TABLE IF NOT EXISTS phone_number_pool (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  twilio_number         text NOT NULL UNIQUE,   -- E.164 format, e.g. +31612345678
  twilio_sid            text NOT NULL,          -- Twilio Phone Number SID (PNxxx)
  meta_phone_number_id  text,                   -- Meta Graph API phone number ID (fill manually from Meta Business Manager)
  status                text NOT NULL DEFAULT 'pending_approval'
                          CHECK (status IN ('pending_approval', 'approved', 'assigned')),
  assigned_business_id  uuid REFERENCES businesses(id) ON DELETE SET NULL,
  assigned_at           timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pool_status ON phone_number_pool(status);
CREATE INDEX IF NOT EXISTS idx_pool_assigned_business ON phone_number_pool(assigned_business_id);
