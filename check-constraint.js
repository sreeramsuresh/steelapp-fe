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

async function checkConstraints() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    // Get check constraints for invoices table
    const result = await pool.query(`
      SELECT constraint_name, check_clause
      FROM information_schema.check_constraints
      WHERE table_name = 'invoices'
    `);

    console.log("\n=== CHECK CONSTRAINTS for invoices ===");
    result.rows.forEach((row) => {
      console.log(`${row.constraint_name}: ${row.check_clause}`);
    });

    // Try to find what valid status values might be
    console.log("\n=== Existing invoice status values in DB ===");
    const statusResult = await pool.query(`
      SELECT DISTINCT status FROM invoices LIMIT 20
    `);

    statusResult.rows.forEach((row) => {
      console.log(`  - "${row.status}"`);
    });
  } finally {
    await pool.end();
  }
}

checkConstraints().catch(console.error);
