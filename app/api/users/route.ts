export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser, isAdmin } from "@/lib/permissions";
import bcrypt from "bcryptjs";

// GET — any signed-in user can fetch the in-charge list (needed for the
// assignment dropdown); only id/name/loginId are exposed, never password hashes.
export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const users = await prisma.user.findMany({
    where: { role: "PROJECT_INCHARGE" },
    select: { id: true, name: true, loginId: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(users);
}

// POST — admin only, creates a new project in-charge account.
export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(user)) return NextResponse.json({ error: "Only an admin can create users." }, { status: 403 });

  const { loginId, password, name } = await req.json();
  if (!loginId || !password || !name) return NextResponse.json({ error: "loginId, password and name are required." }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });

  const exists = await prisma.user.findUnique({ where: { loginId } });
  if (exists) return NextResponse.json({ error: "That User ID is already taken." }, { status: 409 });

  const created = await prisma.user.create({
    data: { loginId, name, role: "PROJECT_INCHARGE", passwordHash: await bcrypt.hash(password, 12) },
    select: { id: true, name: true, loginId: true },
  });
  return NextResponse.json(created, { status: 201 });
}

