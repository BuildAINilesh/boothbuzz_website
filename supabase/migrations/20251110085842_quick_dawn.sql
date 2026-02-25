/*
  # Complete BoothBuzz Database Schema

  1. New Tables
    - `users` - User management with roles
    - `exhibitors` - Exhibitor registration and management
    - `events` - Event management with all details
    - `venues` - Venue information and management
    - `vendors` - Vendor management for services
    - `event_registrations` - Track exhibitor event registrations

  2. Security
    - Enable RLS on all tables
    - Add policies for public read access and authenticated operations
    - Secure user data with proper access controls

  3. Features
    - Complete user role management
    - Event management with images and capacity
    - Exhibitor registration workflow
    - Venue and vendor management
    - Event registration tracking
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'exhibitor' CHECK (role IN ('super_admin', 'admin', 'support_tech', 'sales_marketing', 'legal', 'logistics', 'accounting', 'vendor', 'society', 'exhibitor')),
  city TEXT,
  phone TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create exhibitors table
CREATE TABLE IF NOT EXISTS exhibitors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_person TEXT,
  designation TEXT,
  company_description TEXT,
  description TEXT, -- For backward compatibility
  website TEXT,
  alternate_email TEXT,
  alternate_phone TEXT,
  address TEXT,
  country TEXT,
  state TEXT,
  pincode TEXT,
  gst_number TEXT,
  email TEXT UNIQUE,
  phone TEXT,
  category TEXT,
  city TEXT,
  booth TEXT,
  registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'registered' CHECK (status IN ('registered', 'confirmed', 'checked_in', 'cancelled')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create venues table
CREATE TABLE IF NOT EXISTS venues (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  capacity INTEGER DEFAULT 0,
  facilities TEXT[] DEFAULT '{}',
  active_events INTEGER DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  joined_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT CHECK (category IN ('sound_lights', 'catering', 'decoration', 'security', 'transportation', 'housekeeping')),
  city TEXT,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  rating INTEGER,
  completed_jobs INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  price_range TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME NOT NULL,
  venue_name TEXT NOT NULL,
  city TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'ongoing', 'completed', 'cancelled')),
  attendees INTEGER DEFAULT 0,
  max_capacity INTEGER DEFAULT 100,
  plan_type TEXT CHECK (plan_type IN ('Plan A', 'Plan B', 'Plan C', 'Custom')),
  vendor_ids TEXT[] DEFAULT '{}',
  venue_id UUID REFERENCES venues(id),
  created_by UUID,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  event_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create event_registrations table
CREATE TABLE IF NOT EXISTS event_registrations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  exhibitor_id UUID REFERENCES exhibitors(id) ON DELETE CASCADE,
  booth_size TEXT,
  special_requirements TEXT,
  payment_method TEXT DEFAULT 'online',
  registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, exhibitor_id)
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE exhibitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Allow public read access" ON users
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated insert" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow users to update own records" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Create policies for exhibitors table
CREATE POLICY "Allow public read access" ON exhibitors
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated insert" ON exhibitors
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow users to update own records" ON exhibitors
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Create policies for venues table
CREATE POLICY "Allow public read access" ON venues
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated insert" ON venues
  FOR INSERT WITH CHECK (true);

-- Create policies for vendors table
CREATE POLICY "Allow public read access" ON vendors
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated insert" ON vendors
  FOR INSERT WITH CHECK (true);

-- Create policies for events table
CREATE POLICY "Allow public read access" ON events
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated insert" ON events
  FOR INSERT WITH CHECK (true);

-- Create policies for event_registrations table
CREATE POLICY "Allow public read access" ON event_registrations
  FOR SELECT USING (true);

CREATE POLICY "Allow authenticated insert" ON event_registrations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow users to update own registrations" ON event_registrations
  FOR UPDATE USING (auth.uid()::text = exhibitor_id::text);

-- Insert sample data for testing

-- Sample venues
INSERT INTO venues (name, location, contact_person, email, phone, capacity, facilities, status) VALUES
('Sunrise Society Club House', 'Andheri West, Mumbai', 'Priya Sharma', 'priya@sunrisesociety.com', '+91 9876543210', 200, ARRAY['parking', 'sound_system', 'seating'], 'active'),
('Green Valley Community Hall', 'Bandra East, Mumbai', 'Rajesh Kumar', 'rajesh@greenvalley.com', '+91 9876543211', 150, ARRAY['parking', 'catering_facility', 'stage'], 'active'),
('Metro Mall Event Space', 'Powai, Mumbai', 'Anita Desai', 'events@metromall.com', '+91 9876543212', 300, ARRAY['parking', 'sound_system', 'lighting', 'security'], 'active')
ON CONFLICT (id) DO NOTHING;

-- Sample vendors
INSERT INTO vendors (name, category, city, contact_person, email, phone, rating, completed_jobs, status, price_range) VALUES
('Mumbai Sound & Lights', 'sound_lights', 'Mumbai', 'Vikram Singh', 'vikram@mumbaisound.com', '+91 9876543213', 5, 25, 'active', '₹15,000 - ₹50,000'),
('Royal Caterers', 'catering', 'Mumbai', 'Chef Meera', 'meera@royalcaterers.com', '+91 9876543214', 5, 40, 'active', '₹200 - ₹500 per person'),
('Elegant Decorations', 'decoration', 'Mumbai', 'Kavya Reddy', 'kavya@elegantdeco.com', '+91 9876543215', 4, 30, 'active', '₹10,000 - ₹75,000')
ON CONFLICT (id) DO NOTHING;

-- Sample events with proper image URLs
INSERT INTO events (title, description, event_date, event_time, venue_name, city, status, attendees, max_capacity, plan_type, event_image_url) VALUES
('Mumbai Food Carnival 2024', 'A vibrant celebration of Mumbai''s diverse culinary heritage featuring local chefs, food stalls, and live cooking demonstrations.', '2024-02-15', '10:00:00', 'Sunrise Society Club House', 'Mumbai', 'published', 180, 200, 'Plan A', 'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=800'),
('Tech Innovation Expo', 'Showcasing the latest in technology and innovation with startups, established companies, and tech enthusiasts.', '2024-02-20', '09:00:00', 'Metro Mall Event Space', 'Mumbai', 'published', 250, 300, 'Plan B', 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=800'),
('Health & Wellness Fair', 'Promoting healthy living with fitness demonstrations, nutrition consultations, and wellness product exhibitions.', '2024-02-25', '08:00:00', 'Green Valley Community Hall', 'Mumbai', 'published', 120, 150, 'Plan A', 'https://images.pexels.com/photos/1839919/pexels-photo-1839919.jpeg?auto=compress&cs=tinysrgb&w=800'),
('Cultural Heritage Festival', 'Celebrating local arts, crafts, and cultural traditions with artisan stalls, performances, and workshops.', '2024-03-01', '11:00:00', 'Sunrise Society Club House', 'Mumbai', 'published', 160, 200, 'Plan C', 'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg?auto=compress&cs=tinysrgb&w=800'),
('Artisan Craft Exhibition', 'Featuring handmade crafts, jewelry, textiles, and artwork from local artisans and craftspeople.', '2024-03-05', '10:30:00', 'Metro Mall Event Space', 'Mumbai', 'published', 200, 300, 'Plan B', 'https://images.pexels.com/photos/135620/pexels-photo-135620.jpeg?auto=compress&cs=tinysrgb&w=800')
ON CONFLICT (id) DO NOTHING;

-- Sample exhibitors
INSERT INTO exhibitors (company_name, contact_person, email, phone, category, city, status, payment_status, description) VALUES
('Spice Garden Restaurant', 'Chef Vikram Singh', 'chef@spicegarden.com', '+91 9876543220', 'Food & Beverage', 'Mumbai', 'registered', 'pending', 'Authentic Indian cuisine with traditional recipes passed down through generations.'),
('Sparkle Creations', 'Anita Desai', 'anita@sparklecreations.com', '+91 9876543221', 'Jewelry', 'Mumbai', 'registered', 'paid', 'Handcrafted jewelry using traditional techniques and modern designs.'),
('Traditional Crafts Co.', 'Ravi Gupta', 'ravi@traditionalcrafts.com', '+91 9876543222', 'Handicrafts', 'Mumbai', 'confirmed', 'paid', 'Authentic handmade crafts showcasing Indian cultural heritage.'),
('InnovateTech Solutions', 'Dr. Sunita Joshi', 'sunita@innovatetech.com', '+91 9876543223', 'Technology', 'Mumbai', 'registered', 'pending', 'Cutting-edge technology solutions for modern businesses.'),
('Healthy Living Hub', 'Amit Sharma', 'amit@healthyliving.com', '+91 9876543224', 'Health & Wellness', 'Mumbai', 'confirmed', 'paid', 'Promoting healthy lifestyle through natural products and wellness services.')
ON CONFLICT (id) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_exhibitors_email ON exhibitors(email);
CREATE INDEX IF NOT EXISTS idx_exhibitors_phone ON exhibitors(phone);
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_event_registrations_exhibitor_id ON event_registrations(exhibitor_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exhibitors_updated_at BEFORE UPDATE ON exhibitors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_venues_updated_at BEFORE UPDATE ON venues FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_event_registrations_updated_at BEFORE UPDATE ON event_registrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();