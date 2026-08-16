import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, canAccessProject } from "@/lib/permissions";

// A single generic handler for the six ledger types keeps six near-identical
// tables (revenue, expenditure, labour/material/transport/extra charges)
// from needing six near-identical route files.
const MODELS: Record<string, any> = {
  revenue: prisma.revenue,
  expenditure: prisma.expenditure,
  labour: prisma.labourCharge,
  material: prisma.materialCharge,
  transport: prisma.transportCharge,
  extra: prisma.extraCharge,
};

function getModel(type: string) {
  return MODELS[type] || null;
}

export async function POST(req: NextRequest, { params }: { params: { id: string; type: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await canAccessProject(user, params.id))) {
    return NextResponse.json({ error: "You do not have access to this project." }, { status: 403 });
  }

  const model = getModel(params.type);
  if (!model) return NextResponse.json({ error: "Unknown ledger type." }, { status: 400 });

  const { date, description, amount } = await req.json();
  if (!date || amount === undefined || amount === null || isNaN(Number(amount))) {
    return NextResponse.json({ error: "Date and a valid amount are required." }, { status: 400 });
  }

  const entry = await model.create({
    data: { projectId: params.id, date: new Date(date), description: description || "", amount: Number(amount), addedById: user.id },
    include: { addedBy: { select: { name: true } } },
  });
  return NextResponse.json(entry, { status: 201 });
}
