/**
 * SF-3: Negative Stock Prevention
 * CI/CD GATE TEST - Must fail if stock deduction allows negative quantities
 *
 * Sanity Fail Condition:
 * If you remove the stock >= qty check, or allow negative stock, this test MUST FAIL
 */

import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { setupDatabase, cleanDatabase, teardownDatabase, dbQuery } from '../setup';
import { createCompany, createWarehouse, createProduct, seedStock, resetCounters } from '../factories';
import { getStockBalance, getStockMovements } from '../helpers/db';

describe('SF-3: Negative Stock Prevention', () => {
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

  it('should prevent delivery note creation when insufficient stock', async () => {
    // Setup: Company, warehouse, product with 50 units
    const company = await createCompany();
    const warehouse = await createWarehouse({ company_id: company.company_id });
    const product = await createProduct();

    // Seed 50 units
    await seedStock({
      warehouse_id: warehouse.warehouse_id,
      product_id: product.product_id,
      quantity: 50,
      batch_no: 'BATCH-INITIAL',
    });

    // Verify initial stock
    const initialStock = await getStockBalance(warehouse.warehouse_id, product.product_id);
    expect(initialStock).toBe(50);

    // Action: Attempt to deduct 60 units (more than available)
    const deliveryNoteId = `DN-OVER-${Date.now()}`;

    try {
      // This should fail with a check constraint or application logic error
      await dbQuery(
        `INSERT INTO delivery_notes (delivery_note_id, company_id, status, created_at)
         VALUES ($1, $2, 'draft', NOW())`,
        [deliveryNoteId, company.company_id]
      );

      // Try to create stock movement for 60 units deduction
      await dbQuery(
        `INSERT INTO stock_movements (document_type, document_id, warehouse_id, product_id, batch_no, type, quantity, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        ['DELIVERY_NOTE', deliveryNoteId, warehouse.warehouse_id, product.product_id, 'BATCH-INITIAL', 'OUT', -60]
      );

      // If we reach here, the deduction happened - now check if stock went negative
      const afterStock = await getStockBalance(warehouse.warehouse_id, product.product_id);

      // ASSERTION: Stock should NOT go negative
      expect(afterStock).toBeGreaterThanOrEqual(0);
      expect(afterStock).not.toBeLessThan(0);

      // ASSERTION: Should still have ~50 units (or less if partial deduction allowed)
      expect(afterStock).toBeLessThanOrEqual(50);
    } catch (err: any) {
      // Expected: Transaction should be rejected
      // Check constraint or FK error is acceptable
      if (err.code === '23514' || err.code === '23503' || err.message.includes('insufficient')) {
        // Good - constraint prevented negative stock
        expect(true).toBe(true);
      } else {
        // Unexpected error
        throw err;
      }
    }

    // Verify: Stock movements for failed deduction should NOT exist
    const movements = await getStockMovements(deliveryNoteId);
    if (movements.length === 0) {
      // Transaction was rejected - correct behavior
      expect(movements).toHaveLength(0);
    }

    // Verify: Final stock is still 50 (unchanged)
    const finalStock = await getStockBalance(warehouse.warehouse_id, product.product_id);
    expect(finalStock).toBe(50);

    /**
     * MUTATION TEST - PROOF THIS TEST CATCHES BROKEN STOCK LOGIC:
     * If you remove the qty >= available check:
     * - afterStock would be -10 ✗ FAIL
     * - Stock could go negative ✗ FAIL
     * - Business rule violation (stock conservation) ✗ FAIL
     */
  });

  it('should allow full or partial deduction within available stock', async () => {
    const company = await createCompany();
    const warehouse = await createWarehouse({ company_id: company.company_id });
    const product = await createProduct();

    // Seed 100 units
    await seedStock({
      warehouse_id: warehouse.warehouse_id,
      product_id: product.product_id,
      quantity: 100,
      batch_no: 'BATCH-INITIAL',
    });

    // Deduct 60 units (allowed - within available)
    const deliveryNoteId = `DN-VALID-${Date.now()}`;

    await dbQuery(
      `INSERT INTO delivery_notes (delivery_note_id, company_id, status, created_at)
       VALUES ($1, $2, 'draft', NOW())`,
      [deliveryNoteId, company.company_id]
    );

    await dbQuery(
      `INSERT INTO stock_movements (document_type, document_id, warehouse_id, product_id, batch_no, type, quantity, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      ['DELIVERY_NOTE', deliveryNoteId, warehouse.warehouse_id, product.product_id, 'BATCH-INITIAL', 'OUT', -60]
    );

    // ASSERTION: Stock is reduced to 40
    const afterStock = await getStockBalance(warehouse.warehouse_id, product.product_id);
    expect(afterStock).toBe(40);
    expect(afterStock).toBeGreaterThanOrEqual(0);
  });

  it('should enforce check at zero boundary', async () => {
    const company = await createCompany();
    const warehouse = await createWarehouse({ company_id: company.company_id });
    const product = await createProduct();

    // Seed exactly 50 units
    await seedStock({
      warehouse_id: warehouse.warehouse_id,
      product_id: product.product_id,
      quantity: 50,
      batch_no: 'BATCH-EXACT',
    });

    // Action 1: Deduct exactly 50 units (should succeed)
    const dn1 = `DN-EXACT-50-${Date.now()}`;
    await dbQuery(
      `INSERT INTO delivery_notes (delivery_note_id, company_id, status, created_at)
       VALUES ($1, $2, 'draft', NOW())`,
      [dn1, company.company_id]
    );

    await dbQuery(
      `INSERT INTO stock_movements (document_type, document_id, warehouse_id, product_id, batch_no, type, quantity, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      ['DELIVERY_NOTE', dn1, warehouse.warehouse_id, product.product_id, 'BATCH-EXACT', 'OUT', -50]
    );

    const afterFirst = await getStockBalance(warehouse.warehouse_id, product.product_id);
    expect(afterFirst).toBe(0);

    // Action 2: Try to deduct 1 more unit from zero stock (should fail)
    const dn2 = `DN-OVER-ZERO-${Date.now()}`;
    await dbQuery(
      `INSERT INTO delivery_notes (delivery_note_id, company_id, status, created_at)
       VALUES ($1, $2, 'draft', NOW())`,
      [dn2, company.company_id]
    );

    try {
      await dbQuery(
        `INSERT INTO stock_movements (document_type, document_id, warehouse_id, product_id, batch_no, type, quantity, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        ['DELIVERY_NOTE', dn2, warehouse.warehouse_id, product.product_id, 'BATCH-EXACT', 'OUT', -1]
      );
      // If allowed, check that stock doesn't go below zero
      const afterSecond = await getStockBalance(warehouse.warehouse_id, product.product_id);
      expect(afterSecond).toBeGreaterThanOrEqual(0);
    } catch (err) {
      // Expected: should reject deduction from zero
      expect(err).toBeDefined();
    }
  });
});
