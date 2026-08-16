import { createClient } from "@supabase/supabase-js";

// Safe to expose to the browser: the anon key alone grants no storage
// access on its own here. Every upload is actually authorized by the
// short-lived signed token minted server-side (with the service_role key,
// which is NEVER sent to the browser) in app/api/upload-url/route.ts — this
// client is only a thin wrapper so we can call Supabase's official
// `uploadToSignedUrl(path, token, file)` instead of hand-building the
// upload request ourselves.
export const supabaseBrowser = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

export const STORAGE_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET as string;
