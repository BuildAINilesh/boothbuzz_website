# 🗄️ Supabase Storage Setup Guide

## 📋 Required Storage Buckets

You need to create two storage buckets in your Supabase project for the exhibitor file upload functionality.

## 🔧 Step 1: Create Storage Buckets

### Option A: Using Supabase Dashboard (Recommended)

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**
3. **Go to Storage** in the left sidebar
4. **Click "Create a new bucket"**
5. **Create these two buckets:**

#### Bucket 1: `exhibitor-documents`
- **Name**: `exhibitor-documents`
- **Public bucket**: ✅ Check this
- **File size limit**: 50 MB
- **Allowed MIME types**: `application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png,image/gif`

#### Bucket 2: `exhibitor-images`
- **Name**: `exhibitor-images`
- **Public bucket**: ✅ Check this
- **File size limit**: 10 MB
- **Allowed MIME types**: `image/jpeg,image/png,image/gif,image/webp`

### Option B: Using SQL Commands

If you prefer to use SQL, run these commands in your Supabase SQL Editor:

```sql
-- Create exhibitor-documents bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'exhibitor-documents',
  'exhibitor-documents',
  true,
  52428800, -- 50MB in bytes
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/gif']
);

-- Create exhibitor-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'exhibitor-images',
  'exhibitor-images',
  true,
  10485760, -- 10MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);
```

## 🔐 Step 2: Set Up Storage Policies

After creating the buckets, you need to set up Row Level Security (RLS) policies.

### For `exhibitor-documents` bucket:

```sql
-- Enable RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow public read access to exhibitor-documents
CREATE POLICY "Public read access for exhibitor-documents" ON storage.objects
  FOR SELECT USING (bucket_id = 'exhibitor-documents');

-- Allow authenticated users to upload to exhibitor-documents
CREATE POLICY "Authenticated upload access for exhibitor-documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'exhibitor-documents' 
    AND auth.role() = 'authenticated'
  );

-- Allow users to update their own files
CREATE POLICY "User update access for exhibitor-documents" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'exhibitor-documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to delete their own files
CREATE POLICY "User delete access for exhibitor-documents" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'exhibitor-documents' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

### For `exhibitor-images` bucket:

```sql
-- Allow public read access to exhibitor-images
CREATE POLICY "Public read access for exhibitor-images" ON storage.objects
  FOR SELECT USING (bucket_id = 'exhibitor-images');

-- Allow authenticated users to upload to exhibitor-images
CREATE POLICY "Authenticated upload access for exhibitor-images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'exhibitor-images' 
    AND auth.role() = 'authenticated'
  );

-- Allow users to update their own files
CREATE POLICY "User update access for exhibitor-images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'exhibitor-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to delete their own files
CREATE POLICY "User delete access for exhibitor-images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'exhibitor-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

## 🧪 Step 3: Test the Setup

1. **Go to your React app**
2. **Try registering as an exhibitor**
3. **Upload a test file**
4. **Check the Supabase Storage dashboard** to see if files appear

## 🚨 Troubleshooting

### "Bucket does not exist" error:
- Make sure you created both buckets exactly as named: `exhibitor-documents` and `exhibitor-images`
- Check that the buckets are public

### "Permission denied" error:
- Make sure you've set up the RLS policies correctly
- Check that your Supabase anon key is correct

### Files not appearing:
- Check the browser console for upload errors
- Verify the bucket names match exactly
- Check file size limits

## 📁 File Structure

After setup, your storage will look like this:

```
exhibitor-documents/
├── company-profiles/
│   └── [timestamp]-filename.pdf
├── gst-certificates/
│   └── [timestamp]-filename.jpg
├── pan-cards/
│   └── [timestamp]-filename.pdf
└── product-catalogs/
    └── [timestamp]-filename.pdf

exhibitor-images/
├── company-logos/
│   └── [timestamp]-filename.png
└── product-images/
    └── [timestamp]-filename.jpg
```

## ✅ Verification Checklist

- [ ] `exhibitor-documents` bucket created and public
- [ ] `exhibitor-images` bucket created and public
- [ ] RLS policies set up for both buckets
- [ ] File upload test successful
- [ ] Files visible in Supabase Storage dashboard

Your storage should now be ready for exhibitor file uploads! 🚀
