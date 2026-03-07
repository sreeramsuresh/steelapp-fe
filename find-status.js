import "dotenv/config";
import pg from 'pg';

// Production safety guard
const BLOCKED_HOSTS = ["51.112.180.29", "13.204.19.175"];
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

async function findStatus() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    // Try to see what statuses exist
    const result = await pool.query(`
      SELECT DISTINCT status FROM invoices WHERE status IS NOT NULL LIMIT 20
    `);

    console.log('=== Existing status values ===');
    if (result.rows.length === 0) {
      console.log('(No existing statuses found)');
    } else {
      result.rows.forEach(row => {
        console.log(`  "${row.status}"`);
      });
    }

    // Try to create with an empty/null status to see what happens
    console.log('\n=== Trying to create invoice with NULL status ===');
    try {
      const testResult = await pool.query(`
        INSERT INTO invoices (company_id, customer_id, invoice_number, invoice_date, subtotal, total)
        VALUES (1, 1, 'TEST-001', CURRENT_DATE, 100, 105)
        RETURNING id, status
      `);
      console.log('Success! Created with status:', testResult.rows[0]?.status);
    } catch (e) {
      console.log('Failed:', (e as any).message);
    }

  } finally {
    await pool.end();
  }
}

findStatus().catch(console.error);
