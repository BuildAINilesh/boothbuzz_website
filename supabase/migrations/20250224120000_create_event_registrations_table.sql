-- Create event_registrations table
-- Tracks exhibitor registrations per event. Required for event registration flow.

-- Trigger function for updated_at (idempotent)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Table
CREATE TABLE event_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  exhibitor_id UUID NOT NULL REFERENCES exhibitors(id) ON DELETE CASCADE,
  booth_size TEXT,
  special_requirements TEXT,
  payment_method TEXT DEFAULT 'online',
  registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, exhibitor_id)
);

-- RLS
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow public read access" ON event_registrations
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated insert" ON event_registrations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow users to update own registrations" ON event_registrations
  FOR UPDATE USING (auth.uid()::text = exhibitor_id::text);

-- Indexes
CREATE INDEX idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX idx_event_registrations_exhibitor_id ON event_registrations(exhibitor_id);

-- Trigger
CREATE TRIGGER update_event_registrations_updated_at
  BEFORE UPDATE ON event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
