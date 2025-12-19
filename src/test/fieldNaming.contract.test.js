/**
 * Field Naming Contract Tests - snake_case/camelCase Compatibility
 *
 * These tests verify that:
 * 1. Field accessor utilities handle both snake_case and camelCase
 * 2. API responses are correctly processed regardless of field naming
 * 3. The field fallback chain works correctly
 *
 * Context:
 * - API Gateway converts snake_case (backend) ↔ camelCase (frontend)
 * - But inconsistencies can occur, so we must handle both formats
 * - These tests ensure we never regress to only checking one format
 */

import { describe, it, expect } from 'vitest';
import {
  safeField,
  toSnakeCase,
  getProductDisplayName,
  getProductFullName,
  getPrice,
  getStock,
  getTimestamp,
  getCustomerFields,
  getInvoiceFields,
  normalizeProduct,
} from '@/utils/fieldAccessors';

// ============================================================================
// UTILITY FUNCTION TESTS
// ============================================================================

describe('toSnakeCase utility', () => {
  it('converts camelCase to snake_case', () => {
    expect(toSnakeCase('displayName')).toBe('display_name');
    expect(toSnakeCase('fullName')).toBe('full_name');
    expect(toSnakeCase('sellingPrice')).toBe('selling_price');
    expect(toSnakeCase('currentStock')).toBe('current_stock');
  });

  it('handles already lowercase strings', () => {
    expect(toSnakeCase('name')).toBe('name');
    expect(toSnakeCase('price')).toBe('price');
  });

  it('handles multiple capital letters', () => {
    expect(toSnakeCase('invoiceNumber')).toBe('invoice_number');
    expect(toSnakeCase('paymentStatus')).toBe('payment_status');
  });
});

describe('safeField utility', () => {
  it('returns camelCase value when present', () => {
    const obj = { displayName: 'Test Product' };
    expect(safeField(obj, 'displayName')).toBe('Test Product');
  });

  it('falls back to snake_case when camelCase is undefined', () => {
    const obj = { display_name: 'Test Product' };
    expect(safeField(obj, 'displayName')).toBe('Test Product');
  });

  it('prefers camelCase over snake_case', () => {
    const obj = { displayName: 'CamelCase', display_name: 'snake_case' };
    expect(safeField(obj, 'displayName')).toBe('CamelCase');
  });

  it('returns undefined for missing fields', () => {
    const obj = { otherField: 'value' };
    expect(safeField(obj, 'displayName')).toBeUndefined();
  });

  it('handles null/undefined objects gracefully', () => {
    expect(safeField(null, 'displayName')).toBeUndefined();
    expect(safeField(undefined, 'displayName')).toBeUndefined();
  });
});

// ============================================================================
// PRODUCT FIELD TESTS
// ============================================================================

describe('getProductDisplayName', () => {
  it('returns displayName when present (camelCase)', () => {
    const product = { displayName: 'SS-316L-Bar-25mm' };
    expect(getProductDisplayName(product)).toBe('SS-316L-Bar-25mm');
  });

  it('returns display_name when displayName is undefined (snake_case)', () => {
    const product = { display_name: 'SS-316L-Bar-25mm' };
    expect(getProductDisplayName(product)).toBe('SS-316L-Bar-25mm');
  });

  it('falls back to fullName when display names are missing', () => {
    const product = { fullName: 'SS-316L-Bar-25mm-UAE' };
    expect(getProductDisplayName(product)).toBe('SS-316L-Bar-25mm-UAE');
  });

  it('falls back to full_name (snake_case)', () => {
    const product = { full_name: 'SS-316L-Bar-25mm-UAE' };
    expect(getProductDisplayName(product)).toBe('SS-316L-Bar-25mm-UAE');
  });

  it('falls back to name as last resort', () => {
    const product = { name: 'SS 316L Bar 25mm' };
    expect(getProductDisplayName(product)).toBe('SS 316L Bar 25mm');
  });

  it('returns empty string for null/undefined product', () => {
    expect(getProductDisplayName(null)).toBe('');
    expect(getProductDisplayName(undefined)).toBe('');
  });

  it('respects priority order: displayName > display_name > fullName > full_name > name', () => {
    // All fields present - should use displayName
    const allFields = {
      displayName: 'displayName',
      display_name: 'display_name',
      fullName: 'fullName',
      full_name: 'full_name',
      name: 'name',
    };
    expect(getProductDisplayName(allFields)).toBe('displayName');

    // Missing displayName - should use display_name
    const noDisplayName = {
      display_name: 'display_name',
      fullName: 'fullName',
      name: 'name',
    };
    expect(getProductDisplayName(noDisplayName)).toBe('display_name');
  });
});

