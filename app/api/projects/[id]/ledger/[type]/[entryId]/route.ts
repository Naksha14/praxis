import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, canAccessProject } from "@/lib/permissions";

const MODELS: Record<string, any> = {
  revenue: prisma.revenue,
  expenditure: prisma.expenditure,
  labour: prisma.labourCharge,
  material: prisma.materialCharge,
  transport: prisma.transportCharge,
  extra: prisma.extraCharge,
};

// Both ADMIN and the assigned PROJECT_INCHARGE have full CRUD on finance and
// charge entries per spec — the access boundary here is project membership,
// not per-row ownership (unlike documents/media, which restrict deletion
// to the uploader for non-admins).
export async function PATCH(req: NextRequest, { params }: { params: { id: string; type: string; entryId: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await canAccessProject(user, params.id))) {
    return NextResponse.json({ error: "You do not have access to this project." }, { status: 403 });
  }
  const model = MODELS[params.type];
  if (!model) return NextResponse.json({ error: "Unknown ledger type." }, { status: 400 });

  const existing = await model.findUnique({ where: { id: params.entryId } });
  if (!existing || existing.projectId !== params.id) return NextResponse.json({ error: "Entry not found." }, { status: 404 });

  const body = await req.json();
  const data: any = {};
  if (body.date) data.date = new Date(body.date);
  if (typeof body.description === "string") data.description = body.description;
  if (body.amount !== undefined) {
    if (isNaN(Number(body.amount))) return NextResponse.json({ error: "Invalid amount." }, { status: 400 });
    data.amount = Number(body.amount);
  }

  const updated = await model.update({ where: { id: params.entryId }, data, include: { addedBy: { select: { name: true } } } });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string; type: string; entryId: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await canAccessProject(user, params.id))) {
    return NextResponse.json({ error: "You do not have access to this project." }, { status: 403 });
  }
  const model = MODELS[params.type];
  if (!model) return NextResponse.json({ error: "Unknown ledger type." }, { status: 400 });

  const existing = await model.findUnique({ where: { id: params.entryId } });
  if (!existing || existing.projectId !== params.id) return NextResponse.json({ error: "Entry not found." }, { status: 404 });

  await model.delete({ where: { id: params.entryId } });
  return NextResponse.json({ ok: true });
}
