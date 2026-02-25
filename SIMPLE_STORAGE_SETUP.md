# 🗄️ Simple Storage Setup (No Authentication Required)

## Quick Setup for Public File Uploads

This guide creates storage buckets that allow public uploads without requiring user authentication.

## 🔧 Step 1: Create Storage Buckets

### Using Supabase Dashboard:

1. **Go to your Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**
3. **Go to Storage** in the left sidebar
4. **Click "Create a new bucket"**

#### Create these two buckets:

**Bucket 1: `exhibitor-documents`**
- Name: `exhibitor-documents`
- Public bucket: ✅ **Check this**
- File size limit: 50 MB

**Bucket 2: `exhibitor-images`**
- Name: `exhibitor-images`
- Public bucket: ✅ **Check this**
- File size limit: 10 MB

## 🔐 Step 2: Set Up Simple Storage Policies

Run these SQL commands in your Supabase SQL Editor:

```sql
-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Allow public read access to exhibitor-documents
CREATE POLICY "Public read access for exhibitor-documents" ON storage.objects
  FOR SELECT USING (bucket_id = 'exhibitor-documents');

-- Allow public upload access to exhibitor-documents
CREATE POLICY "Public upload access for exhibitor-documents" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'exhibitor-documents');

-- Allow public read access to exhibitor-images
CREATE POLICY "Public read access for exhibitor-images" ON storage.objects
  FOR SELECT USING (bucket_id = 'exhibitor-images');

-- Allow public upload access to exhibitor-images
CREATE POLICY "Public upload access for exhibitor-images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'exhibitor-images');
```

## 🧪 Step 3: Test Upload

1. **Go to your React app**
2. **Register as an exhibitor**
3. **Upload a test file**
4. **Check the Supabase Storage dashboard**

## ✅ Verification

After setup, you should see:
- [ ] Both buckets created in Supabase Storage
- [ ] Files appearing in the buckets after upload
- [ ] No authentication errors during upload
- [ ] Files accessible via public URLs

## 🚨 If Files Still Don't Appear

1. **Check browser console** for upload errors
2. **Verify bucket names** are exactly: `exhibitor-documents` and `exhibitor-images`
3. **Check file size** - make sure files are under the limits
4. **Try a smaller test file** first

## 📁 Expected File Structure

```
exhibitor-documents/
├── company-profiles/
├── gst-certificates/
├── pan-cards/
└── product-catalogs/

exhibitor-images/
├── company-logos/
└── product-images/
```

That's it! This simple setup should work without any authentication requirements. 🚀