describe('getProductFullName', () => {
  it('returns fullName when present (camelCase)', () => {
    const product = { fullName: 'SS-316L-Bar-25mm-UAE' };
    expect(getProductFullName(product)).toBe('SS-316L-Bar-25mm-UAE');
  });

  it('returns full_name when fullName is undefined (snake_case)', () => {
    const product = { full_name: 'SS-316L-Bar-25mm-UAE' };
    expect(getProductFullName(product)).toBe('SS-316L-Bar-25mm-UAE');
  });

  it('falls back to displayName when full names are missing', () => {
    const product = { displayName: 'SS-316L-Bar-25mm' };
    expect(getProductFullName(product)).toBe('SS-316L-Bar-25mm');
  });

  it('returns empty string for null/undefined product', () => {
    expect(getProductFullName(null)).toBe('');
    expect(getProductFullName(undefined)).toBe('');
  });
});

describe('getPrice', () => {
  it('returns sellingPrice for selling type (camelCase)', () => {
    const product = { sellingPrice: 150.5 };
    expect(getPrice(product, 'selling')).toBe(150.5);
  });

  it('returns selling_price when sellingPrice is undefined (snake_case)', () => {
    const product = { selling_price: 150.5 };
    expect(getPrice(product, 'selling')).toBe(150.5);
  });

  it('returns costPrice for cost type (camelCase)', () => {
    const product = { costPrice: 100.0 };
    expect(getPrice(product, 'cost')).toBe(100.0);
  });

  it('returns cost_price when costPrice is undefined (snake_case)', () => {
    const product = { cost_price: 100.0 };
    expect(getPrice(product, 'cost')).toBe(100.0);
  });

  it('falls back to price for selling type', () => {
    const product = { price: 120.0 };
    expect(getPrice(product, 'selling')).toBe(120.0);
  });

  it('returns 0 for null/undefined product', () => {
    expect(getPrice(null)).toBe(0);
    expect(getPrice(undefined)).toBe(0);
  });

  it('defaults to selling type when no type specified', () => {
    const product = { sellingPrice: 150, costPrice: 100 };
    expect(getPrice(product)).toBe(150);
  });
});

describe('getStock', () => {
  it('returns stock levels with camelCase fields', () => {
    const product = { currentStock: 50, minStock: 10, maxStock: 100 };
    expect(getStock(product)).toEqual({ current: 50, min: 10, max: 100 });
  });

  it('returns stock levels with snake_case fields', () => {
    const product = { current_stock: 50, min_stock: 10, max_stock: 100 };
    expect(getStock(product)).toEqual({ current: 50, min: 10, max: 100 });
  });

  it('handles mixed case fields', () => {
    const product = { currentStock: 50, min_stock: 10, maxStock: 100 };
    expect(getStock(product)).toEqual({ current: 50, min: 10, max: 100 });
  });

  it('falls back to quantity for current stock', () => {
    const product = { quantity: 25 };
    expect(getStock(product).current).toBe(25);
  });

  it('falls back to reorderLevel for min stock', () => {
    const product = { reorderLevel: 5 };
    expect(getStock(product).min).toBe(5);
  });

  it('returns zeros for null/undefined product', () => {
    expect(getStock(null)).toEqual({ current: 0, min: 0, max: 0 });
    expect(getStock(undefined)).toEqual({ current: 0, min: 0, max: 0 });
  });
});

