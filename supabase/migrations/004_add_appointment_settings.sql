-- Appointment scheduling settings
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS slot_duration_minutes integer DEFAULT 120;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS max_appointments_per_day integer DEFAULT 4;
