import "dotenv/config";
import pg from "pg";

// Production safety guard
const BLOCKED_HOSTS = ["51.112.180.29", "13.204.19.175", "158.252.233.114"];
const BLOCKED_DB_NAMES = ["steelapp", "steelapp_prod", "ultimate_steel"];
if (process.env.DATABASE_URL) {
  try {
    const u = new URL(process.env.DATABASE_URL);
    if (BLOCKED_HOSTS.includes(u.hostname) || BLOCKED_DB_NAMES.includes(u.pathname.slice(1))) {
      console.error(`BLOCKED: This script cannot run against production (${u.hostname}${u.pathname})`);
      process.exit(1);
    }
  } catch (_e) { /* malformed URL — allow, will fail on connect */ }
}

const { Pool } = pg;

async function inspectSchema() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const tables = [
      "invoices",
      "companies",
      "customers",
      "products",
      "warehouses",
      "stock",
      "vendors_bills",
      "suppliers",
      "delivery_notes",
    ];

    for (const table of tables) {
      try {
        const result = await pool.query(
          `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_schema = 'public' AND table_name = $1
          ORDER BY ordinal_position
        `,
          [table],
        );

        if (result.rows.length > 0) {
          console.log(`\n=== TABLE: ${table} ===`);
          console.log(
            result.rows
              .map(
                (r) =>
                  `  ${r.column_name} (${r.data_type}, nullable=${r.is_nullable})`,
              )
              .join("\n"),
          );
        }
      } catch (e) {
        console.log(`\nTable ${table} not found or error: ${e.message}`);
      }
    }
  } finally {
    await pool.end();
  }
}

inspectSchema().catch(console.error);
