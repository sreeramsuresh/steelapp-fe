/**
 * Mock Data Factories for Component Testing
 * Generates realistic test data for components
 * Phase 5.3 Infrastructure
 */

import { vi } from "vitest";

/**
 * Create mock user object
 * @param {Object} overrides - Property overrides
 * @returns {Object} Mock user
 */
export function createMockUser(overrides = {}) {
  return {
    id: "user-123",
    name: "John Doe",
    email: "john@example.com",
    companyId: "company-123",
    role: "admin",
    permissions: ["read", "write", "delete"],
    ...overrides,
  };
}

/**
 * Create mock company object
 * @param {Object} overrides - Property overrides
 * @returns {Object} Mock company
 */
export function createMockCompany(overrides = {}) {
  return {
    id: "company-123",
    name: "Test Company LLC",
    trn: "12345678901234",
    country: "AE",
    city: "Dubai",
    email: "contact@testcompany.com",
    phone: "+971501234567",
    ...overrides,
  };
}

/**
 * Create mock product object
 * @param {Object} overrides - Property overrides
 * @returns {Object} Mock product
 */
export function createMockProduct(overrides = {}) {
  return {
    id: "prod-123",
    name: "SS-304-Sheet-BA-1000mm-1.5mm-2000mm",
    description: "Stainless Steel 304 Sheet",
    sku: "SS-304-001",
    category: "Stainless Steel Sheets",
    unit: "KG",
    price: 2500,
    costPrice: 2000,
    tax: 125,
    stock: 1000,
    minStock: 100,
    grade: "304",
    form: "Sheet",
    finish: "BA",
    width: 1000,
    thickness: 1.5,
    length: 2000,
    ...overrides,
  };
}

/**
 * Create mock invoice object
 * @param {Object} overrides - Property overrides
 * @returns {Object} Mock invoice
 */
