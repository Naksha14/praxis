export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, canAccessProject } from "@/lib/permissions";
import { getUploadUrl, buildFileKey } from "@/lib/storage";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { projectId, fileName, fileSize, mimeType, kind } = body;

  if (!projectId || !fileName || !fileSize || !mimeType || !kind) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!(await canAccessProject(user, projectId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const key = buildFileKey(projectId, fileName);
  const { signedUrl, token } = await getUploadUrl(key);

  return NextResponse.json({ signedUrl, token, key });
}