// ============================================================================
// TIMESTAMP FIELD TESTS
// ============================================================================

describe('getTimestamp', () => {
  const isoDate = '2024-01-15T10:30:00Z';

  it('returns timestamp with camelCase field', () => {
    const obj = { createdAt: isoDate };
    expect(getTimestamp(obj, 'createdAt')).toBe(isoDate);
  });

  it('returns timestamp with snake_case field', () => {
    const obj = { created_at: isoDate };
    expect(getTimestamp(obj, 'createdAt')).toBe(isoDate);
  });

  it('handles updatedAt field', () => {
    const obj = { updatedAt: isoDate };
    expect(getTimestamp(obj, 'updatedAt')).toBe(isoDate);
  });

  it('handles updated_at field (snake_case)', () => {
    const obj = { updated_at: isoDate };
    expect(getTimestamp(obj, 'updatedAt')).toBe(isoDate);
  });

  it('returns null for missing timestamp', () => {
    const obj = { otherField: 'value' };
    expect(getTimestamp(obj, 'createdAt')).toBeNull();
  });

  it('returns null for null/undefined object', () => {
    expect(getTimestamp(null, 'createdAt')).toBeNull();
    expect(getTimestamp(undefined, 'createdAt')).toBeNull();
  });
});

// ============================================================================
// CUSTOMER FIELD TESTS
// ============================================================================

describe('getCustomerFields', () => {
  it('handles camelCase customer fields', () => {
    const customer = {
      id: 1,
      name: 'Test Customer',
      email: 'test@example.com',
      phoneNumber: '123456789',
      creditLimit: 10000,
      currentCredit: 5000,
      paymentTerms: 'Net 30',
      trnNumber: 'TRN12345',
    };
    const result = getCustomerFields(customer);
    expect(result.phone).toBe('123456789');
    expect(result.creditLimit).toBe(10000);
    expect(result.currentCredit).toBe(5000);
    expect(result.paymentTerms).toBe('Net 30');
    expect(result.trnNumber).toBe('TRN12345');
  });

  it('handles snake_case customer fields', () => {
    const customer = {
      id: 1,
      company_name: 'Test Company',
      phone_number: '987654321',
      credit_limit: 15000,
      current_credit: 7500,
      payment_terms: 'Net 45',
      trn_number: 'TRN67890',
    };
    const result = getCustomerFields(customer);
    expect(result.name).toBe('Test Company');
    expect(result.phone).toBe('987654321');
    expect(result.creditLimit).toBe(15000);
    expect(result.currentCredit).toBe(7500);
    expect(result.paymentTerms).toBe('Net 45');
    expect(result.trnNumber).toBe('TRN67890');
  });

  it('returns empty object for null/undefined customer', () => {
    expect(getCustomerFields(null)).toEqual({});
    expect(getCustomerFields(undefined)).toEqual({});
  });
});

// ============================================================================
// INVOICE FIELD TESTS
// ============================================================================

