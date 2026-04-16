-- Add onboarding tracking columns to businesses table
-- Run this in Supabase SQL Editor if you already ran the initial schema

ALTER TABLE businesses ADD COLUMN IF NOT EXISTS onboarding_step text NOT NULL DEFAULT 'profile';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS forwarding_confirmed boolean NOT NULL DEFAULT false;
