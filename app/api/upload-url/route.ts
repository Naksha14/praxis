export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, canAccessProject } from "@/lib/permissions";
import { buildFileKey, getUploadUrl } from "@/lib/storage";
import {
  MAX_DOC_SIZE, MAX_PHOTO_SIZE, MAX_VIDEO_SIZE,
  ALLOWED_DOC_TYPES, ALLOWED_PHOTO_TYPES, ALLOWED_VIDEO_TYPES,
} from "@/lib/shared";

// POST /api/upload-url
// body: { projectId, fileName, fileType, size, category: "document" | "photo" | "video" }
// Returns a short-lived presigned PUT URL. The browser uploads the file
// bytes directly to object storage; this server never sees the file body.
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { projectId, fileName, fileType, size, category } = await req.json();
  if (!projectId || !fileName || !fileType || !category) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }
  if (!(await canAccessProject(user, projectId))) {
    return NextResponse.json({ error: "You do not have access to this project." }, { status: 403 });
  }

  const limits: Record<string, { max: number; allowed: string[] }> = {
    document: { max: MAX_DOC_SIZE, allowed: ALLOWED_DOC_TYPES },
    photo: { max: MAX_PHOTO_SIZE, allowed: ALLOWED_PHOTO_TYPES },
    video: { max: MAX_VIDEO_SIZE, allowed: ALLOWED_VIDEO_TYPES },
  };
  const rule = limits[category];
  if (!rule) return NextResponse.json({ error: "Unknown upload category." }, { status: 400 });
  if (size > rule.max) return NextResponse.json({ error: "File exceeds the maximum allowed size." }, { status: 400 });
  if (!rule.allowed.includes(fileType)) return NextResponse.json({ error: "Unsupported file type." }, { status: 400 });

  const fileKey = buildFileKey(projectId, fileName);
  try {
    const { signedUrl, token } = await getUploadUrl(fileKey);
    return NextResponse.json({ uploadUrl: signedUrl, fileKey, token });
  } catch (e: any) {
    // Surfaces the real Supabase error (e.g. bucket not found, bad service
    // role key) as readable JSON instead of letting the route crash with an
    // empty response body — which is what was showing up in the browser as
    // "Unexpected end of JSON input."
    console.error("upload-url error:", e);
    return NextResponse.json({ error: e?.message || "Could not prepare the upload. Check your Supabase Storage configuration." }, { status: 500 });
  }
}

