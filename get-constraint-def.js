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

async function getConstraintDef() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    console.log(
      "=== Getting constraint definition for chk_invoice_status ===\n",
    );

    const result = await pool.query(`
      SELECT pg_get_constraintdef('chk_invoice_status'::regclass) as constraint_def
    `);

    console.log("Constraint Definition:");
    console.log(result.rows[0]?.constraint_def || "NOT FOUND");
    console.log("");
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    await pool.end();
  }
}

getConstraintDef().catch(console.error);
