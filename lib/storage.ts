import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

// Get environment variables with fallbacks
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const bucketName = process.env.SUPABASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET;

// Log the values (this will show in build logs)
console.log('🔍 Storage config:', {
  supabaseUrl: supabaseUrl ? '✅ set' : '❌ MISSING',
  supabaseKey: supabaseKey ? '✅ set' : '❌ MISSING',
  bucketName: bucketName ? '✅ set' : '❌ MISSING',
});

// Throw clear error if missing
if (!supabaseUrl) {
  throw new Error('❌ supabaseUrl is required! Check SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL env vars');
}
if (!supabaseKey) {
  throw new Error('❌ SUPABASE_SERVICE_ROLE_KEY is required!');
}
if (!bucketName) {
  throw new Error('❌ SUPABASE_STORAGE_BUCKET is required!');
}

// Server-only admin client
const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseKey,
  { auth: { persistSession: false } }
);

const BUCKET = bucketName;

export function buildFileKey(projectId: string, fileName: string) {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `projects/${projectId}/${randomUUID()}-${safeName}`;
}

export async function getUploadUrl(key: string) {
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUploadUrl(key);
  if (error || !data) throw new Error(error?.message || "Could not create an upload URL.");
  return { signedUrl: data.signedUrl, token: data.token };
}

export async function getDownloadUrl(key: string, fileName: string) {
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUrl(key, 60 * 10, { download: fileName });
  if (error || !data) throw new Error(error?.message || "Could not create a download URL.");
  return data.signedUrl;
}

export async function deleteFile(key: string) {
  await supabaseAdmin.storage.from(BUCKET).remove([key]);
}