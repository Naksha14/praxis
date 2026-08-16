import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.upsert({
    where: { loginId: "Praxis2026" },
    update: {},
    create: {
      loginId: "Praxis2026",
      passwordHash: await bcrypt.hash("Praxis@482", 12),
      name: "Admin",
      role: "ADMIN",
    },
  });

  const incharge = await prisma.user.upsert({
    where: { loginId: "Praxis123" },
    update: {},
    create: {
      loginId: "Praxis123",
      passwordHash: await bcrypt.hash("Praxis@2026", 12),
      name: "R. Sharma",
      role: "PROJECT_INCHARGE",
    },
  });

  console.log("Seeded users:", admin.loginId, incharge.loginId);
  console.log("IMPORTANT: change these passwords after first login in production.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
