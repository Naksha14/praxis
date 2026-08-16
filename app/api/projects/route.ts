import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isAdmin } from "@/lib/permissions";
import { computeTotals, computeExpenseSummary } from "@/lib/shared";

const includeAll = {
  inCharge: { select: { id: true, name: true, loginId: true } },
  documents: { select: { id: true } },
  media: { select: { id: true, kind: true } },
  revenues: { select: { amount: true } },
  expenditures: { select: { amount: true } },
  labourCharges: { select: { amount: true } },
  materialCharges: { select: { amount: true } },
  transportCharges: { select: { amount: true } },
  extraCharges: { select: { amount: true } },
  payment: { select: { amount: true } },
} as const;

function toCard(p: any) {
  const totals = computeTotals(p);
  const amountPaid = p.payment ? Number(p.payment.amount) : null;
  const expenseSummary = computeExpenseSummary(amountPaid, totals.totalProjectExpenses, p.status);
  return {
    id: p.id,
    code: p.code,
    title: p.title,
    client: p.client,
    date: p.date,
    status: p.status,
    inChargeId: p.inChargeId,
    inChargeName: p.inCharge.name,
    docsCount: p.documents.length,
    photosCount: p.media.filter((m: any) => m.kind === "photo").length,
    videosCount: p.media.filter((m: any) => m.kind === "video").length,
    ...totals,
    expenseSummary,
  };
}

// GET /api/projects — list projects visible to the signed-in user
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const where = isAdmin(user) ? {} : { inChargeId: user.id };
  const projects = await prisma.project.findMany({ where, include: includeAll, orderBy: { createdAt: "desc" } });
  return NextResponse.json(projects.map(toCard));
}

// POST /api/projects — admin only
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(user)) return NextResponse.json({ error: "Only an admin can create projects." }, { status: 403 });

  const body = await req.json();
  const { title, client, inChargeId, date } = body || {};
  if (!title?.trim() || !client?.trim() || !inChargeId || !date) {
    return NextResponse.json({ error: "Title, client, in-charge and date are required." }, { status: 400 });
  }

  const inCharge = await prisma.user.findUnique({ where: { id: inChargeId } });
  if (!inCharge || inCharge.role !== "PROJECT_INCHARGE") {
    return NextResponse.json({ error: "Selected user is not a valid project in-charge." }, { status: 400 });
  }

  const code = "PRJ-" + Math.floor(1000 + Math.random() * 9000);
  const project = await prisma.project.create({
    data: { code, title: title.trim(), client: client.trim(), inChargeId, date: new Date(date) },
    include: includeAll,
  });
  return NextResponse.json(toCard(project), { status: 201 });
}
