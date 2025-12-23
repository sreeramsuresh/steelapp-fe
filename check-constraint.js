import pg from 'pg';

const { Pool } = pg;

async function checkConstraints() {
  const pool = new Pool({
    host: process.env.DB_HOST || '13.204.19.175',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'steelapp',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'R8kPz!2vAq#9LmT4eX7wB$hQ',
    ssl: process.env.DB_SSL === 'true' ? true : false,
  });

  try {
    // Get check constraints for invoices table
    const result = await pool.query(`
      SELECT constraint_name, check_clause
      FROM information_schema.check_constraints
      WHERE table_name = 'invoices'
    `);

    console.log('\n=== CHECK CONSTRAINTS for invoices ===');
    result.rows.forEach((row) => {
      console.log(`${row.constraint_name}: ${row.check_clause}`);
    });

    // Try to find what valid status values might be
    console.log('\n=== Existing invoice status values in DB ===');
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
