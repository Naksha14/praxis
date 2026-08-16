export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, canAccessProject, isAdmin } from "@/lib/permissions";
import { deleteFile } from "@/lib/storage";

// DELETE — admin can delete any document; a project in-charge can only
// delete documents they themselves uploaded. Enforced server-side.
export async function DELETE(_req: NextRequest, { params }: { params: { id: string; docId: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await canAccessProject(user, params.id))) {
    return NextResponse.json({ error: "You do not have access to this project." }, { status: 403 });
  }

  const doc = await prisma.document.findUnique({ where: { id: params.docId } });
  if (!doc || doc.projectId !== params.id) return NextResponse.json({ error: "Document not found." }, { status: 404 });
  if (!isAdmin(user) && doc.uploadedById !== user.id) {
    return NextResponse.json({ error: "You can only delete documents you uploaded." }, { status: 403 });
  }

  await deleteFile(doc.fileKey);
  await prisma.document.delete({ where: { id: params.docId } });
  return NextResponse.json({ ok: true });
}
