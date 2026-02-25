# 📊 Database Requirements & Verification

## 🔍 **Complete Database Schema Verification**

This document lists all required database columns, variables, and interfaces that your Supabase database must have for the application to work properly.

## 📋 **Required Tables & Columns**

### 1. **`exhibitors` Table**
```sql
CREATE TABLE exhibitors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_person TEXT,
  designation TEXT,
  company_description TEXT,
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
```

**Required Columns for Basic Functionality:**
- ✅ `id` (UUID, Primary Key)
- ✅ `company_name` (TEXT, NOT NULL)
- ✅ `contact_person` (TEXT)
- ✅ `email` (TEXT, UNIQUE)
- ✅ `phone` (TEXT)
- ✅ `category` (TEXT)
- ✅ `status` (TEXT, DEFAULT 'registered')
- ✅ `payment_status` (TEXT, DEFAULT 'pending')
- ✅ `registration_date` (TIMESTAMP)
- ✅ `created_at` (TIMESTAMP)
- ✅ `updated_at` (TIMESTAMP)

### 2. **`events` Table**
```sql
CREATE TABLE events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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
  vendor_ids TEXT[],
  venue_id UUID REFERENCES venues(id),
  created_by UUID,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Required Columns for Basic Functionality:**
- ✅ `id` (UUID, Primary Key)
- ✅ `title` (TEXT, NOT NULL)
- ✅ `description` (TEXT)
- ✅ `event_date` (DATE, NOT NULL)
- ✅ `event_time` (TIME, NOT NULL)
- ✅ `venue_name` (TEXT, NOT NULL)
- ✅ `city` (TEXT)
- ✅ `status` (TEXT, DEFAULT 'draft')
- ✅ `attendees` (INTEGER, DEFAULT 0)
- ✅ `max_capacity` (INTEGER, DEFAULT 100)
- ✅ `plan_type` (TEXT)
- ✅ `created_at` (TIMESTAMP)
- ✅ `updated_at` (TIMESTAMP)

### 3. **`venues` Table** (Optional but recommended)
```sql
CREATE TABLE venues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  capacity INTEGER DEFAULT 0,
  facilities TEXT[],
  active_events INTEGER DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  joined_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 4. **`vendors` Table** (Optional but recommended)
```sql
CREATE TABLE vendors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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
```

### 5. **`users` Table** (Optional - for extended functionality)
```sql
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT CHECK (role IN ('super_admin', 'admin', 'support_tech', 'sales_marketing', 'legal', 'logistics', 'accounting', 'vendor', 'society', 'exhibitor')),
  city TEXT,
  phone TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔐 **Required RLS Policies**

### For `exhibitors` table:
```sql
ALTER TABLE exhibitors ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access" ON exhibitors
  FOR SELECT USING (true);

-- Allow authenticated users to insert
CREATE POLICY "Allow authenticated insert" ON exhibitors
  FOR INSERT WITH CHECK (true);

-- Allow users to update their own records
CREATE POLICY "Allow users to update own records" ON exhibitors
  FOR UPDATE USING (auth.uid()::text = id::text);
```

### For `events` table:
```sql
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access" ON events
  FOR SELECT USING (true);

-- Allow authenticated users to insert (for admins)
CREATE POLICY "Allow authenticated insert" ON events
  FOR INSERT WITH CHECK (true);