export function createMockInvoice(overrides = {}) {
  return {
    id: "INV-2024-001",
    invoiceNumber: "INV-2024-001",
    customerId: "cust-123",
    customerName: "Test Customer",
    companyId: "company-123",
    date: new Date().toISOString(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: "draft",
    subtotal: 10000,
    tax: 500,
    total: 10500,
    discount: 0,
    notes: "Test invoice",
    lineItems: [createMockLineItem()],
    ...overrides,
  };
}

/**
 * Create mock line item object
 * @param {Object} overrides - Property overrides
 * @returns {Object} Mock line item
 */
export function createMockLineItem(overrides = {}) {
  return {
    id: "line-123",
    productId: "prod-123",
    productName: "SS-304-Sheet",
    quantity: 100,
    unit: "KG",
    price: 100,
    discount: 0,
    tax: 500,
    total: 10500,
    batchId: "batch-123",
    allocation: {
      source: "warehouse",
      warehouseId: "wh-001",
      quantity: 100,
    },
    ...overrides,
  };
}

/**
 * Create mock payment object
 * @param {Object} overrides - Property overrides
 * @returns {Object} Mock payment
 */
export function createMockPayment(overrides = {}) {
  return {
    id: "pay-123",
    invoiceId: "INV-2024-001",
    amount: 10500,
    date: new Date().toISOString(),
    method: "bank_transfer",
    reference: "TXN-123456",
    status: "completed",
    notes: "Payment received",
    ...overrides,
  };
}

/**
 * Create mock purchase order
 * @param {Object} overrides - Property overrides
 * @returns {Object} Mock PO
 */
export function createMockPurchaseOrder(overrides = {}) {
  return {
    id: "PO-2024-001",
    poNumber: "PO-2024-001",
    supplierId: "supp-123",
    supplierName: "Test Supplier",
    status: "open",
    date: new Date().toISOString(),
    expectedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    subtotal: 5000,
    tax: 250,
    total: 5250,
    lineItems: [createMockLineItem()],
    ...overrides,
  };
}

/**
 * Create mock warehouse object
 * @param {Object} overrides - Property overrides
 * @returns {Object} Mock warehouse
 */
export function createMockWarehouse(overrides = {}) {
  return {
    id: "wh-001",
    name: "Main Warehouse",
    location: "Dubai",
    capacity: 100000,
    currentStock: 50000,
    zones: [
      {
        id: "zone-1",
        name: "Zone A",
        stock: 25000,
      },
      {
        id: "zone-2",
        name: "Zone B",
        stock: 25000,
      },
    ],
    ...overrides,
  };
}

/**
 * Create mock stock batch
 * @param {Object} overrides - Property overrides
 * @returns {Object} Mock batch
 */
export function createMockBatch(overrides = {}) {
  return {
    id: "batch-123",
    batchNumber: "BATCH-2024-001",
    productId: "prod-123",
    productName: "SS-304-Sheet",
    supplier: "Test Supplier",
    quantity: 1000,
    availableQuantity: 800,
    reservedQuantity: 200,
    costPrice: 2000,
    receivedDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
    warehouseId: "wh-001",
    location: "zone-1-shelf-1",
    ...overrides,
  };
}

/**
 * Create mock quotation
 * @param {Object} overrides - Property overrides
 * @returns {Object} Mock quotation
 */
export function createMockQuotation(overrides = {}) {
  return {
    id: "quot-123",
    quotationNumber: "QUOT-2024-001",
    customerId: "cust-123",
    customerName: "Test Customer",
    status: "draft",
    date: new Date().toISOString(),
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    subtotal: 10000,
    tax: 500,
    total: 10500,
    lineItems: [createMockLineItem()],
    ...overrides,
  };
}

/**
 * Create mock customer object
 * @param {Object} overrides - Property overrides
 * @returns {Object} Mock customer
 */
export function createMockCustomer(overrides = {}) {
  return {
    id: "cust-123",
    name: "Test Customer LLC",
    email: "contact@customer.com",
    phone: "+971501234567",
    address: "Dubai, UAE",
    city: "Dubai",
    country: "AE",
    trn: "98765432109876",
    paymentTerms: 30,
    creditLimit: 50000,
    usedCredit: 10000,
    status: "active",
    ...overrides,
  };
}

/**
 * Create mock supplier object
 * @param {Object} overrides - Property overrides
 * @returns {Object} Mock supplier
 */
export function createMockSupplier(overrides = {}) {
  return {
    id: "supp-123",
    name: "Test Supplier Ltd",
    email: "contact@supplier.com",
    phone: "+971501234567",
    address: "Dubai, UAE",
    city: "Dubai",
    country: "AE",
    trn: "12345678901234",
    paymentTerms: 30,
    status: "active",
    ...overrides,
  };
}

/**
 * Create mock response object for async operations
 * @param {Object} overrides - Property overrides
 * @returns {Object} Mock response
 */
export function createMockResponse(overrides = {}) {
  return {
    status: 200,
    message: "Success",
    data: null,
    errors: null,
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create mock error object
 * @param {Object} overrides - Property overrides
 * @returns {Error} Mock error
 */
export function createMockError(overrides = {}) {
  return {
    message: "Test error",
    code: "TEST_ERROR",
    status: 400,
    ...overrides,
  };
}

/**
 * Create mock form state
 * @param {Object} overrides - Property overrides
 * @returns {Object} Mock form state
 */
export function createMockFormState(overrides = {}) {
  return {
    values: {
      name: "",
      email: "",
      amount: 0,
      ...overrides.values,
    },
    errors: {},
    touched: {},
    isSubmitting: false,
    isValid: true,
    ...overrides,
  };
}

/**
 * Create mock modal state
 * @param {Object} overrides - Property overrides
 * @returns {Object} Mock modal state
 */
export function createMockModalState(overrides = {}) {
  return {
    isOpen: false,
    data: null,
    mode: "view", // 'create', 'edit', 'view'
    isLoading: false,
    error: null,
    ...overrides,
  };
}

/**
 * Create array of mock items
 * @param {Function} factory - Factory function
 * @param {number} count - Number of items
 * @param {Function} overridesFn - Function to generate overrides per item
 * @returns {Array} Array of mock items
 */
export function createMockArray(factory, count = 3, overridesFn = null) {
  return Array.from({ length: count }, (_, index) => {
    const overrides = overridesFn ? overridesFn(index) : {};
    return factory(overrides);
  });
}

/**
 * Create mock notification
 * @param {Object} overrides - Property overrides
 * @returns {Object} Mock notification
 */
export function createMockNotification(overrides = {}) {
  return {
    id: "notif-123",
    type: "success", // 'success', 'error', 'warning', 'info'
    message: "Operation successful",
    duration: 3000,
    visible: true,
    ...overrides,
  };
}

export default {
  createMockUser,
  createMockCompany,
  createMockProduct,
  createMockInvoice,
  createMockLineItem,
  createMockPayment,
  createMockPurchaseOrder,
  createMockWarehouse,
  createMockBatch,
  createMockQuotation,
  createMockCustomer,
  createMockSupplier,
  createMockResponse,
  createMockError,
  createMockFormState,
  createMockModalState,
  createMockArray,
  createMockNotification,
};
