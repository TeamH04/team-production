const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
export const SUPABASE_STORAGE_BUCKET = process.env.EXPO_PUBLIC_SUPABASE_STORAGE_BUCKET ?? 'media';

export function getPublicStorageUrl(objectKey: string) {
  if (!SUPABASE_URL || !objectKey) return '';
  return `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_STORAGE_BUCKET}/${objectKey}`;
}
