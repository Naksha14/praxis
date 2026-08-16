import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { prisma } from "./prisma";

export type SessionUser = { id: string; loginId: string; name: string; role: "ADMIN" | "PROJECT_INCHARGE" };

/** Returns the signed-in user, or null. Every API route must call this first. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session.user as unknown as SessionUser;
}

/**
 * Confirms the user may access a given project.
 * ADMIN can access any project. PROJECT_INCHARGE only their own assignment.
 * This is the server-side check that must never be skipped, even though the
 * UI also hides controls the user isn't permitted to use.
 */
export async function canAccessProject(user: SessionUser, projectId: string) {
  if (user.role === "ADMIN") return true;
  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { inChargeId: true } });
  return !!project && project.inChargeId === user.id;
}

export function isAdmin(user: SessionUser) {
  return user.role === "ADMIN";
}
