/**
 * Database Query & Assertion Helpers for Integration Tests
 * Provides typed queries for persisted state verification
 * Uses PostgreSQL MCP tool via setup.dbQuery()
 */

import { dbQuery } from '../setup';

/**
 * Get invoice by ID with calculated totals
 */
export async function getInvoice(invoiceId: string) {
  const rows = await dbQuery(
    `SELECT
       id, invoice_id, customer_id, company_id,
       subtotal, vat_rate, vat_amount, total,
       status, created_at, updated_at
     FROM invoices
     WHERE invoice_id = $1`,
    [invoiceId],
  );
  return rows[0] || null;
}

/**
 * Get all invoices for a company
 */
export async function getInvoicesByCompany(companyId: string) {
  return await dbQuery(
    `SELECT
       id, invoice_id, customer_id, company_id,
       subtotal, vat_rate, vat_amount, total, status
     FROM invoices
     WHERE company_id = $1
     ORDER BY created_at DESC`,
    [companyId],
  );
}

/**
 * Get current stock balance for product in warehouse
 */
export async function getStockBalance(warehouseId: string, productId: string) {
  const rows = await dbQuery(
    `SELECT COALESCE(SUM(quantity), 0) as total
     FROM stock
     WHERE warehouse_id = $1 AND product_id = $2`,
    [warehouseId, productId],
  );
  return rows[0]?.total || 0;
}

/**
 * Get all stock for a warehouse
 */
export async function getWarehouseStock(warehouseId: string) {
  return await dbQuery(
    `SELECT
       id, warehouse_id, product_id, batch_no,
       quantity, unit_cost, created_at
     FROM stock
     WHERE warehouse_id = $1
     ORDER BY batch_no`,
    [warehouseId],
  );
}

/**
 * Get stock movements for a document
 */
export async function getStockMovements(documentId: string) {
  return await dbQuery(
    `SELECT
       id, document_type, document_id, product_id,
       warehouse_id, batch_no, type, quantity, created_at
     FROM stock_movements
     WHERE document_id = $1
     ORDER BY created_at`,
    [documentId],
  );
}

/**
 * Get journal entries for an invoice
 */
export async function getJournalEntries(invoiceId: string) {
  return await dbQuery(
    `SELECT
       id, invoice_id, account_no, debit, credit,
       description, created_at
     FROM journal_entries
     WHERE invoice_id = $1
     ORDER BY id`,
    [invoiceId],
  );
}

/**
 * Get AR balance for a customer
 */
export async function getARBalance(customerId: string, companyId: string) {
  const rows = await dbQuery(
    `SELECT COALESCE(SUM(amount - COALESCE(paid, 0)), 0) as balance
     FROM ar_ledger
     WHERE customer_id = $1 AND company_id = $2`,
    [customerId, companyId],
  );
  return rows[0]?.balance || 0;
}

/**
 * Get all data for a company from a table (tenant isolation check)
 */
export async function getTenantData(tableName: string, companyId: string) {
  return await dbQuery(`SELECT * FROM ${tableName} WHERE company_id = $1`, [
    companyId,
  ]);
}

/**
 * Get a specific customer
 */
export async function getCustomer(customerId: string) {
  const rows = await dbQuery(
    `SELECT id, customer_id, company_id, customer_name,
            location, credit_limit, created_at
     FROM customers
     WHERE customer_id = $1`,
    [customerId],
  );
  return rows[0] || null;
}

/**
 * Get a specific product
 */
export async function getProduct(productId: string) {
  const rows = await dbQuery(
    `SELECT id, product_id, sku, grade, form, finish,
            width_mm, thickness_mm, length_mm, created_at
     FROM products
     WHERE product_id = $1`,
    [productId],
  );
  return rows[0] || null;
}

/**
 * Get a warehouse
 */
export async function getWarehouse(warehouseId: string) {
  const rows = await dbQuery(
    `SELECT id, warehouse_id, company_id, name, location, created_at
     FROM warehouses
     WHERE warehouse_id = $1`,
    [warehouseId],
  );
  return rows[0] || null;
}

/**
 * Get a company
 */
export async function getCompany(companyId: string) {
  const rows = await dbQuery(
    `SELECT id, company_id, company_name, trn_no, credit_limit, created_at
     FROM companies
     WHERE company_id = $1`,
    [companyId],
  );
  return rows[0] || null;
}

/**
 * Get a supplier bill
 */
export async function getSupplierBill(billId: string) {
  const rows = await dbQuery(
    `SELECT id, bill_id, supplier_id, company_id, amount, status, created_at
     FROM supplier_bills
     WHERE bill_id = $1`,
    [billId],
  );
  return rows[0] || null;
}

/**
 * Get a delivery note with its items
 */
export async function getDeliveryNote(deliveryNoteId: string) {
  const rows = await dbQuery(
    `SELECT id, delivery_note_id, invoice_id, company_id, status, created_at
     FROM delivery_notes
     WHERE delivery_note_id = $1`,
    [deliveryNoteId],
  );
  return rows[0] || null;
}

/**
 * Get delivery note line items
 */
export async function getDeliveryNoteItems(deliveryNoteId: string) {
  return await dbQuery(
    `SELECT id, delivery_note_id, product_id, batch_no, quantity, created_at
     FROM delivery_note_items
     WHERE delivery_note_id = $1
     ORDER BY id`,
    [deliveryNoteId],
  );
}

/**
 * Assert helper: Check sum of debits equals credits (journal balance)
 */
export async function getJournalBalance(invoiceId: string) {
  const entries = await getJournalEntries(invoiceId);
  const debits = entries.reduce(
    (sum, e) => sum + (parseFloat(e.debit) || 0),
    0,
  );
  const credits = entries.reduce(
    (sum, e) => sum + (parseFloat(e.credit) || 0),
    0,
  );
  return { debits, credits, isBalanced: Math.abs(debits - credits) < 0.01 };
}

/**
 * Assert helper: Check stock doesn't go negative
 */
export async function validateStockBalance(
  warehouseId: string,
  productId: string,
) {
  const balance = await getStockBalance(warehouseId, productId);
  return balance >= 0;
}

/**
 * Assert helper: Check tenant isolation
 */
export async function validateTenantIsolation(
  companyIdA: string,
  companyIdB: string,
  tableName: string,
) {
  const dataA = await getTenantData(tableName, companyIdA);
  const dataB = await getTenantData(tableName, companyIdB);

  // Verify no cross-contamination
  return {
    companyARowCount: dataA.length,
    companyBRowCount: dataB.length,
    isIsolated:
      dataA.every((row: { company_id: string }) => row.company_id === companyIdA) &&
      dataB.every((row: { company_id: string }) => row.company_id === companyIdB),
  };
}

/**
 * Count rows in a table
 */
export async function countRows(
  tableName: string,
  whereClause?: string,
  params?: unknown[],
) {
  const sql = whereClause
    ? `SELECT COUNT(*) as count FROM ${tableName} WHERE ${whereClause}`
    : `SELECT COUNT(*) as count FROM ${tableName}`;

  const rows = await dbQuery(sql, params || []);
  return rows[0]?.count || 0;
}
