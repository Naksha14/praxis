import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isAdmin } from "@/lib/permissions";
import { computeTotals, computeExpenseSummary } from "@/lib/shared";

// GET /api/finance/payments — per-project Amount-Paid vs Expenses breakdown,
// plus dashboard-wide totals. Scoped like every other list endpoint: admin
// sees all projects, a project in-charge only their own. The "no double
// counting" requirement is satisfied by summing each project's already-final
// remaining/extraCost/savings rather than re-deriving them differently here.
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const where = isAdmin(user) ? {} : { inChargeId: user.id };
  const projects = await prisma.project.findMany({
    where,
    include: {
      inCharge: { select: { name: true } },
      payment: { select: { amount: true } },
      revenues: { select: { amount: true } },
      expenditures: { select: { amount: true } },
      labourCharges: { select: { amount: true } },
      materialCharges: { select: { amount: true } },
      transportCharges: { select: { amount: true } },
      extraCharges: { select: { amount: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const rows = projects.map((p) => {
    const totals = computeTotals(p);
    const amountPaid = p.payment ? Number(p.payment.amount) : null;
    const summary = computeExpenseSummary(amountPaid, totals.totalProjectExpenses, p.status);
    return {
      id: p.id,
      code: p.code,
      title: p.title,
      inChargeName: p.inCharge.name,
      status: p.status,
      ...summary,
    };
  });

  const totalAmountPaid = rows.reduce((a, r) => a + (r.amountPaid ?? 0), 0);
  const totalExpenses = rows.reduce((a, r) => a + r.totalExpenses, 0);
  const totalRemaining = rows.reduce((a, r) => a + (r.remaining ?? 0), 0);
  const totalExtraCost = rows.reduce((a, r) => a + r.extraCost, 0);
  const totalSavings = rows.reduce((a, r) => a + (r.savings ?? 0), 0);

  return NextResponse.json({
    rows,
    summary: { totalAmountPaid, totalExpenses, totalRemaining, totalExtraCost, totalSavings },
  });
}
