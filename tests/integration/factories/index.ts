/**
 * Test Data Factories
 * Deterministic factory functions for creating test data
 * Uses PostgreSQL MCP tool via setup.dbQuery()
 */

import { dbQuery } from '../setup';

const entityCounters = {
  company: 0,
  customer: 0,
  product: 0,
  warehouse: 0,
  invoice: 0,
  batch: 0,
};

/**
 * Reset counters between tests
 */
export function resetCounters() {
  Object.keys(entityCounters).forEach((key) => {
    entityCounters[key as keyof typeof entityCounters] = 0;
  });
}

/**
 * Create a company
 */
export async function createCompany(overrides?: Partial<any>) {
  entityCounters.company++;

  const rows = await dbQuery(
    `INSERT INTO companies (name, created_at)
     VALUES ($1, NOW())
     RETURNING *`,
    [overrides?.company_name || `Test Company ${entityCounters.company}`],
  );

  const company = rows[0];
  // Normalize response - add company_id field for compatibility
  return {
    ...company,
    company_id: company.id,
    company_name: company.name,
  };
}

/**
 * Create a customer
 */
export async function createCustomer(overrides?: Partial<any>) {
  entityCounters.customer++;
  const companyId = overrides?.company_id || 1; // Use ID from createCompany

  const rows = await dbQuery(
    `INSERT INTO customers (company_id, name, email, phone, credit_limit, created_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     RETURNING *`,
    [
      companyId,
      overrides?.customer_name ||
        overrides?.name ||
        `Test Customer ${entityCounters.customer}`,
      overrides?.email || `cust${entityCounters.customer}@test.com`,
      overrides?.phone || '+971 50 123 4567',
      overrides?.credit_limit || 50000,
    ],
  );

  const customer = rows[0];
  // Normalize response for compatibility
  return {
    ...customer,
    customer_id: customer.id,
    customer_name: customer.name,
  };
}

/**
 * Create a product
 */
export async function createProduct(overrides?: Partial<any>) {
  entityCounters.product++;
  const productId =
    overrides?.product_id ||
    `PROD-${String(entityCounters.product).padStart(4, '0')}`;

  const rows = await dbQuery(
    `INSERT INTO products (product_id, sku, grade, form, finish, width_mm, thickness_mm, length_mm, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
     RETURNING id, product_id, sku, grade, form, finish, width_mm, thickness_mm, length_mm`,
    [
      productId,
      overrides?.sku || `SS-304-Sheet-Mirror-1000mm-2mm-6000mm`,
      overrides?.grade || '304',
      overrides?.form || 'Sheet',
      overrides?.finish || 'Mirror',
      overrides?.width_mm || 1000,
      overrides?.thickness_mm || 2,
      overrides?.length_mm || 6000,
    ],
  );
  return rows[0];
}

/**
 * Create a warehouse
 */
export async function createWarehouse(overrides?: Partial<any>) {
  entityCounters.warehouse++;
  const warehouseId =
    overrides?.warehouse_id ||
    `WH-${String(entityCounters.warehouse).padStart(4, '0')}`;
  const companyId = overrides?.company_id || 'CO-0001';

  const rows = await dbQuery(
    `INSERT INTO warehouses (warehouse_id, company_id, name, location, created_at)
     VALUES ($1, $2, $3, $4, NOW())
     RETURNING id, warehouse_id, company_id, name, location`,
    [
      warehouseId,
      companyId,
      overrides?.name || `Warehouse ${entityCounters.warehouse}`,
      overrides?.location || 'Dubai',
    ],
  );
  return rows[0];
}

/**
 * Seed stock - create stock record with quantity
 */
export async function seedStock(overrides?: Partial<any>) {
  entityCounters.batch++;
  const batchNo =
    overrides?.batch_no ||
    `BATCH-${String(entityCounters.batch).padStart(4, '0')}`;
  const warehouseId = overrides?.warehouse_id || 'WH-0001';
  const productId = overrides?.product_id || 'PROD-0001';

  const rows = await dbQuery(
    `INSERT INTO stock (warehouse_id, product_id, batch_no, quantity, unit_cost, created_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     RETURNING id, warehouse_id, product_id, batch_no, quantity, unit_cost`,
    [
      warehouseId,
      productId,
      batchNo,
      overrides?.quantity || 100,
      overrides?.unit_cost || 100,
    ],
  );
  return rows[0];
}

/**
 * Create an invoice (minimal, for testing)
 */
export async function createInvoice(overrides?: Partial<any>) {
  entityCounters.invoice++;
  const invoiceId =
    overrides?.invoice_id ||
    `INV-${String(entityCounters.invoice).padStart(6, '0')}`;
  const customerId = overrides?.customer_id || 'CUST-0001';
  const companyId = overrides?.company_id || 'CO-0001';

  const subtotal = overrides?.subtotal || 10000;
  const vatRate = overrides?.vat_rate !== undefined ? overrides.vat_rate : 0.05;
  const vatAmount = subtotal * vatRate;
  const total = subtotal + vatAmount;

  const rows = await dbQuery(
    `INSERT INTO invoices (invoice_id, customer_id, company_id, subtotal, vat_rate, vat_amount, total, status, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
     RETURNING id, invoice_id, customer_id, company_id, subtotal, vat_rate, vat_amount, total, status`,
    [
      invoiceId,
      customerId,
      companyId,
      subtotal,
      vatRate,
      vatAmount,
      total,
      overrides?.status || 'draft',
    ],
  );
  return rows[0];
}

/**
 * Create a delivery note
 */
export async function createDeliveryNote(overrides?: Partial<any>) {
  const invoiceId = overrides?.invoice_id || 'INV-000001';
  const companyId = overrides?.company_id || 'CO-0001';
  const deliveryNoteId = overrides?.delivery_note_id || `DN-${Date.now()}`;

  const rows = await dbQuery(
    `INSERT INTO delivery_notes (delivery_note_id, invoice_id, company_id, status, created_at)
     VALUES ($1, $2, $3, $4, NOW())
     RETURNING id, delivery_note_id, invoice_id, company_id, status`,
    [deliveryNoteId, invoiceId, companyId, overrides?.status || 'draft'],
  );
  return rows[0];
}

/**
 * Create a supplier bill
 */
export async function createSupplierBill(overrides?: Partial<any>) {
  const billId = overrides?.bill_id || `SB-${Date.now()}`;
  const supplierId = overrides?.supplier_id || 'SUP-0001';
  const companyId = overrides?.company_id || 'CO-0001';

  const rows = await dbQuery(
    `INSERT INTO supplier_bills (bill_id, supplier_id, company_id, amount, status, created_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     RETURNING id, bill_id, supplier_id, company_id, amount, status`,
    [
      billId,
      supplierId,
      companyId,
      overrides?.amount || 5000,
      overrides?.status || 'draft',
    ],
  ).catch((err) => {
    // FK constraint error if supplier doesn't exist
    if ((err as any).code === '23503') {
      throw new Error(
        `Foreign key constraint: supplier ${supplierId} not found`,
      );
    }
    throw err;
  });
  return rows[0];
}

/**
 * Create a supplier
 */
export async function createSupplier(overrides?: Partial<any>) {
  const supplierName =
    overrides?.name ||
    overrides?.supplier_name ||
    `Test Supplier ${Date.now()}`;
  const companyId = overrides?.company_id || 1;

  const rows = await dbQuery(
    `INSERT INTO suppliers (company_id, name, city, created_at)
     VALUES ($1, $2, $3, NOW())
     RETURNING id, name, company_id, city`,
    [companyId, supplierName, overrides?.city || 'Dubai'],
  );
  return rows[0];
}
