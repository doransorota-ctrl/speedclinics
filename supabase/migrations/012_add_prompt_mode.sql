ALTER TABLE businesses ADD COLUMN IF NOT EXISTS prompt_mode text NOT NULL DEFAULT 'service';
