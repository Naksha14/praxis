// inspect_user_table.js — Run with: node inspect_user_table.js
// Prints the exact columns of the "User" table and every row in it
// (with the password hash partially masked), so we know exactly what to fix.
const { Client } = require("pg");

const client = new Client({ connectionString: process.env.DATABASE_URL });

(async () => {
  await client.connect();

  // List all public tables
  const tables = await client.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema='public'`
  );
  console.log("Tables in DB:", tables.rows.map((r) => r.table_name).join(", "));

  // Find the user table (case-insensitive)
  const match = tables.rows.find((r) => r.table_name.toLowerCase().includes("user"));
  if (!match) {
    console.log("\nNO user table found at all.");
    await client.end();
    return;
  }

  const cols = await client.query(
    `SELECT column_name, data_type FROM information_schema.columns WHERE table_name='${match.table_name}'`
  );
  console.log(
    `\nColumns of "${match.table_name}":`,
    cols.rows.map((r) => `${r.column_name} (${r.data_type})`).join(", ")
  );

  const users = await client.query(`SELECT * FROM "${match.table_name}"`);
  console.log(`\nRows (${users.rowCount}):`);
  for (const u of users.rows) {
    const safe = { ...u };
    for (const k of Object.keys(safe)) {
      if (k.toLowerCase().includes("password") || k.toLowerCase().includes("hash")) {
        safe[k] = String(safe[k]).slice(0, 10) + "...(masked)";
      }
    }
    console.log("  ", JSON.stringify(safe));
  }

  await client.end();
})().catch((e) => {
  console.error("ERROR:", e.message);
  process.exit(1);
});
