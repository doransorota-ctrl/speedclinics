-- Add available_hours column to businesses table
-- Stores business hours as JSON: { "mon": { "start": "08:00", "end": "17:00" }, "tue": ... }
-- A null day means the business is closed that day.
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS available_hours jsonb DEFAULT '{
  "mon": { "start": "08:00", "end": "17:00" },
  "tue": { "start": "08:00", "end": "17:00" },
  "wed": { "start": "08:00", "end": "17:00" },
  "thu": { "start": "08:00", "end": "17:00" },
  "fri": { "start": "08:00", "end": "17:00" },
  "sat": null,
  "sun": null
}'::jsonb;