describe('getInvoiceFields', () => {
  it('handles camelCase invoice fields', () => {
    const invoice = {
      id: 1,
      invoiceNumber: 'INV-001',
      customerId: 5,
      status: 'draft',
      paymentStatus: 'pending',
      deliveryStatus: 'not_delivered',
      subtotal: 1000,
      vatAmount: 50,
      total: 1050,
      totalPaid: 500,
      balance: 550,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-16T12:00:00Z',
    };
    const result = getInvoiceFields(invoice);
    expect(result.invoiceNumber).toBe('INV-001');
    expect(result.customerId).toBe(5);
    expect(result.paymentStatus).toBe('pending');
    expect(result.deliveryStatus).toBe('not_delivered');
    expect(result.vatAmount).toBe(50);
    expect(result.totalPaid).toBe(500);
    expect(result.createdAt).toBe('2024-01-15T10:00:00Z');
  });

  it('handles snake_case invoice fields', () => {
    const invoice = {
      id: 1,
      invoice_number: 'INV-002',
      customer_id: 10,
      payment_status: 'paid',
      delivery_status: 'delivered',
      vat_amount: 75,
      total_paid: 1575,
      created_at: '2024-01-17T10:00:00Z',
      updated_at: '2024-01-18T12:00:00Z',
    };
    const result = getInvoiceFields(invoice);
    expect(result.invoiceNumber).toBe('INV-002');
    expect(result.customerId).toBe(10);
    expect(result.paymentStatus).toBe('paid');
    expect(result.deliveryStatus).toBe('delivered');
    expect(result.vatAmount).toBe(75);
    expect(result.totalPaid).toBe(1575);
    expect(result.createdAt).toBe('2024-01-17T10:00:00Z');
  });

  it('uses balance fallback from outstanding', () => {
    const invoice = { id: 1, outstanding: 250 };
    expect(getInvoiceFields(invoice).balance).toBe(250);
  });

  it('uses totalPaid fallback from received', () => {
    const invoice = { id: 1, received: 750 };
    expect(getInvoiceFields(invoice).totalPaid).toBe(750);
  });

  it('returns empty object for null/undefined invoice', () => {
    expect(getInvoiceFields(null)).toEqual({});
    expect(getInvoiceFields(undefined)).toEqual({});
  });
});

// ============================================================================
// PRODUCT NORMALIZATION TESTS
// ============================================================================

describe('normalizeProduct', () => {
  it('normalizes snake_case fields to camelCase', () => {
    const product = {
      id: 1,
      display_name: 'SS-316L-Bar',
      full_name: 'SS-316L-Bar-UAE',
      unique_name: 'ss-316l-bar-uae',
      selling_price: 150,
      cost_price: 100,
      current_stock: 50,
      min_stock: 10,
      max_stock: 100,
      size_inch: '1"',
      origin: 'India',
    };
    const result = normalizeProduct(product);
    expect(result.displayName).toBe('SS-316L-Bar');
    expect(result.fullName).toBe('SS-316L-Bar-UAE');
    expect(result.uniqueName).toBe('ss-316l-bar-uae');
    expect(result.sellingPrice).toBe(150);
    expect(result.costPrice).toBe(100);
    expect(result.currentStock).toBe(50);
    expect(result.minStock).toBe(10);
    expect(result.maxStock).toBe(100);
    expect(result.sizeInch).toBe('1"');
    expect(result.origin).toBe('India');
  });

  it('preserves camelCase fields', () => {
    const product = {
      id: 1,
      displayName: 'SS-316L-Bar',
      fullName: 'SS-316L-Bar-UAE',
      sellingPrice: 150,
    };
    const result = normalizeProduct(product);
    expect(result.displayName).toBe('SS-316L-Bar');
    expect(result.fullName).toBe('SS-316L-Bar-UAE');
    expect(result.sellingPrice).toBe(150);
  });

  it('defaults origin to UAE when missing', () => {
    const product = { id: 1, displayName: 'Test' };
    expect(normalizeProduct(product).origin).toBe('UAE');
  });

  it('returns null for null/undefined product', () => {
    expect(normalizeProduct(null)).toBeNull();
    expect(normalizeProduct(undefined)).toBeNull();
  });
});

// ============================================================================
// REAL-WORLD API RESPONSE SIMULATION TESTS
// ============================================================================

