import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, canAccessProject, isAdmin } from "@/lib/permissions";
import { deleteFile } from "@/lib/storage";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string; mediaId: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await canAccessProject(user, params.id))) {
    return NextResponse.json({ error: "You do not have access to this project." }, { status: 403 });
  }

  const media = await prisma.media.findUnique({ where: { id: params.mediaId } });
  if (!media || media.projectId !== params.id) return NextResponse.json({ error: "File not found." }, { status: 404 });
  if (!isAdmin(user) && media.uploadedById !== user.id) {
    return NextResponse.json({ error: "You can only delete media you uploaded." }, { status: 403 });
  }

  await deleteFile(media.fileKey);
  await prisma.media.delete({ where: { id: params.mediaId } });
  return NextResponse.json({ ok: true });
}
