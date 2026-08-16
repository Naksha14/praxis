import { createClient } from "@supabase/supabase-js";

export function getSupabaseAdmin() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const bucketName = process.env.SUPABASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET;

  if (!supabaseUrl) throw new Error('❌ SUPABASE_URL is required!');
  if (!supabaseKey) throw new Error('❌ SUPABASE_SERVICE_ROLE_KEY is required!');
  if (!bucketName) throw new Error('❌ SUPABASE_STORAGE_BUCKET is required!');

  return {
    client: createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } }),
    bucket: bucketName,
  };
}