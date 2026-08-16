import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isAdmin, canAccessProject } from "@/lib/permissions";

// POST /api/projects/:id/payment — create or update the Admin-paid amount.
// ADMIN ONLY. This is the real security boundary for the whole "Amount Paid
// by Admin" feature — the UI also hides the input for a Project In-Charge,
// but a direct API call from a non-admin session is rejected here regardless.
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(user)) {
    return NextResponse.json({ error: "Only an admin can add or edit the amount paid to a project in-charge." }, { status: 403 });
  }
  const project = await prisma.project.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });

  const { amount } = await req.json();
  if (amount === undefined || amount === null || isNaN(Number(amount)) || Number(amount) < 0) {
    return NextResponse.json({ error: "Enter a valid, non-negative amount." }, { status: 400 });
  }
  const newAmount = Number(amount);

  const existing = await prisma.projectPayment.findUnique({ where: { projectId: params.id } });

  const [payment] = await prisma.$transaction([
    prisma.projectPayment.upsert({
      where: { projectId: params.id },
      update: { amount: newAmount, recordedById: user.id },
      create: { projectId: params.id, amount: newAmount, recordedById: user.id },
      include: { recordedBy: { select: { name: true } } },
    }),
    prisma.paymentHistoryEntry.create({
      data: {
        projectId: params.id,
        action: existing ? "edited" : "added",
        previousAmount: existing ? existing.amount : null,
        newAmount,
        performedById: user.id,
      },
    }),
  ]);

  return NextResponse.json(payment, { status: existing ? 200 : 201 });
}

// DELETE /api/projects/:id/payment — ADMIN ONLY. Removes the amount entirely
// (goes back to "Not Added"), never silently replaces it with ₹0.
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(user)) {
    return NextResponse.json({ error: "Only an admin can remove the amount paid to a project in-charge." }, { status: 403 });
  }
  if (!(await canAccessProject(user, params.id))) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const existing = await prisma.projectPayment.findUnique({ where: { projectId: params.id } });
  if (!existing) return NextResponse.json({ error: "No amount has been added yet." }, { status: 404 });

  await prisma.$transaction([
    prisma.projectPayment.delete({ where: { projectId: params.id } }),
    prisma.paymentHistoryEntry.create({
      data: { projectId: params.id, action: "deleted", previousAmount: existing.amount, newAmount: null, performedById: user.id },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
