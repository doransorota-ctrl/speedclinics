-- Add address columns for billing/tax purposes
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS address_line1 text;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS postal_code text;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS country text DEFAULT 'NL';
