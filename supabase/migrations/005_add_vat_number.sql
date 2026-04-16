-- Add VAT number column for Dutch business invoicing
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS vat_number text;
