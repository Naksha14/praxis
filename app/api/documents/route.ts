import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isAdmin } from "@/lib/permissions";

// GET /api/documents — every document across every project the caller
// can see, tagged with its project. Powers the "Documents" sidebar page.
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const where = isAdmin(user) ? {} : { inChargeId: user.id };
  const documents = await prisma.document.findMany({
    where: { project: where },
    include: { project: { select: { id: true, title: true, code: true } }, uploadedBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(documents);
}
