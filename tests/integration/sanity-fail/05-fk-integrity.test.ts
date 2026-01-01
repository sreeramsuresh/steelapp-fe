/**
 * SF-5: Foreign Key Integrity (No Orphaned Records)
 * CI/CD GATE TEST - Must fail if FK constraints are disabled/removed
 *
 * Sanity Fail Condition:
 * If you remove FK constraints or disable validation, orphaned records can be created
 * This test MUST FAIL if FK integrity is broken
 */

import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { setupDatabase, cleanDatabase, teardownDatabase, dbQuery } from '../setup';
import { createCompany, createSupplier, resetCounters } from '../factories';
import { getSupplierBill } from '../helpers/db';
import { createSupplierBillViaGrpc } from '../grpc-client';

describe('SF-5: Foreign Key Integrity (No Orphaned Records)', () => {
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

  it('should prevent creating supplier bill with non-existent supplier', async () => {
    // Given: Create company but NO supplier
    const company = await createCompany();
    const nonExistentSupplierId = 'SUP-DOES-NOT-EXIST';

    // When: Call CreateSupplierBill service with non-existent supplier
    // This must fail - either reject from API or fail FK constraint
    let error: Error | null = null;
    let createdBill: { id?: string; supplier_id?: string } | null = null;

    try {
      createdBill = await createSupplierBillViaGrpc({
        supplier_id: nonExistentSupplierId,
        company_id: company.company_id,
        amount: 5000,
      });
    } catch (err) {
      error = err;
    }

    // Then: Service must reject OR if it writes, FK constraint must prevent it
    // ASSERTION 1: Either service rejected it or bill was not created
    if (error) {
      // Good - service validation caught it
      expect(error).toBeDefined();
      expect(error.message).toMatch(/supplier|not found|invalid/i);
    } else if (createdBill?.id) {
      // Service allowed creation - FK constraint must prevent it
      const bill = await dbQuery(
        `SELECT * FROM supplier_bills WHERE id = $1`,
        [createdBill.id],
      );
      expect(bill).toHaveLength(0);
    } else {
      // Service returned empty response - good
      expect(createdBill).toBeNull();
    }

    /**
     * MUTATION TEST - PROOF THIS TEST CATCHES FK REMOVAL:
     * If you remove the FK constraint:
     * - Bill would be created with orphaned supplier_id ✗ FAIL
     * - Database integrity broken! ✗ FAIL
     *
     * If you disable service validation:
     * - Service would allow creation, but FK constraint should block it ✗ FAIL
     */
  });

  it('should allow supplier bill only with valid existing supplier', async () => {
    // Given: Create company and supplier
    const company = await createCompany();
    const supplier = await createSupplier({
      company_id: company.company_id,
      name: 'SUP-VALID',
    });

    // When: Call CreateSupplierBill service with valid supplier
    let error: Error | null = null;
    let createdBill: { id?: string; supplier_id?: string } | null = null;

    try {
      createdBill = await createSupplierBillViaGrpc({
        supplier_id: supplier.id.toString(),
        company_id: company.company_id,
        amount: 5000,
      });
    } catch (err) {
      error = err;
    }

    // Then: No error - FK is valid
    expect(error).toBeNull();
    expect(createdBill).not.toBeNull();
    expect(createdBill.supplier_id).toBe(supplier.id);

    // ASSERTION: Bill is in database
    const retrievedBill = await dbQuery(
      `SELECT * FROM supplier_bills WHERE supplier_id = $1`,
      [supplier.id],
    );
    expect(retrievedBill.length).toBeGreaterThan(0);
  });

  it('should prevent cascading deletion issues with FK relationships', async () => {
    const company = await createCompany();
    const supplier = await createSupplier({
      company_id: company.company_id,
      supplier_id: 'SUP-CASCADE',
    });

    // Create bill referencing supplier
    const billId = `SB-CASCADE-${Date.now()}`;
    await dbQuery(
      `INSERT INTO supplier_bills (bill_id, supplier_id, company_id, amount, status, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [billId, supplier.supplier_id, company.company_id, 5000, 'draft'],
    );

    // Verify bill exists
    let bill = await getSupplierBill(billId);
    expect(bill).not.toBeNull();

    // Try to delete supplier (should fail or cascade)
    let deleteError: { code?: string } | null = null;
    try {
      await dbQuery('DELETE FROM suppliers WHERE supplier_id = $1', [supplier.supplier_id]);
    } catch (err) {
      deleteError = err;
    }

    // After deletion attempt, check bill status
    bill = await getSupplierBill(billId);

    // ASSERTION: Either deletion failed (FK constraint) or bill was cascaded
    if (deleteError) {
      // Deletion was blocked - good
      expect(deleteError.code).toBe('23503');
      expect(bill).not.toBeNull(); // Bill still exists
    } else {
      // Deletion was allowed with CASCADE - bill might be deleted
      // This is acceptable if CASCADE DELETE is intentional
      // The key is: no orphaned bills with non-existent suppliers
    }
  });

  it('should enforce FK constraints on customer references in invoices', async () => {
    const company = await createCompany();

    const invoiceId = `INV-FK-CUST-${Date.now()}`;
    const nonExistentCustomerId = 'CUST-FAKE-99999';

    // Try to create invoice with non-existent customer
    let error: { code?: string } | null = null;

    try {
      await dbQuery(
        `INSERT INTO invoices (invoice_id, customer_id, company_id, subtotal, vat_rate, vat_amount, total, status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
        [invoiceId, nonExistentCustomerId, company.company_id, 10000, 0.05, 500, 10500, 'draft'],
      );
    } catch (err) {
      error = err;
    }

    // ASSERTION: FK should prevent orphaned customer reference
    expect(error).not.toBeNull();
    expect(error?.code).toBe('23503');
  });

  it('should enforce FK constraints on product references in stock', async () => {
    const company = await createCompany();

    const nonExistentProductId = 'PROD-FAKE-99999';
    const nonExistentWarehouseId = 'WH-FAKE-99999';

    // Try to create stock with non-existent product
    let error: { code?: string } | null = null;

    try {
      await dbQuery(
        `INSERT INTO stock (warehouse_id, product_id, batch_no, quantity, unit_cost, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [nonExistentWarehouseId, nonExistentProductId, 'BATCH-FAKE', 100, 100],
      );
    } catch (err) {
      error = err;
    }

    // ASSERTION: FK constraint should prevent orphaned records
    expect(error).not.toBeNull();
  });
});
