import { supabase } from '../supabase';

const CATALOGUE_BUCKET = 'exhibitor-images';

async function uploadFile(file: File, path: string): Promise<string> {
  const { error } = await supabase.storage.from(CATALOGUE_BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) {
    if (error.message?.includes('bucket') || error.message?.includes('not found')) {
      throw new Error(`Storage bucket '${CATALOGUE_BUCKET}' does not exist. Please create it in Supabase.`);
    }
    if (error.message?.includes('permission') || error.message?.includes('policy')) {
      throw new Error(
        `Permission denied uploading to '${CATALOGUE_BUCKET}'. Run the migration supabase/migrations/20260518130000_exhibitor_storage_upload_policies.sql in the Supabase SQL editor (or apply pending migrations).`
      );
    }
    throw new Error(error.message || 'Upload failed');
  }
  const {
    data: { publicUrl },
  } = supabase.storage.from(CATALOGUE_BUCKET).getPublicUrl(path);
  return publicUrl;
}

/** Upload catalogue product images for an exhibitor. */
export async function uploadCatalogueImages(exhibitorId: string, files: File[]): Promise<string[]> {
  if (!files.length) return [];
  const base = `catalogue/${exhibitorId}/${Date.now()}`;
  const uploads = files.map((file, index) => {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${base}-${index}-${safeName}`;
    return uploadFile(file, path);
  });
  return Promise.all(uploads);
}
