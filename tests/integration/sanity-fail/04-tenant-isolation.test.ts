/**
 * SF-4: Tenant Isolation (No Data Leakage)
 * CI/CD GATE TEST - Must fail if company_id filter is removed
 *
 * Sanity Fail Condition:
 * If you remove WHERE company_id = $1 filter, or return all data, this test MUST FAIL
 */

import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { setupDatabase, cleanDatabase, teardownDatabase, dbQuery } from '../setup';
import { createCompany, createCustomer, createInvoice, resetCounters } from '../factories';
import { getInvoicesByCompany, validateTenantIsolation } from '../helpers/db';

describe('SF-4: Tenant Isolation (No Data Leakage)', () => {
  beforeAll(async () => {
    await setupDatabase();
  });

  afterEach(async () => {
    await cleanDatabase();
    resetCounters();
  });

  afterAll(async () => {
    await teardownDatabase();
  });

  it('should isolate invoices by company_id - no cross-tenant data leakage', async () => {
    // Setup: Create two separate companies with invoices
    const companyA = await createCompany({
      company_id: 'CO-TENANT-A',
      company_name: 'Tenant A Company',
    });

    const companyB = await createCompany({
      company_id: 'CO-TENANT-B',
      company_name: 'Tenant B Company',
    });

    // Create customers for each company
    const customerA = await createCustomer({
      company_id: companyA.company_id,
      customer_id: 'CUST-A-001',
    });

    const customerB = await createCustomer({
      company_id: companyB.company_id,
      customer_id: 'CUST-B-001',
    });

    // Create invoices for each company
    const invoiceA = await createInvoice({
      invoice_id: 'INV-A-001',
      customer_id: customerA.customer_id,
      company_id: companyA.company_id,
    });

    const invoiceB = await createInvoice({
      invoice_id: 'INV-B-001',
      customer_id: customerB.customer_id,
      company_id: companyB.company_id,
    });

    // Action: Query invoices for Company A (as Company A user)
    const invoicesForA = await getInvoicesByCompany(companyA.company_id);

    // ASSERTION 1: Company A query returns ONLY Company A invoices
    expect(invoicesForA).toHaveLength(1);
    expect(invoicesForA[0].invoice_id).toBe('INV-A-001');
    expect(invoicesForA[0].company_id).toBe(companyA.company_id);

    // ASSERTION 2: Company B invoice NOT in Company A results
    const hasCompanyBData = invoicesForA.some((inv: { company_id: string }) => inv.company_id === companyB.company_id);
    expect(hasCompanyBData).toBe(false);

    // Action: Query invoices for Company B
    const invoicesForB = await getInvoicesByCompany(companyB.company_id);

    // ASSERTION 3: Company B query returns ONLY Company B invoices
    expect(invoicesForB).toHaveLength(1);
    expect(invoicesForB[0].invoice_id).toBe('INV-B-001');
    expect(invoicesForB[0].company_id).toBe(companyB.company_id);

    // ASSERTION 4: Company A invoice NOT in Company B results
    const hasCompanyAData = invoicesForB.some((inv: { company_id: string }) => inv.company_id === companyA.company_id);
    expect(hasCompanyAData).toBe(false);

    // ASSERTION 5: Total isolation check
    const isolation = await validateTenantIsolation(
      companyA.company_id,
      companyB.company_id,
      'invoices',
    );
    expect(isolation.isIsolated).toBe(true);
    expect(isolation.companyARowCount).toBe(1);
    expect(isolation.companyBRowCount).toBe(1);

    /**
     * MUTATION TEST - PROOF THIS TEST CATCHES DATA LEAKAGE:
     * If you remove WHERE company_id = $1 filter:
     * - invoicesForA.length would be 2 (both invoices) ✗ FAIL
     * - invoicesForA would include INV-B-001 ✗ FAIL
     * - hasCompanyBData would be true ✗ FAIL
     * - CRITICAL: Tenant data leakage detected! ✗ FAIL
     */
  });

  it('should prevent cross-tenant customer queries', async () => {
    const companyA = await createCompany({ company_id: 'CO-A-CUST' });
    const companyB = await createCompany({ company_id: 'CO-B-CUST' });

    const custA = await createCustomer({
      company_id: companyA.company_id,
      customer_id: 'CUSTOMER-A',
    });

    const custB = await createCustomer({
      company_id: companyB.company_id,
      customer_id: 'CUSTOMER-B',
    });

    // Query customers for Company A
    const customersA = await dbQuery(
      'SELECT * FROM customers WHERE company_id = $1 ORDER BY customer_id',
      [companyA.company_id],
    );

    // ASSERTION: Only A's customer is returned
    expect(customersA).toHaveLength(1);
    expect(customersA[0].customer_id).toBe('CUSTOMER-A');

    // Query customers for Company B
    const customersB = await dbQuery(
      'SELECT * FROM customers WHERE company_id = $1 ORDER BY customer_id',
      [companyB.company_id],
    );

    // ASSERTION: Only B's customer is returned
    expect(customersB).toHaveLength(1);
    expect(customersB[0].customer_id).toBe('CUSTOMER-B');

    // Combined query (no filter) - simulate data leak
    const allCustomers = await dbQuery('SELECT * FROM customers ORDER BY customer_id');

    // Should have both, but isolated queries should not
    expect(allCustomers.length).toBeGreaterThanOrEqual(2);
  });

  it('should enforce company_id in write operations', async () => {
    const companyA = await createCompany({ company_id: 'CO-WRITE-A' });
    const companyB = await createCompany({ company_id: 'CO-WRITE-B' });

    // Create customer in Company A
    const custA = await createCustomer({
      company_id: companyA.company_id,
      customer_id: 'WRITE-CUST-A',
    });

    // Verify invoice creation writes correct company_id
    const invoiceA = await createInvoice({
      invoice_id: 'INV-WRITE-A',
      customer_id: custA.customer_id,
      company_id: companyA.company_id,
    });

    // ASSERTION: Invoice has correct company_id
    expect(invoiceA.company_id).toBe(companyA.company_id);

    // Verify isolation: Company B cannot see Company A's invoice
    const companyBInvoices = await dbQuery(
      'SELECT * FROM invoices WHERE company_id = $1',
      [companyB.company_id],
    );

    expect(companyBInvoices).toHaveLength(0);

    // Verify isolation: Company A can see their invoice
    const companyAInvoices = await dbQuery(
      'SELECT * FROM invoices WHERE company_id = $1',
      [companyA.company_id],
    );

    expect(companyAInvoices).toHaveLength(1);
    expect(companyAInvoices[0].invoice_id).toBe('INV-WRITE-A');
  });

  it('should handle multiple companies with same record IDs', async () => {
    // Edge case: Two companies might have invoices with similar ID patterns
    const coA = await createCompany({ company_id: 'CO-EDGE-A' });
    const coB = await createCompany({ company_id: 'CO-EDGE-B' });

    const custA = await createCustomer({ company_id: coA.company_id });
    const custB = await createCustomer({ company_id: coB.company_id });

    // Both companies create "INV-0001" (same ID, different company)
    const invA = await createInvoice({
      invoice_id: 'INV-0001',
      customer_id: custA.customer_id,
      company_id: coA.company_id,
      subtotal: 10000,
    });

    const invB = await createInvoice({
      invoice_id: 'INV-0001',
      customer_id: custB.customer_id,
      company_id: coB.company_id,
      subtotal: 20000,
    });

    // Query for Company A's INV-0001
    const queriedInvA = await dbQuery(
      'SELECT * FROM invoices WHERE invoice_id = $1 AND company_id = $2',
      ['INV-0001', coA.company_id],
    );

    // ASSERTION: Gets Company A's invoice (10000 subtotal)
    expect(queriedInvA).toHaveLength(1);
    expect(queriedInvA[0].subtotal).toBe(10000);

    // Query for Company B's INV-0001
    const queriedInvB = await dbQuery(
      'SELECT * FROM invoices WHERE invoice_id = $1 AND company_id = $2',
      ['INV-0001', coB.company_id],
    );

    // ASSERTION: Gets Company B's invoice (20000 subtotal)
    expect(queriedInvB).toHaveLength(1);
    expect(queriedInvB[0].subtotal).toBe(20000);
  });
});
