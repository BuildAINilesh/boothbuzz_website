# 🚀 Supabase Setup Guide

## 📋 Prerequisites
- Supabase account and project created
- Node.js and npm installed
- React project with Vite

## 🔧 Step 1: Create Environment Variables

Create a `.env` file in your project root with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### How to get your Supabase credentials:

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**
3. **Go to Settings → API**
4. **Copy the following values**:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

## 🗄️ Step 2: Database Schema Setup

### Required Tables

#### 1. `exhibitors` Table
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

#### 2. `events` Table
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

#### 3. `event_registrations` Table (Optional - for future use)
```sql
CREATE TABLE event_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  exhibitor_id UUID REFERENCES exhibitors(id) ON DELETE CASCADE,
  booth_size TEXT,
  special_requirements TEXT,
  payment_method TEXT,
  registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, exhibitor_id)
);
```

## 🔐 Step 3: Row Level Security (RLS) Policies

### Enable RLS on tables:
```sql
ALTER TABLE exhibitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
```

### Create policies for exhibitors table:
```sql
-- Allow public read access
CREATE POLICY "Allow public read access" ON exhibitors
  FOR SELECT USING (true);

-- Allow authenticated users to insert
CREATE POLICY "Allow authenticated insert" ON exhibitors
  FOR INSERT WITH CHECK (true);

-- Allow users to update their own records
CREATE POLICY "Allow users to update own records" ON exhibitors
  FOR UPDATE USING (auth.uid()::text = id::text);

-- Allow users to delete their own records
CREATE POLICY "Allow users to delete own records" ON exhibitors
  FOR DELETE USING (auth.uid()::text = id::text);
```

### Create policies for events table:
```sql
-- Allow public read access
CREATE POLICY "Allow public read access" ON events
  FOR SELECT USING (true);

-- Allow authenticated users to insert (for admins)
CREATE POLICY "Allow authenticated insert" ON events
  FOR INSERT WITH CHECK (true);
```

## 🧪 Step 4: Test Your Connection

1. **Start your development server**:
   ```bash
   npm run dev
   ```

2. **Check the Supabase connection indicator** in the top-right corner of your app

3. **Open browser console** to see detailed connection logs

4. **Test the registration flow**:
   - Click "Register Now" on any event
   - Try searching for an exhibitor by email/phone
   - Test the signup/login functionality

## 🔍 Step 5: Verify Everything Works

### ✅ Connection Test
The `SupabaseTest` component will show:
- ✅ Environment variables found
- ✅ Auth connection successful  
- ✅ Database connection successful
- ✅ Events table accessible

### ✅ Functionality Test
1. **Exhibitor Registration**: Should save to `exhibitors` table
2. **Event Registration**: Should work with authentication
3. **Data Fetching**: Events should load from database
4. **Authentication**: Login/signup should work

## 🐛 Troubleshooting

### Common Issues:

#### 1. "Missing Supabase environment variables"
**Solution**: Check your `.env` file exists and has correct values

#### 2. "Database connection failed"
**Solution**: 
- Verify your Supabase URL and key are correct
- Check if your database is online in Supabase dashboard
- Ensure RLS policies are set up correctly

#### 3. "Auth connection failed"
**Solution**:
- Verify your anon key is correct
- Check if Auth is enabled in your Supabase project
- Ensure email confirmations are configured

#### 4. "Events table: relation does not exist"
**Solution**: Create the events table using the SQL above

#### 5. "RLS policy violation"
**Solution**: Check your RLS policies and ensure they allow the operations you're trying to perform

## 📞 Support

If you're still having issues:

1. **Check the browser console** for detailed error messages
2. **Verify your Supabase project settings**
3. **Test with a simple query** in Supabase SQL editor
4. **Check the network tab** for failed requests

## 🎉 Success!

Once everything is working, you should see:
- ✅ Green "Supabase Connected" indicator
- ✅ Events loading from your database
- ✅ Registration flow working end-to-end
- ✅ Authentication working properly

Your application is now fully connected to Supabase! 🚀 