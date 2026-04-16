-- Meta media handle for the WhatsApp Business Profile picture.
-- Stored after uploading the business logo directly to Meta's media API.
-- Not a URL — use to re-apply the picture when a new pool number is assigned.
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS whatsapp_profile_picture_handle text;

-- Google review link (referenced in TypeScript types and review-request cron but
-- may not yet exist as a column in all environments).
ALTER TABLE businesses
  ADD COLUMN IF NOT EXISTS google_review_link text;
