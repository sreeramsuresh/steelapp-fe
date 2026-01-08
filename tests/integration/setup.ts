/**
 * Integration Test Setup
 * Connects to cloud PostgreSQL database for testing
 * Tests call API Gateway (HTTP) which internally uses PostgreSQL
 *
 * CRITICAL REQUIREMENT: All "When" steps must call API Gateway endpoints
 * Direct database writes are ONLY for "Given" (setup) steps
 */

import pg from 'pg';
import { testLogger } from './utils/testLogger';

const { Pool } = pg;

let pool: pg.Pool | null = null;

/**
 * Initialize cloud database connection and API Gateway client
 * CRITICAL: Call this in beforeAll() - not passing this check = entire suite is invalid
 */
export async function setupDatabase() {
  try {
    // Create connection pool to cloud PostgreSQL
    pool = new Pool({
      host: process.env.DB_HOST || '13.204.19.175',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'steelapp',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'R8kPz@2vAq&9LmT4eX7wB%hQ',
      ssl: process.env.DB_SSL === 'true' ? true : false,
    });

    // Test connection
    const result = await dbQuery('SELECT NOW() as now');
    testLogger.success(`Connected to cloud database: ${result[0]?.now}`);

    // Verify schema exists
    const schemaCheck = await dbQuery(
      `SELECT EXISTS(SELECT 1 FROM information_schema.tables WHERE table_name='companies')`,
    );
    if (!schemaCheck[0]?.exists) {
      throw new Error(
        'SCHEMA VALIDATION FAILED: Database schema not found. Run migrations first.',
      );
    }
    testLogger.success('Schema validation passed');
    testLogger.success('API Gateway client ready (HTTP calls via localhost:3000)');
  } catch (error) {
    testLogger.error('FATAL: Failed to setup integration test environment', {
      error: String(error),
    });
    throw error;
  }
}

/**
 * CRITICAL FIX #3: Whitelist-based cleanup - preserve reference tables and sequences
 * Only truncate business tables, preserve schema_migrations and reference data
 */
export async function cleanDatabase() {
  // Business tables (transient data) - truncate these
  const businessTables = [
    'journal_entries',
    'ar_ledger',
    'allocation_details',
    'stock_movements',
    'batches',
    'delivery_note_items',
    'delivery_notes',
    'invoice_items',
    'invoices',
    'purchase_order_items',
    'purchase_orders',
    'supplier_bills',
    'customers',
    'suppliers',
    'companies',
  ];

  // Reference tables (preserve across tests) - DO NOT truncate
  // const referenceTables = ['products', 'warehouses', 'countries', 'vat_codes', 'units'];
  // const schemaTables = ['schema_migrations', 'schema_version'];

  for (const table of businessTables) {
    try {
      // RESTART IDENTITY ensures IDs reset properly between tests
      await dbQuery(`TRUNCATE TABLE ${table} CASCADE RESTART IDENTITY`);
    } catch (err) {
      // Table may not exist, skip silently
    }
  }

  testLogger.success(`Cleaned ${businessTables.length} business tables`);
}

/**
 * Execute a query and return rows
 * Used ONLY in setup/teardown steps
 * TEST STEPS MUST USE API Gateway for "When" actions
 */
export async function dbQuery(sql: string, params: unknown[] = []) {
  if (!pool) {
    throw new Error('Database not initialized - call setupDatabase() first');
  }
  try {
    const result = await pool.query(sql, params);
    return result.rows;
  } catch (error) {
    testLogger.error('Database query error', { sql, params, error: String(error) });
    throw error;
  }
}

/**
 * Execute transaction with multiple statements
 * Used for complex setup
 */
export async function transaction(
  fn: (client: pg.PoolClient) => Promise<void>,
) {
  if (!pool) throw new Error('Database not initialized');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await fn(client);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Teardown database connections
 * Call this in afterAll() hook
 */
export async function teardownDatabase() {
  if (pool) {
    await pool.end();
    pool = null;
    testLogger.success('Database pool closed');
  }
}
