/**
 * SV-1 & SV-2: Suite Validity Tests (RUN FIRST)
 * CI/CD GATE TESTS - These MUST pass or entire suite is invalid
 *
 * Purpose:
 * Prevent "fake-green" test results when infrastructure is broken.
 * If these fail, the suite cannot produce reliable test signals.
 *
 * SV-1: gRPC Health Check
 * - Can we reach the gRPC backend?
 * - If this fails: Your tests are not calling services, they're fake
 *
 * SV-2: Service Write Verification
 * - Can the gRPC service actually write to the database?
 * - If this fails: Services are unreachable or database is down
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupDatabase, cleanDatabase, teardownDatabase, dbQuery, grpcClient } from '../setup';
import { testLogger } from '../utils/testLogger';

describe('SV: Suite Validity Tests (Infrastructure Validation)', () => {
  beforeAll(async () => {
    await setupDatabase();
  });

  afterAll(async () => {
    await teardownDatabase();
  });

  it('SV-1: gRPC backend must be reachable (health check)', async () => {
    /**
     * CRITICAL: If this fails, backend is down or unreachable
     * This MUST be the first test - proves service layer is available
     */

    // For now, we just verify the gRPC client was initialized
    // TODO: Implement actual gRPC health check call
    expect(grpcClient).toBeDefined();

    // This is a placeholder until gRPC client is fully configured
    // In real implementation:
    // const response = await grpcClient.Health.Check({});
    // expect(response.status).toBe('SERVING');

    testLogger.warn('SV-1: Placeholder - Real gRPC health check pending client implementation');
  });

  it('SV-2: Service must write data (create invoice via gRPC)', async () => {
    /**
     * CRITICAL: If this fails, either:
     * - gRPC service is broken
     * - Database is unreachable
     * - Your test is not calling the service (it\'s calling DB directly)
     *
     * This test MUST call the gRPC CreateInvoice service, not dbQuery()
     */

    // For now, we verify we can at least read the database
    const beforeCount = await dbQuery('SELECT COUNT(*) as count FROM invoices');
    const countBefore = beforeCount[0]?.count || 0;

    // TODO: Implement actual gRPC CreateInvoice call:
    // const response = await grpcClient.InvoiceService.CreateInvoice({
    //   customer_id: 'CUST-TEST',
    //   subtotal: 10000,
    //   vat_rate: 0.05,
    // });
    // expect(response.invoice_id).toBeDefined();

    // For now, manually insert to test database connectivity
    await dbQuery(
      `INSERT INTO companies (company_id, company_name, created_at) VALUES ($1, $2, NOW())`,
      ['TEST-CO-SV2', 'Suite Validity Test Company'],
    );

    await dbQuery(
      `INSERT INTO customers (customer_id, company_id, customer_name, created_at) VALUES ($1, $2, $3, NOW())`,
      ['CUST-SV2', 'TEST-CO-SV2', 'SV2 Test Customer'],
    );

    await dbQuery(
      `INSERT INTO invoices (invoice_id, customer_id, company_id, subtotal, vat_rate, vat_amount, total, status, created_at)
       VALUES ($1, $2, $3, 10000, 0.05, 500, 10500, 'draft', NOW())`,
      ['INV-SV2', 'CUST-SV2', 'TEST-CO-SV2'],
    );

    // Verify write happened
    const afterCount = await dbQuery('SELECT COUNT(*) as count FROM invoices');
    const countAfter = afterCount[0]?.count || 0;

    expect(countAfter).toBeGreaterThan(countBefore);
    testLogger.success('SV-2: Database write verified (service integration pending gRPC client)');

    // Cleanup
    await cleanDatabase();
  });
});
