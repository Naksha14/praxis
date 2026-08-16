export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isAdmin, canAccessProject } from "@/lib/permissions";
import { computeTotals } from "@/lib/shared";
import { deleteFile } from "@/lib/storage";

const includeAll = {
  inCharge: { select: { id: true, name: true, loginId: true } },
  documents: { include: { uploadedBy: { select: { name: true } } }, orderBy: { createdAt: "desc" as const } },
  media: { include: { uploadedBy: { select: { name: true } } }, orderBy: { createdAt: "desc" as const } },
  revenues: { include: { addedBy: { select: { name: true } } }, orderBy: { date: "desc" as const } },
  expenditures: { include: { addedBy: { select: { name: true } } }, orderBy: { date: "desc" as const } },
  labourCharges: { include: { addedBy: { select: { name: true } } }, orderBy: { date: "desc" as const } },
  materialCharges: { include: { addedBy: { select: { name: true } } }, orderBy: { date: "desc" as const } },
  transportCharges: { include: { addedBy: { select: { name: true } } }, orderBy: { date: "desc" as const } },
  extraCharges: { include: { addedBy: { select: { name: true } } }, orderBy: { date: "desc" as const } },
  payment: { include: { recordedBy: { select: { name: true } } } },
  paymentHistory: { include: { performedBy: { select: { name: true } } }, orderBy: { createdAt: "desc" as const }, take: 20 },
};

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await canAccessProject(user, params.id))) {
    return NextResponse.json({ error: "You do not have access to this project." }, { status: 403 });
  }

  const project = await prisma.project.findUnique({ where: { id: params.id }, include: includeAll });
  if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });

  return NextResponse.json({ ...project, totals: computeTotals(project) });
}

// PATCH — admin can edit anything including in-charge reassignment.
// A project in-charge may edit title/client/date on their own project,
// but may NOT reassign the in-charge — enforced here, not just hidden in the UI.
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!(await canAccessProject(user, params.id))) {
    return NextResponse.json({ error: "You do not have access to this project." }, { status: 403 });
  }

  const body = await req.json();
  const data: any = {};
  if (typeof body.title === "string" && body.title.trim()) data.title = body.title.trim();
  if (typeof body.client === "string" && body.client.trim()) data.client = body.client.trim();
  if (body.date) data.date = new Date(body.date);
  if (typeof body.status === "string" && ["active", "completed"].includes(body.status)) data.status = body.status;

  if (body.inChargeId) {
    if (!isAdmin(user)) {
      return NextResponse.json({ error: "Only an admin can reassign the project in-charge." }, { status: 403 });
    }
    const inCharge = await prisma.user.findUnique({ where: { id: body.inChargeId } });
    if (!inCharge || inCharge.role !== "PROJECT_INCHARGE") {
      return NextResponse.json({ error: "Selected user is not a valid project in-charge." }, { status: 400 });
    }
    data.inChargeId = body.inChargeId;
  }

  const project = await prisma.project.update({ where: { id: params.id }, data, include: includeAll });
  return NextResponse.json({ ...project, totals: computeTotals(project) });
}

// DELETE — admin only. Cleans up storage objects before removing DB rows.
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(user)) return NextResponse.json({ error: "Only an admin can delete a project." }, { status: 403 });

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: { documents: true, media: true },
  });
  if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });

  // Best-effort cleanup of object storage; DB cascade handles the relational rows.
  await Promise.allSettled([
    ...project.documents.map((d) => deleteFile(d.fileKey)),
    ...project.media.map((m) => deleteFile(m.fileKey)),
  ]);

  await prisma.project.delete({ where: { id: params.id } }); // onDelete: Cascade removes all child records
  return NextResponse.json({ ok: true });
}
