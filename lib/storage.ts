import { getSupabaseAdmin } from "./supabase-server";
import { randomUUID } from "crypto";

export function buildFileKey(projectId: string, fileName: string) {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `projects/${projectId}/${randomUUID()}-${safeName}`;
}

export async function getUploadUrl(key: string) {
  const { client, bucket } = getSupabaseAdmin();
  const { data, error } = await client.storage.from(bucket).createSignedUploadUrl(key);
  if (error || !data) throw new Error(error?.message || "Could not create an upload URL.");
  return { signedUrl: data.signedUrl, token: data.token };
}

export async function getDownloadUrl(key: string, fileName: string) {
  const { client, bucket } = getSupabaseAdmin();
  const { data, error } = await client.storage
    .from(bucket)
    .createSignedUrl(key, 60 * 10, { download: fileName });
  if (error || !data) throw new Error(error?.message || "Could not create a download URL.");
  return data.signedUrl;
}

export async function deleteFile(key: string) {
  const { client, bucket } = getSupabaseAdmin();
  await client.storage.from(bucket).remove([key]);
}