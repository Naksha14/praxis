export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/permissions";

// PATCH /api/account/password
// Any signed-in user can change their own password. Requires the current
// password so a hijacked session token alone can't be used to lock out
// the real owner. Never accepts a target user id — only ever "self".
export async function PATCH(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { currentPassword, newPassword } = await req.json();
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Current and new password are required." }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 400 });
  }

  const record = await prisma.user.findUnique({ where: { id: user.id } });
  if (!record) return NextResponse.json({ error: "Account not found." }, { status: 404 });

  const valid = await bcrypt.compare(currentPassword, record.passwordHash);
  if (!valid) return NextResponse.json({ error: "Current password is incorrect." }, { status: 403 });

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(newPassword, 12) },
  });
  return NextResponse.json({ ok: true });
}