describe('Real-world API Response Handling', () => {
  it('handles product response with snake_case from backend', () => {
    // Simulates API response when caseConversion middleware fails
    const apiResponse = {
      id: 42,
      name: 'SS 316L Bar 25mm',
      display_name: 'SS-316L-Bar-25mm',
      full_name: 'SS-316L-Bar-25mm-UAE',
      selling_price: 185.5,
      cost_price: 120.0,
      current_stock: 75,
      min_stock: 20,
      max_stock: 200,
      origin: 'India',
    };

    expect(getProductDisplayName(apiResponse)).toBe('SS-316L-Bar-25mm');
    expect(getProductFullName(apiResponse)).toBe('SS-316L-Bar-25mm-UAE');
    expect(getPrice(apiResponse, 'selling')).toBe(185.5);
    expect(getStock(apiResponse).current).toBe(75);
  });

  it('handles product response with camelCase from gateway', () => {
    // Simulates API response when caseConversion works correctly
    const apiResponse = {
      id: 42,
      name: 'SS 316L Bar 25mm',
      displayName: 'SS-316L-Bar-25mm',
      fullName: 'SS-316L-Bar-25mm-UAE',
      sellingPrice: 185.5,
      costPrice: 120.0,
      currentStock: 75,
      minStock: 20,
      maxStock: 200,
      origin: 'India',
    };

    expect(getProductDisplayName(apiResponse)).toBe('SS-316L-Bar-25mm');
    expect(getProductFullName(apiResponse)).toBe('SS-316L-Bar-25mm-UAE');
    expect(getPrice(apiResponse, 'selling')).toBe(185.5);
    expect(getStock(apiResponse).current).toBe(75);
  });

  it('handles invoice response with snake_case timestamps', () => {
    const apiResponse = {
      id: 100,
      invoice_number: 'INV-2024-001',
      customer_id: 5,
      total: 1050,
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-16T12:00:00Z',
    };

    const fields = getInvoiceFields(apiResponse);
    expect(fields.invoiceNumber).toBe('INV-2024-001');
    expect(fields.createdAt).toBe('2024-01-15T10:00:00Z');
    expect(fields.updatedAt).toBe('2024-01-16T12:00:00Z');
  });

  it('handles mixed case response (partial conversion)', () => {
    // Simulates scenario where some fields are converted, others are not
    const apiResponse = {
      id: 42,
      displayName: 'SS-316L-Bar-25mm', // Converted
      full_name: 'SS-316L-Bar-25mm-UAE', // Not converted
      sellingPrice: 185.5, // Converted
      current_stock: 75, // Not converted
    };

    expect(getProductDisplayName(apiResponse)).toBe('SS-316L-Bar-25mm');
    expect(getProductFullName(apiResponse)).toBe('SS-316L-Bar-25mm-UAE');
    expect(getPrice(apiResponse, 'selling')).toBe(185.5);
    expect(getStock(apiResponse).current).toBe(75);
  });
});

// ============================================================================
// REGRESSION TESTS - Prevent Previous Bugs
// ============================================================================

describe('Regression Tests - Product Search Display Bug', () => {
  /**
   * Bug: Product search dropdowns showed "SS 316L Bar 25mm" (spaces, no origin)
   * instead of "SS-316L-Bar-25mm-UAE" (hyphens with origin)
   *
   * Root cause: Frontend only checked camelCase fields (fullName, displayName)
   * but API returned snake_case (full_name, display_name), causing fallback
   * to legacy 'name' field.
   */

  it('should display hyphenated name with origin, not legacy name', () => {
    // This was the actual bug scenario
    const productFromApi = {
      id: 1,
      name: 'SS 316L Bar 25mm', // Legacy field (spaces, no origin)
      display_name: 'SS-316L-Bar-25mm',
      full_name: 'SS-316L-Bar-25mm-UAE',
    };

    // Before fix: would return "SS 316L Bar 25mm" (legacy name)
    // After fix: returns "SS-316L-Bar-25mm" (display_name)
    const displayName = getProductDisplayName(productFromApi);
    expect(displayName).not.toBe('SS 316L Bar 25mm'); // Must NOT be legacy
    expect(displayName).toBe('SS-316L-Bar-25mm'); // Must be display_name
  });

  it('should prefer full_name for dropdowns showing origin', () => {
    const productFromApi = {
      id: 1,
      name: 'SS 316L Bar 25mm',
      full_name: 'SS-316L-Bar-25mm-UAE',
    };

    const fullName = getProductFullName(productFromApi);
    expect(fullName).not.toBe('SS 316L Bar 25mm');
    expect(fullName).toBe('SS-316L-Bar-25mm-UAE');
  });
});
