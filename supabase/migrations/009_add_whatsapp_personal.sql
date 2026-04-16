ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS whatsapp_personal boolean DEFAULT false;
