import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, canAccessProject } from "@/lib/permissions";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await canAccessProject(user, params.id))) {
    return NextResponse.json({ error: "You do not have access to this project." }, { status: 403 });
  }

  const { name, kind, fileKey, mimeType, size } = await req.json();
  if (!name || !kind || !fileKey || !mimeType || !size || !["photo", "video"].includes(kind)) {
    return NextResponse.json({ error: "Missing or invalid fields." }, { status: 400 });
  }

  const media = await prisma.media.create({
    data: { projectId: params.id, name, kind, fileKey, mimeType, size, uploadedById: user.id },
    include: { uploadedBy: { select: { name: true } } },
  });
  return NextResponse.json(media, { status: 201 });
}
