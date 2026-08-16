export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, canAccessProject } from "@/lib/permissions";

// POST /api/projects/:id/documents
// Called after the browser has already PUT the file bytes to object storage
// using the presigned URL from /api/upload-url. This just records metadata.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await canAccessProject(user, params.id))) {
    return NextResponse.json({ error: "You do not have access to this project." }, { status: 403 });
  }

  const { name, docType, fileKey, mimeType, size } = await req.json();
  if (!name || !docType || !fileKey || !mimeType || !size) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const doc = await prisma.document.create({
    data: { projectId: params.id, name, docType, fileKey, mimeType, size, uploadedById: user.id },
    include: { uploadedBy: { select: { name: true } } },
  });
  return NextResponse.json(doc, { status: 201 });
}
