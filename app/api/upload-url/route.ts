import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, canAccessProject } from "@/lib/permissions";
import { buildFileKey, getUploadUrl } from "@/lib/storage";
import {
  MAX_DOC_SIZE, MAX_PHOTO_SIZE, MAX_VIDEO_SIZE,
  ALLOWED_DOC_TYPES, ALLOWED_PHOTO_TYPES, ALLOWED_VIDEO_TYPES,
} from "@/lib/shared";

export const dynamic = 'force-dynamic';

// POST /api/upload-url
// body: { projectId, fileName, fileSize, mimeType, kind }
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  console.log("📦 Upload request:", body);

  // Accept BOTH field name formats
  const projectId = body.projectId;
  const fileName = body.fileName;
  const fileType = body.mimeType || body.fileType;  // Accept both
  const size = body.fileSize || body.size;          // Accept both
  const category = body.kind || body.category;      // Accept both

  if (!projectId || !fileName || !fileType || !category) {
    console.log("❌ Missing fields:", { projectId, fileName, fileType, category });
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
    console.error("upload-url error:", e);
    return NextResponse.json({ error: e?.message || "Could not prepare the upload. Check your Supabase Storage configuration." }, { status: 500 });
  }
}