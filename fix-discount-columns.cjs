const { Pool } = require('pg');

const pool = new Pool({ 
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432, 
  database: process.env.DB_NAME || 'steelapp',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password'
});

(async () => {
  try {
    // Add missing columns if they don't exist
    await pool.query('ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS discount DECIMAL(12,2) DEFAULT 0');
    await pool.query('ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS discount_type VARCHAR(10) DEFAULT \'amount\'');
    console.log('✅ Added discount columns successfully');
    
    // Verify columns exist
    const result = await pool.query(`
      SELECT column_name, data_type, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'invoice_items' 
      AND column_name IN ('discount', 'discount_type')
      ORDER BY column_name
    `);
    
    console.log('✅ Verified columns:', result.rows);
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await pool.end();
  }
})();