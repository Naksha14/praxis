import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

// Server-only admin client using the service_role key
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  { auth: { persistSession: false } }
);

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "";

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