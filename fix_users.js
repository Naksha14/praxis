// fix_users.js — Run with: node fix_users.js
// Updates the existing user rows in place with fresh password hashes.
// (No DELETE, so foreign-key constraints from ProjectPayment etc. are never violated.)
const { Client } = require("pg");
const bcrypt = require("bcryptjs");

const client = new Client({ connectionString: process.env.DATABASE_URL });

const USERS = [
  { loginId: "Praxis2026", name: "Admin", role: "ADMIN", password: "Praxis@482" },
  { loginId: "Praxis123", name: "R. Sharma", role: "PROJECT_INCHARGE", password: "Praxis@2026" },
];

async function main() {
  await client.connect();
  for (const u of USERS) {
    const hash = await bcrypt.hash(u.password, 10);
    const result = await client.query(
      `UPDATE "User"
       SET "passwordHash" = $1, "name" = $2, "role" = $3::text::"Role"
       WHERE "loginId" = $4`,
      [hash, u.name, u.role, u.loginId]
    );
    if (result.rowCount === 0) {
      await client.query(
        `INSERT INTO "User" ("id", "loginId", "passwordHash", "name", "role", "createdAt")
         VALUES ($1, $2, $3, $4, $5::text::"Role", NOW())`,
        [`cuid_${u.loginId}`, u.loginId, hash, u.name, u.role]
      );
      console.log(`✔  ${u.loginId} (${u.role}) — created with password "${u.password}"`);
    } else {
      console.log(`✔  ${u.loginId} (${u.role}) — password reset to "${u.password}"`);
    }
  }
  console.log("");
  console.log("Done. Log in with:");
  console.log("  Admin:        ID: Praxis2026   Password: Praxis@482");
  console.log("  In-Charge:    ID: Praxis123    Password: Praxis@2026");
  await client.end();
}

main().catch(async (e) => {
  console.error("ERROR:", e.message);
  await client.end();
  process.exit(1);
});
