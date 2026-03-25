-- Add sponsor columns to events table
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS sponsor_name TEXT,
  ADD COLUMN IF NOT EXISTS sponsor_logo_url TEXT;
