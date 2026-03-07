import "dotenv/config";
import pg from 'pg';

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
