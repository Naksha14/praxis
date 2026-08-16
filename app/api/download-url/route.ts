import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, canAccessProject } from "@/lib/permissions";
import { getDownloadUrl } from "@/lib/storage";

// Force dynamic rendering - prevents build-time prerendering
export const dynamic = 'force-dynamic';

// GET /api/download-url?kind=document|media&id=...
// Verifies the caller has access to the parent project before ever
// minting a signed URL, so a guessed file id can't be used to exfiltrate
// another project's files.
export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const kind = req.nextUrl.searchParams.get("kind");
  const id = req.nextUrl.searchParams.get("id");
  if (!kind || !id) return NextResponse.json({ error: "Missing kind or id." }, { status: 400 });

  const record =
    kind === "document"
      ? await prisma.document.findUnique({ where: { id } })
      : await prisma.media.findUnique({ where: { id } });

  if (!record) return NextResponse.json({ error: "File not found." }, { status: 404 });
  if (!(await canAccessProject(user, record.projectId))) {
    return NextResponse.json({ error: "You do not have access to this file." }, { status: 403 });
  }

  try {
    const url = await getDownloadUrl(record.fileKey, record.name);
    return NextResponse.json({ url });
  } catch (e: any) {
    console.error("download-url error:", e);
    return NextResponse.json({ error: e?.message || "Could not prepare the download. Check your Supabase Storage configuration." }, { status: 500 });
  }
}