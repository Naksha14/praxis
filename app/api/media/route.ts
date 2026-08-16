import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isAdmin } from "@/lib/permissions";

// GET /api/media — every photo/video across every project the caller
// can see, tagged with its project. Powers the "Media" sidebar page.
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const where = isAdmin(user) ? {} : { inChargeId: user.id };
  const media = await prisma.media.findMany({
    where: { project: where },
    include: { project: { select: { id: true, title: true, code: true } }, uploadedBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(media);
}
