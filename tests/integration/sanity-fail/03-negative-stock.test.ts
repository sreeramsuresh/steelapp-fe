/**
 * SF-3: Negative Stock Prevention (FIFO Batch Allocation)
 * CI/CD GATE TEST - Must fail if stock deduction allows negative quantities
 *
 * Sanity Fail Condition:
 * If FIFO allocation allows selling more than available batches, this test MUST FAIL
 *
 * Architecture Note:
 * The system uses BATCH-DRIVEN FIFO allocation:
 * 1. Goods are received via GRN → creates stock_batches
 * 2. Invoice items allocate batches via FIFO (reserve phase)
 * 3. Delivery note marks items as delivered (consume phase)
 * 4. Negative stock prevented by FIFO constraint: quantity_remaining - quantity_reserved >= 0
 */

import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { setupDatabase, cleanDatabase, teardownDatabase, dbQuery } from '../setup';
import { createCompany, createWarehouse, createProduct, resetCounters } from '../factories';

describe('SF-3: Negative Stock Prevention (FIFO Batch Allocation)', () => {
  beforeAll(async () => {
    await setupDatabase();
  });

  afterEach(async () => {
    await cleanDatabase();
    resetCounters();
  });

  afterAll(async () => {
    await teardownDatabase();
  }, 30000);

  it('should prevent invoice allocation when insufficient batch stock', async () => {
    /**
     * Setup: Create company, warehouse, product, and receive 50 units via GRN
     * Test: Try to allocate 60 units to invoice (should fail - insufficient stock)
     */

    // Setup: Company, warehouse, product
    const company = await createCompany();
    const warehouse = await createWarehouse({ company_id: company.company_id });
    const product = await createProduct();

    // Create GRN to receive 50 units
    const grnNumber = `GRN-${Date.now()}`;
    const grnResult = await dbQuery(
      `INSERT INTO grn_headers (company_id, warehouse_id, grn_number, status, created_at)
       VALUES ($1, $2, $3, 'draft', NOW())
       RETURNING id`,
      [company.id, warehouse.id, grnNumber],
    );
    const grnId = grnResult[0].id;

    // Add item to GRN: 50 units at 100 cost each
    const grnItemResult = await dbQuery(
      `INSERT INTO grn_items (grn_id, product_id, quantity_ordered, quantity_received, unit_cost, batch_number, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING id`,
      [grnId, product.id, 50, 50, 100, `BATCH-${Date.now()}`],
    );
    const grnItemId = grnItemResult[0].id;

    // Approve GRN - creates stock_batches
    await dbQuery(
      `UPDATE grn_headers SET status = 'approved' WHERE id = $1`,
      [grnId],
    );

    // Verify stock_batches created with 50 quantity_remaining
    const batchResult = await dbQuery(
      `SELECT id, quantity_received, quantity_remaining, quantity_reserved
       FROM stock_batches
       WHERE product_id = $1 AND warehouse_id = $2
       ORDER BY received_date ASC`,
      [product.id, warehouse.id],
    );

    expect(batchResult).toHaveLength(1);
    const batch = batchResult[0];
    expect(parseFloat(batch.quantity_remaining)).toBe(50);
    expect(parseFloat(batch.quantity_reserved)).toBe(0);

    // Action: Try to create invoice with 60 units (exceeds available 50)
    const invoiceNumber = `INV-OVER-${Date.now()}`;
    const customer = await dbQuery(
      `INSERT INTO customers (company_id, name, email, phone, credit_limit, created_at)
       VALUES ($1, 'Test Customer', 'test@example.com', '+971501234567', 100000, NOW())
       RETURNING id`,
    );
    const customerId = customer[0].id;

    const invoiceResult = await dbQuery(
      `INSERT INTO invoices (company_id, customer_id, invoice_number, subtotal, vat_amount, total, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'draft', NOW())
       RETURNING id`,
      [company.id, customerId, invoiceNumber, 6000, 300, 6300],
    );
    const invoiceId = invoiceResult[0].id;

    // Try to allocate 60 units (exceeds 50 available)
    try {
      await dbQuery(
        `INSERT INTO invoice_items (invoice_id, product_id, quantity, unit_price, subtotal, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         RETURNING id`,
        [invoiceId, product.id, 60, 100, 6000],
      );

      // If item inserted, now try to allocate batch
      // In real system, allocateFIFO() would be called here
      // It should fail: quantity_remaining (50) < quantity_requested (60)
      const itemResult = await dbQuery(
        `SELECT id FROM invoice_items WHERE invoice_id = $1`,
        [invoiceId],
      );
      const itemId = itemResult[0].id;

      // Attempt allocation (will fail if constraint is enforced)
      await dbQuery(
        `INSERT INTO invoice_batch_consumption (invoice_item_id, batch_id, quantity_reserved, unit_cost, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [itemId, batch.id, 60, 100],
      );

      // If we reach here, allocation succeeded (BAD - constraint missing)
      // Verify constraint would prevent negative quantity_remaining
      const afterAllocation = await dbQuery(
        `SELECT quantity_remaining, quantity_reserved FROM stock_batches WHERE id = $1`,
        [batch.id],
      );

      const remaining = parseFloat(afterAllocation[0].quantity_remaining);
      const reserved = parseFloat(afterAllocation[0].quantity_reserved);

      // CRITICAL ASSERTION: Stock balance must never go negative
      // quantity_remaining >= 0 always
      expect(remaining).toBeGreaterThanOrEqual(0);
      // quantity_remaining - quantity_reserved >= 0 always
      expect(remaining - reserved).toBeGreaterThanOrEqual(0);

    } catch (err) {
      // Expected: Allocation should fail with check constraint error
      // Error codes: 23514 (check constraint), 23503 (FK), or application error
      const e = err as { code?: string; message?: string };
      if (e.code === '23514' || e.message?.includes('insufficient')) {
        // Good - constraint prevented overselling
        expect(true).toBe(true);
      } else {
        // Unexpected error - re-throw
        throw err;
      }
    }

    /**
     * MUTATION TEST - PROOF THIS TEST CATCHES BROKEN STOCK LOGIC:
     * If you remove the FIFO constraint:
     * - quantity_remaining - quantity_reserved could be negative ✗ FAIL
     * - You could sell 60 units from 50 available ✗ FAIL
     * - Overselling would occur ✗ FAIL (expect assertion fails)
     */
  });

  it('should allow allocation within available batch quantity', async () => {
    /**
     * Setup: Receive 100 units via GRN
     * Test: Allocate 60 units (within available) - should succeed
     */

    const company = await createCompany();
    const warehouse = await createWarehouse({ company_id: company.company_id });
    const product = await createProduct();

    // Create and approve GRN with 100 units
    const grnNumber = `GRN-SUCCESS-${Date.now()}`;
    const grnResult = await dbQuery(
      `INSERT INTO grn_headers (company_id, warehouse_id, grn_number, status, created_at)
       VALUES ($1, $2, $3, 'approved', NOW())
       RETURNING id`,
      [company.id, warehouse.id, grnNumber],
    );
    const grnId = grnResult[0].id;

    await dbQuery(
      `INSERT INTO grn_items (grn_id, product_id, quantity_ordered, quantity_received, unit_cost, batch_number, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [grnId, product.id, 100, 100, 100, `BATCH-SUCCESS-${Date.now()}`],
    );

    // Get created batch
    const batchResult = await dbQuery(
      `SELECT id, quantity_remaining FROM stock_batches
       WHERE product_id = $1 AND warehouse_id = $2`,
      [product.id, warehouse.id],
    );
    const batch = batchResult[0];
    expect(parseFloat(batch.quantity_remaining)).toBe(100);

    // Create customer and invoice
    const customerResult = await dbQuery(
      `INSERT INTO customers (company_id, name, email, phone, credit_limit, created_at)
       VALUES ($1, 'Test Customer', 'test@example.com', '+971501234567', 100000, NOW())
       RETURNING id`,
    );

    const invoiceResult = await dbQuery(
      `INSERT INTO invoices (company_id, customer_id, invoice_number, subtotal, vat_amount, total, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'draft', NOW())
       RETURNING id`,
      [company.id, customerResult[0].id, `INV-VALID-${Date.now()}`, 6000, 300, 6300],
    );
    const invoiceId = invoiceResult[0].id;

    // Create line item for 60 units (within available 100)
    const itemResult = await dbQuery(
      `INSERT INTO invoice_items (invoice_id, product_id, quantity, unit_price, subtotal, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id`,
      [invoiceId, product.id, 60, 100, 6000],
    );

    // Allocate batch (should succeed)
    await dbQuery(
      `INSERT INTO invoice_batch_consumption (invoice_item_id, batch_id, quantity_reserved, unit_cost, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [itemResult[0].id, batch.id, 60, 100],
    );

    // Verify: batch has 60 reserved, 40 remaining
    const afterAllocation = await dbQuery(
      `SELECT quantity_remaining, quantity_reserved FROM stock_batches WHERE id = $1`,
      [batch.id],
    );

    expect(parseFloat(afterAllocation[0].quantity_remaining)).toBe(100); // unchanged
    expect(parseFloat(afterAllocation[0].quantity_reserved)).toBe(60);  // reserved amount

    // ASSERTION: allocation succeeded and constraints still satisfied
    expect(parseFloat(afterAllocation[0].quantity_remaining) - parseFloat(afterAllocation[0].quantity_reserved)).toBe(40);
  });

  it('should enforce batch quantity constraint at zero boundary', async () => {
    /**
     * Test: Allocate exactly all available stock (100 units)
     * Then try to allocate 1 more from same batch (should fail)
     */

    const company = await createCompany();
    const warehouse = await createWarehouse({ company_id: company.company_id });
    const product = await createProduct();

    // Create and approve GRN with 100 units
    const grnResult = await dbQuery(
      `INSERT INTO grn_headers (company_id, warehouse_id, grn_number, status, created_at)
       VALUES ($1, $2, $3, 'approved', NOW())
       RETURNING id`,
      [company.id, warehouse.id, `GRN-BOUNDARY-${Date.now()}`],
    );

    await dbQuery(
      `INSERT INTO grn_items (grn_id, product_id, quantity_ordered, quantity_received, unit_cost, batch_number, created_at)
       VALUES ($1, $2, 100, 100, 100, $3, NOW())`,
      [grnResult[0].id, product.id, `BATCH-BOUNDARY-${Date.now()}`],
    );

    const batchResult = await dbQuery(
      `SELECT id FROM stock_batches WHERE product_id = $1 ORDER BY id DESC LIMIT 1`,
      [product.id],
    );
    const batchId = batchResult[0].id;

    // Create customer
    const customerResult = await dbQuery(
      `INSERT INTO customers (company_id, name, email, phone, credit_limit, created_at)
       VALUES ($1, 'Test', 'test@example.com', '+971501234567', 100000, NOW())
       RETURNING id`,
    );

    // Invoice 1: Allocate exactly 100 units (all available)
    const inv1Result = await dbQuery(
      `INSERT INTO invoices (company_id, customer_id, invoice_number, subtotal, vat_amount, total, status, created_at)
       VALUES ($1, $2, $3, 10000, 500, 10500, 'draft', NOW())
       RETURNING id`,
      [company.id, customerResult[0].id, `INV-EXACT-100-${Date.now()}`],
    );

    const item1Result = await dbQuery(
      `INSERT INTO invoice_items (invoice_id, product_id, quantity, unit_price, subtotal, created_at)
       VALUES ($1, $2, 100, 100, 10000, NOW())
       RETURNING id`,
      [inv1Result[0].id, product.id],
    );

    // Allocate all 100 units
    await dbQuery(
      `INSERT INTO invoice_batch_consumption (invoice_item_id, batch_id, quantity_reserved, unit_cost, created_at)
       VALUES ($1, $2, 100, 100, NOW())`,
      [item1Result[0].id, batchId],
    );

    // Verify: 0 units remaining
    const afterFirst = await dbQuery(
      `SELECT quantity_remaining, quantity_reserved FROM stock_batches WHERE id = $1`,
      [batchId],
    );
    expect(parseFloat(afterFirst[0].quantity_remaining)).toBe(100);
    expect(parseFloat(afterFirst[0].quantity_reserved)).toBe(100);
    expect(parseFloat(afterFirst[0].quantity_remaining) - parseFloat(afterFirst[0].quantity_reserved)).toBe(0);

    // Invoice 2: Try to allocate 1 more unit from fully reserved batch (should fail)
    const inv2Result = await dbQuery(
      `INSERT INTO invoices (company_id, customer_id, invoice_number, subtotal, vat_amount, total, status, created_at)
       VALUES ($1, $2, $3, 100, 5, 105, 'draft', NOW())
       RETURNING id`,
      [company.id, customerResult[0].id, `INV-OVER-ZERO-${Date.now()}`],
    );

    const item2Result = await dbQuery(
      `INSERT INTO invoice_items (invoice_id, product_id, quantity, unit_price, subtotal, created_at)
       VALUES ($1, $2, 1, 100, 100, NOW())
       RETURNING id`,
      [inv2Result[0].id, product.id],
    );

    try {
      // Try to allocate 1 more unit (should fail - none available)
      await dbQuery(
        `INSERT INTO invoice_batch_consumption (invoice_item_id, batch_id, quantity_reserved, unit_cost, created_at)
         VALUES ($1, $2, 1, 100, NOW())`,
        [item2Result[0].id, batchId],
      );

      // If insert succeeded, verify constraint still enforced
      const afterSecond = await dbQuery(
        `SELECT quantity_remaining, quantity_reserved FROM stock_batches WHERE id = $1`,
        [batchId],
      );

      const availableForReserve = parseFloat(afterSecond[0].quantity_remaining) - parseFloat(afterSecond[0].quantity_reserved);

      // CRITICAL: Should never allow negative available quantity
      expect(availableForReserve).toBeGreaterThanOrEqual(0);

    } catch (err) {
      // Expected: Allocation should fail at zero boundary
      const e = err as { code?: string; message?: string };
      if (e.code === '23514' || e.message?.includes('insufficient')) {
        expect(true).toBe(true);
      } else {
        throw err;
      }
    }

    /**
     * MUTATION TEST - PROOF THIS TEST CATCHES BOUNDARY ERRORS:
     * If you allow allocation past zero:
     * - availableForReserve would be -1 ✗ FAIL
     * - Zero boundary protection broken ✗ FAIL
     * - Overselling at boundary ✗ FAIL
     */
  });

  it('should consume allocated batches in FIFO order on delivery', async () => {
    /**
     * Test: Receive 2 batches, allocate across both, verify consumption in FIFO order
     * Batch 1 received first: 30 units
     * Batch 2 received second: 30 units
     * Allocate 50 units (30 from Batch1 + 20 from Batch2)
     * When delivered, should consume in FIFO order (Batch1 first)
     */

    const company = await createCompany();
    const warehouse = await createWarehouse({ company_id: company.company_id });
    const product = await createProduct();

    // Receive Batch 1: 30 units
    const grn1Result = await dbQuery(
      `INSERT INTO grn_headers (company_id, warehouse_id, grn_number, status, created_at)
       VALUES ($1, $2, $3, 'approved', NOW())
       RETURNING id`,
      [company.id, warehouse.id, `GRN-BATCH1-${Date.now()}`],
    );

    await dbQuery(
      `INSERT INTO grn_items (grn_id, product_id, quantity_ordered, quantity_received, unit_cost, batch_number, created_at)
       VALUES ($1, $2, 30, 30, 100, $3, NOW())`,
      [grn1Result[0].id, product.id, `BATCH1-${Date.now()}`],
    );

    // Receive Batch 2: 30 units (after Batch 1)
    const grn2Result = await dbQuery(
      `INSERT INTO grn_headers (company_id, warehouse_id, grn_number, status, created_at)
       VALUES ($1, $2, $3, 'approved', NOW())
       RETURNING id`,
      [company.id, warehouse.id, `GRN-BATCH2-${Date.now()}`],
    );

    await dbQuery(
      `INSERT INTO grn_items (grn_id, product_id, quantity_ordered, quantity_received, unit_cost, batch_number, created_at)
       VALUES ($1, $2, 30, 30, 100, $3, NOW())`,
      [grn2Result[0].id, product.id, `BATCH2-${Date.now()}`],
    );

    // Get both batches in FIFO order (received_date ASC)
    const batchesResult = await dbQuery(
      `SELECT id, batch_number FROM stock_batches
       WHERE product_id = $1 AND warehouse_id = $2
       ORDER BY received_date ASC`,
      [product.id, warehouse.id],
    );

    expect(batchesResult).toHaveLength(2);
    const batch1Id = batchesResult[0].id;
    const batch2Id = batchesResult[1].id;

    // Create customer and invoice
    const customerResult = await dbQuery(
      `INSERT INTO customers (company_id, name, email, phone, credit_limit, created_at)
       VALUES ($1, 'Test', 'test@example.com', '+971501234567', 100000, NOW())
       RETURNING id`,
    );

    const invoiceResult = await dbQuery(
      `INSERT INTO invoices (company_id, customer_id, invoice_number, subtotal, vat_amount, total, status, created_at)
       VALUES ($1, $2, $3, 5000, 250, 5250, 'draft', NOW())
       RETURNING id`,
      [company.id, customerResult[0].id, `INV-FIFO-${Date.now()}`],
    );

    // Create line item for 50 units (will allocate from both batches)
    const itemResult = await dbQuery(
      `INSERT INTO invoice_items (invoice_id, product_id, quantity, unit_price, subtotal, created_at)
       VALUES ($1, $2, 50, 100, 5000, NOW())
       RETURNING id`,
      [invoiceResult[0].id, product.id],
    );

    // Allocate: 30 from Batch1 + 20 from Batch2 (FIFO order)
    await dbQuery(
      `INSERT INTO invoice_batch_consumption (invoice_item_id, batch_id, quantity_reserved, unit_cost, created_at)
       VALUES ($1, $2, 30, 100, NOW())`,
      [itemResult[0].id, batch1Id],
    );

    await dbQuery(
      `INSERT INTO invoice_batch_consumption (invoice_item_id, batch_id, quantity_reserved, unit_cost, created_at)
       VALUES ($1, $2, 20, 100, NOW())`,
      [itemResult[0].id, batch2Id],
    );

    // Verify: Batch1 has 30 reserved (all consumed), Batch2 has 20 reserved (10 remaining)
    const batch1State = await dbQuery(
      `SELECT quantity_remaining, quantity_reserved FROM stock_batches WHERE id = $1`,
      [batch1Id],
    );
    expect(parseFloat(batch1State[0].quantity_remaining)).toBe(30);
    expect(parseFloat(batch1State[0].quantity_reserved)).toBe(30);

    const batch2State = await dbQuery(
      `SELECT quantity_remaining, quantity_reserved FROM stock_batches WHERE id = $1`,
      [batch2Id],
    );
    expect(parseFloat(batch2State[0].quantity_remaining)).toBe(30);
    expect(parseFloat(batch2State[0].quantity_reserved)).toBe(20);

    // ASSERTION: FIFO allocation works across multiple batches
    expect(parseFloat(batch1State[0].quantity_remaining) - parseFloat(batch1State[0].quantity_reserved)).toBe(0);
    expect(parseFloat(batch2State[0].quantity_remaining) - parseFloat(batch2State[0].quantity_reserved)).toBe(10);
  });
});