```

## 🔧 **Environment Variables Required**

Create a `.env` file in your project root:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## 📊 **TypeScript Interfaces**

### **Exhibitor Interface** (src/types/index.ts)
```typescript
export interface Exhibitor {
  id: string;
  companyName: string; // maps to company_name
  contactPerson?: string | null; // maps to contact_person
  designation?: string | null;
  companyDescription?: string | null; // maps to company_description
  website?: string | null;
  alternateEmail?: string | null; // maps to alternate_email
  alternatePhone?: string | null; // maps to alternate_phone
  address?: string | null;
  country?: string | null;
  state?: string | null;
  pincode?: string | null;
  gstNumber?: string | null; // maps to gst_number
  email?: string | null;
  phone?: string | null;
  category?: string | null;
  city?: string | null;
  booth?: string | null;
  registrationDate?: string | null; // maps to registration_date
  status: 'registered' | 'confirmed' | 'checked_in' | 'cancelled';
  paymentStatus: 'pending' | 'paid' | 'refunded'; // maps to payment_status
  created_at: string;
  updated_at: string;
}
```

### **Event Interface** (src/types/index.ts)
```typescript
export interface Event {
  id: string;
  title: string;
  description?: string | null;
  date: string; // maps to event_date
  time: string; // maps to event_time
  venue: string; // maps to venue_name
  city?: string | null;
  status: 'draft' | 'published' | 'ongoing' | 'completed' | 'cancelled';
  attendees: number;
  maxCapacity: number; // maps to max_capacity
  planType?: 'Plan A' | 'Plan B' | 'Plan C' | 'Custom' | null; // maps to plan_type
  vendors: string[]; // maps to vendor_ids
  venueId?: string | null; // maps to venue_id
  createdBy?: string | null; // maps to created_by
  totalRevenue: number; // maps to total_revenue
  created_at: string;
  updated_at: string;
}
```

## 🔍 **Database Operations Used**

### **Exhibitor Operations:**
1. **Insert** (Basic Registration):
   ```typescript
   {
     company_name: string,
     contact_person: string,
     email: string,
     phone: string,
     category: string,
     description: string, // Note: using 'description' not 'company_description'
     status: 'registered',
     payment_status: 'pending',
     registration_date: ISO string
   }
   ```

2. **Select** (Search by email/phone):
   ```typescript
   supabase.from('exhibitors').select('*').eq('email', email).single()
   supabase.from('exhibitors').select('*').eq('phone', phone).single()
   ```

3. **Select** (List all):
   ```typescript
   supabase.from('exhibitors').select('*').order('created_at', { ascending: false })
   ```

### **Event Operations:**
1. **Select** (List all with venue info):
   ```typescript
   supabase.from('events').select('*, venue:venues(name)').order('created_at', { ascending: false })
   ```

## ✅ **Verification Checklist**

### **Essential (Must Have):**
- [ ] `exhibitors` table exists with all required columns
- [ ] `events` table exists with all required columns
- [ ] RLS policies configured for `exhibitors` and `events`
- [ ] Environment variables set in `.env` file
- [ ] Supabase connection working

### **Recommended (Nice to Have):**
- [ ] `venues` table for venue management
- [ ] `vendors` table for vendor management
- [ ] `users` table for extended user management
- [ ] `event_registrations` table for tracking event registrations

### **Optional (Future Features):**
- [ ] `societies` table for society management
- [ ] `payments` table for payment tracking
- [ ] `notifications` table for notification system

## 🚨 **Common Issues & Solutions**

### **1. "Column 'description' does not exist"**
**Solution**: Your database has `company_description` but code expects `description`
```sql
-- Add this column to your exhibitors table
ALTER TABLE exhibitors ADD COLUMN description TEXT;
```

### **2. "Table 'events' does not exist"**
**Solution**: Create the events table using the SQL above

### **3. "RLS policy violation"**
**Solution**: Ensure RLS policies allow the operations you're trying to perform

### **4. "Auth connection failed"**
**Solution**: Check your anon key and ensure Auth is enabled in Supabase

## 🔧 **Quick Fix Commands**

If you need to add missing columns:

```sql
-- Add missing columns to exhibitors table
ALTER TABLE exhibitors ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE exhibitors ADD COLUMN IF NOT EXISTS designation TEXT;
ALTER TABLE exhibitors ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE exhibitors ADD COLUMN IF NOT EXISTS alternate_email TEXT;
ALTER TABLE exhibitors ADD COLUMN IF NOT EXISTS alternate_phone TEXT;
ALTER TABLE exhibitors ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE exhibitors ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE exhibitors ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE exhibitors ADD COLUMN IF NOT EXISTS pincode TEXT;
ALTER TABLE exhibitors ADD COLUMN IF NOT EXISTS gst_number TEXT;
ALTER TABLE exhibitors ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE exhibitors ADD COLUMN IF NOT EXISTS booth TEXT;

-- Add missing columns to events table
ALTER TABLE events ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS attendees INTEGER DEFAULT 0;
ALTER TABLE events ADD COLUMN IF NOT EXISTS max_capacity INTEGER DEFAULT 100;
ALTER TABLE events ADD COLUMN IF NOT EXISTS plan_type TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS vendor_ids TEXT[];
ALTER TABLE events ADD COLUMN IF NOT EXISTS venue_id UUID;
ALTER TABLE events ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE events ADD COLUMN IF NOT EXISTS total_revenue DECIMAL(10,2) DEFAULT 0;
```

## 🎯 **Next Steps**

1. **Run the verification**: The app will automatically check your database schema
2. **Check the connection indicator**: Look for the green "Supabase Connected" indicator
3. **Test the registration flow**: Try registering an exhibitor and event
4. **Check browser console**: For detailed logs and any errors

Your database should now be fully compatible with the application! 🚀 