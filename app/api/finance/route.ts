import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isAdmin } from "@/lib/permissions";

// GET /api/finance — every revenue and expenditure row across every project
// the caller can see, flattened and tagged with its project. Scoped the
// same way /api/projects is: admins see everything, in-charges see only
// their own assignments. This is what powers the admin sidebar's
// "Finance" page (see spec §20/§11) without the client fetching every
// project individually.
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const where = isAdmin(user) ? {} : { inChargeId: user.id };

  const [revenues, expenditures] = await Promise.all([
    prisma.revenue.findMany({
      where: { project: where },
      include: { project: { select: { id: true, title: true, code: true } }, addedBy: { select: { name: true } } },
      orderBy: { date: "desc" },
    }),
    prisma.expenditure.findMany({
      where: { project: where },
      include: { project: { select: { id: true, title: true, code: true } }, addedBy: { select: { name: true } } },
      orderBy: { date: "desc" },
    }),
  ]);

  const rows = [
    ...revenues.map((r) => ({ ...r, kind: "Revenue" as const })),
    ...expenditures.map((r) => ({ ...r, kind: "Expenditure" as const })),
  ].sort((a, b) => +new Date(b.date) - +new Date(a.date));

  return NextResponse.json(rows);
}
