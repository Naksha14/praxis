import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

// Server-only admin client using the service_role key, which bypasses
// Storage Row Level Security entirely. That's intentional and is what makes
// this safe with a PRIVATE bucket and no RLS policies to configure: every
// signed upload/download URL is minted here, only after our own
// canAccessProject() check in the calling route has already passed — the
// browser never talks to Supabase directly and never sees this key.
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  { auth: { persistSession: false } }
);

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET as string;

export function buildFileKey(projectId: string, fileName: string) {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `projects/${projectId}/${randomUUID()}-${safeName}`;
}

// Returns the pieces needed to upload directly from the browser using
// Supabase's own storage-js `uploadToSignedUrl(path, token, file)` method —
// deliberately using the SDK's blessed upload path rather than hand-rolling
// the raw HTTP PUT against signedUrl, since the SDK handles the exact
// headers/encoding Supabase's endpoint expects.
export async function getUploadUrl(key: string) {
  const { data, error } = await supabaseAdmin.storage.from(BUCKET).createSignedUploadUrl(key);
  if (error || !data) throw new Error(error?.message || "Could not create an upload URL.");
  return { signedUrl: data.signedUrl, token: data.token };
}

export async function getDownloadUrl(key: string, fileName: string) {
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUrl(key, 60 * 10, { download: fileName }); // 10 minutes, forces a proper filename on download
  if (error || !data) throw new Error(error?.message || "Could not create a download URL.");
  return data.signedUrl;
}

export async function deleteFile(key: string) {
  await supabaseAdmin.storage.from(BUCKET).remove([key]);
}
