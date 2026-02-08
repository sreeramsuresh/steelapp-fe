/**
 * Field Accessors Tests
 * Tests safe field access with camelCase/snake_case fallbacks
 *
 * Run: node --test src/utils/__tests__/fieldAccessors.test.mjs
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  toSnakeCase,
  safeField,
  getProductDisplayName,
  getProductUniqueName,
  getProductFullName,
  getPrice,
  getStock,
  getTimestamp,
  getCustomerFields,
  getInvoiceFields,
  normalizeUom,
} from '../fieldAccessors.js';

describe('fieldAccessors', () => {
  describe('toSnakeCase()', () => {
    test('should convert camelCase to snake_case', () => {
      const result = toSnakeCase('displayName');
      assert.strictEqual(result, 'display_name');
    });

    test('should convert multiple camel humps', () => {
      const result = toSnakeCase('totalPaidAmount');
      assert.strictEqual(result, 'total_paid_amount');
    });

    test('should handle single word', () => {
      const result = toSnakeCase('price');
      assert.strictEqual(result, 'price');
    });

    test('should handle empty string', () => {
      const result = toSnakeCase('');
      assert.strictEqual(result, '');
    });

    test('should return string', () => {
      const result = toSnakeCase('productName');
      assert.strictEqual(typeof result, 'string');
    });
  });

  describe('safeField()', () => {
    test('should return camelCase field if present', () => {
      const obj = { displayName: 'Product A' };
      const result = safeField(obj, 'displayName');
      assert.strictEqual(result, 'Product A');
    });

    test('should return snake_case field as fallback', () => {
      const obj = { display_name: 'Product A' };
      const result = safeField(obj, 'displayName');
      assert.strictEqual(result, 'Product A');
    });

    test('should prefer camelCase over snake_case', () => {
      const obj = { displayName: 'CamelCase', display_name: 'SnakeCase' };
      const result = safeField(obj, 'displayName');
      assert.strictEqual(result, 'CamelCase');
    });

    test('should return undefined for missing field', () => {
      const obj = { name: 'Test' };
      const result = safeField(obj, 'displayName');
      assert.strictEqual(result, undefined);
    });

    test('should handle null object', () => {
      const result = safeField(null, 'displayName');
      assert.strictEqual(result, undefined);
    });

    test('should handle non-object', () => {
      const result = safeField('string', 'field');
      assert.strictEqual(result, undefined);
    });
  });

  describe('getProductDisplayName()', () => {
    test('should return displayName if present', () => {
      const product = { displayName: 'Steel Sheet' };
      const result = getProductDisplayName(product);
      assert.strictEqual(result, 'Steel Sheet');
    });

    test('should fallback to display_name', () => {
      const product = { display_name: 'Steel Sheet' };
      const result = getProductDisplayName(product);
      assert.strictEqual(result, 'Steel Sheet');
    });

    test('should fallback to uniqueName', () => {
      const product = { uniqueName: 'SS-304-Sheet-2B-1220x2440-1.5mm' };
      const result = getProductDisplayName(product);
      assert.strictEqual(result, 'SS-304-Sheet-2B-1220x2440-1.5mm');
    });

    test('should fallback to unique_name', () => {
      const product = { unique_name: 'SS-304-Sheet-2B-1220x2440-1.5mm' };
      const result = getProductDisplayName(product);
      assert.strictEqual(result, 'SS-304-Sheet-2B-1220x2440-1.5mm');
    });

    test('should fallback to name', () => {
      const product = { name: 'Sheet' };
      const result = getProductDisplayName(product);
      assert.strictEqual(result, 'Sheet');
    });

    test('should return empty string for empty object', () => {
      const product = {};
      const result = getProductDisplayName(product);
      assert.strictEqual(result, '');
    });

    test('should return empty string for null', () => {
      const result = getProductDisplayName(null);
      assert.strictEqual(result, '');
    });

    test('should use priority order: displayName > uniqueName > name', () => {
      const product = {
        name: 'Name',
        uniqueName: 'Unique Name',
        display_name: 'Display Name Snake',
        displayName: 'Display Name Camel',
      };
      const result = getProductDisplayName(product);
      assert.strictEqual(result, 'Display Name Camel');
    });

    test('should prefer uniqueName over name when no displayName', () => {
      const product = {
        name: 'Name',
        uniqueName: 'Unique Name',
      };
      const result = getProductDisplayName(product);
      assert.strictEqual(result, 'Unique Name');
    });
  });

  describe('getProductUniqueName()', () => {
    test('should return uniqueName if present', () => {
      const product = { uniqueName: 'SS-304-Sheet-2B-1220x2440-1.5mm' };
      const result = getProductUniqueName(product);
      assert.strictEqual(result, 'SS-304-Sheet-2B-1220x2440-1.5mm');
    });

    test('should fallback to unique_name', () => {
      const product = { unique_name: 'SS-304-Sheet-2B-1220x2440-1.5mm' };
      const result = getProductUniqueName(product);
      assert.strictEqual(result, 'SS-304-Sheet-2B-1220x2440-1.5mm');
    });

    test('should fallback to fullName', () => {
      const product = { fullName: 'SS-304-Sheet-2B-1220x2440-1.5mm' };
      const result = getProductUniqueName(product);
      assert.strictEqual(result, 'SS-304-Sheet-2B-1220x2440-1.5mm');
    });

    test('should fallback to full_name', () => {
      const product = { full_name: 'SS-304-Sheet-2B-1220x2440-1.5mm' };
      const result = getProductUniqueName(product);
      assert.strictEqual(result, 'SS-304-Sheet-2B-1220x2440-1.5mm');
    });

    test('should fallback to name', () => {
      const product = { name: 'Sheet' };
      const result = getProductUniqueName(product);
      assert.strictEqual(result, 'Sheet');
    });

    test('should return empty string for empty object', () => {
      const product = {};
      const result = getProductUniqueName(product);
      assert.strictEqual(result, '');
    });

    test('should return empty string for null', () => {
      const result = getProductUniqueName(null);
      assert.strictEqual(result, '');
    });

    test('should use priority order: uniqueName > fullName > name', () => {
      const product = {
        name: 'Name',
        fullName: 'Full Name',
        uniqueName: 'Unique Name',
      };
      const result = getProductUniqueName(product);
      assert.strictEqual(result, 'Unique Name');
    });

    test('should prefer fullName over name when no uniqueName', () => {
      const product = {
        name: 'Name',
        fullName: 'Full Name',
      };
      const result = getProductUniqueName(product);
      assert.strictEqual(result, 'Full Name');
    });
  });

  describe('getProductFullName() (deprecated alias)', () => {
    test('should be identical to getProductUniqueName', () => {
      assert.strictEqual(getProductFullName, getProductUniqueName);
    });

    test('should return same result as getProductUniqueName', () => {
      const product = { uniqueName: 'SS-304-Sheet', fullName: 'Different' };
      assert.strictEqual(
        getProductFullName(product),
        getProductUniqueName(product),
      );
    });
  });

  describe('getPrice()', () => {
    test('should return selling price by default', () => {
      const product = { sellingPrice: 100 };
      const result = getPrice(product);
      assert.strictEqual(result, 100);
    });

    test('should fallback to selling_price', () => {
      const product = { selling_price: 100 };
      const result = getPrice(product);
      assert.strictEqual(result, 100);
    });

    test('should fallback to price', () => {
      const product = { price: 100 };
      const result = getPrice(product);
      assert.strictEqual(result, 100);
    });

    test('should return 0 for missing price', () => {
      const product = {};
      const result = getPrice(product);
      assert.strictEqual(result, 0);
    });

    test('should return cost price when requested', () => {
      const product = { costPrice: 50, sellingPrice: 100 };
      const result = getPrice(product, 'cost');
      assert.strictEqual(result, 50);
    });

    test('should fallback to cost_price', () => {
      const product = { cost_price: 50 };
      const result = getPrice(product, 'cost');
      assert.strictEqual(result, 50);
    });

    test('should fallback to purchase price for cost', () => {
      const product = { purchasePrice: 50 };
      const result = getPrice(product, 'cost');
      assert.strictEqual(result, 50);
    });

    test('should return 0 for null product', () => {
      const result = getPrice(null);
      assert.strictEqual(result, 0);
    });

    test('should prefer camelCase over snake_case', () => {
      const product = { sellingPrice: 100, selling_price: 80 };
      const result = getPrice(product);
      assert.strictEqual(result, 100);
    });
  });

  describe('getStock()', () => {
    test('should return current stock', () => {
      const product = { currentStock: 50 };
      const result = getStock(product);
      assert.strictEqual(result.current, 50);
    });

    test('should fallback to current_stock', () => {
      const product = { current_stock: 50 };
      const result = getStock(product);
      assert.strictEqual(result.current, 50);
    });

    test('should fallback to quantity', () => {
      const product = { quantity: 50 };
      const result = getStock(product);
      assert.strictEqual(result.current, 50);
    });

    test('should return minimum stock', () => {
      const product = { minStock: 10 };
      const result = getStock(product);
      assert.strictEqual(result.min, 10);
    });

    test('should return maximum stock', () => {
      const product = { maxStock: 200 };
      const result = getStock(product);
      assert.strictEqual(result.max, 200);
    });

    test('should return all zeros for empty object', () => {
      const product = {};
      const result = getStock(product);
      assert.deepStrictEqual(result, { current: 0, min: 0, max: 0 });
    });

    test('should return all zeros for null', () => {
      const result = getStock(null);
      assert.deepStrictEqual(result, { current: 0, min: 0, max: 0 });
    });

    test('should return object with correct structure', () => {
      const product = { currentStock: 50, minStock: 10, maxStock: 200 };
      const result = getStock(product);
      assert.ok(result.hasOwnProperty('current'));
      assert.ok(result.hasOwnProperty('min'));
      assert.ok(result.hasOwnProperty('max'));
    });
  });

  describe('getTimestamp()', () => {
    test('should return createdAt timestamp', () => {
      const obj = { createdAt: '2024-01-15T10:00:00Z' };
      const result = getTimestamp(obj, 'createdAt');
      assert.strictEqual(result, '2024-01-15T10:00:00Z');
    });

    test('should fallback to created_at', () => {
      const obj = { created_at: '2024-01-15T10:00:00Z' };
      const result = getTimestamp(obj, 'createdAt');
      assert.strictEqual(result, '2024-01-15T10:00:00Z');
    });

    test('should return null for missing timestamp', () => {
      const obj = {};
      const result = getTimestamp(obj, 'createdAt');
      assert.strictEqual(result, null);
    });

    test('should handle updatedAt field', () => {
      const obj = { updatedAt: '2024-01-16T15:00:00Z' };
      const result = getTimestamp(obj, 'updatedAt');
      assert.strictEqual(result, '2024-01-16T15:00:00Z');
    });

    test('should default to createdAt', () => {
      const obj = { createdAt: '2024-01-15T10:00:00Z' };
      const result = getTimestamp(obj);
      assert.strictEqual(result, '2024-01-15T10:00:00Z');
    });

    test('should return null for null object', () => {
      const result = getTimestamp(null, 'createdAt');
      assert.strictEqual(result, null);
    });
  });

  describe('getCustomerFields()', () => {
    test('should normalize customer fields', () => {
      const customer = {
        id: 1,
        name: 'ABC Company',
        email: 'contact@abc.com',
        phone: '971501234567',
      };
      const result = getCustomerFields(customer);
      assert.strictEqual(result.name, 'ABC Company');
      assert.strictEqual(result.email, 'contact@abc.com');
    });

    test('should fallback to companyName', () => {
      const customer = { companyName: 'XYZ Ltd' };
      const result = getCustomerFields(customer);
      assert.strictEqual(result.name, 'XYZ Ltd');
    });

    test('should fallback to phoneNumber', () => {
      const customer = { phoneNumber: '971501234567' };
      const result = getCustomerFields(customer);
      assert.strictEqual(result.phone, '971501234567');
    });

    test('should return creditLimit with fallback', () => {
      const customer = { creditLimit: 50000 };
      const result = getCustomerFields(customer);
      assert.strictEqual(result.creditLimit, 50000);
    });

    test('should return empty object for null', () => {
      const result = getCustomerFields(null);
      assert.deepStrictEqual(result, {});
    });

    test('should include all required fields', () => {
      const customer = { id: 1, name: 'Test' };
      const result = getCustomerFields(customer);
      assert.ok(result.hasOwnProperty('id'));
      assert.ok(result.hasOwnProperty('name'));
      assert.ok(result.hasOwnProperty('email'));
      assert.ok(result.hasOwnProperty('phone'));
      assert.ok(result.hasOwnProperty('creditLimit'));
      assert.ok(result.hasOwnProperty('paymentTerms'));
    });
  });

  describe('getInvoiceFields()', () => {
    test('should normalize invoice fields', () => {
      const invoice = {
        id: 1,
        invoiceNumber: 'INV-001',
        status: 'issued',
        total: 1000,
      };
      const result = getInvoiceFields(invoice);
      assert.strictEqual(result.invoiceNumber, 'INV-001');
      assert.strictEqual(result.status, 'issued');
      assert.strictEqual(result.total, 1000);
    });

    test('should fallback to invoice_number', () => {
      const invoice = { invoice_number: 'INV-001' };
      const result = getInvoiceFields(invoice);
      assert.strictEqual(result.invoiceNumber, 'INV-001');
    });

    test('should return balance and outstanding', () => {
      const invoice = { balance: 500, outstanding: 300 };
      const result = getInvoiceFields(invoice);
      assert.strictEqual(result.balance, 500);
    });

    test('should return empty object for null', () => {
      const result = getInvoiceFields(null);
      assert.deepStrictEqual(result, {});
    });

    test('should include all required fields', () => {
      const invoice = { id: 1, invoiceNumber: 'INV-001' };
      const result = getInvoiceFields(invoice);
      assert.ok(result.hasOwnProperty('id'));
      assert.ok(result.hasOwnProperty('invoiceNumber'));
      assert.ok(result.hasOwnProperty('status'));
      assert.ok(result.hasOwnProperty('total'));
    });
  });

  describe('normalizeUom()', () => {
    test('should normalize UNIT_OF_MEASURE_ prefix', () => {
      const result = normalizeUom('UNIT_OF_MEASURE_PCS');
      assert.strictEqual(result, 'PCS');
    });

    test('should normalize KG unit', () => {
      const result = normalizeUom('UNIT_OF_MEASURE_KG');
      assert.strictEqual(result, 'KG');
    });

    test('should normalize MT unit', () => {
      const result = normalizeUom('UNIT_OF_MEASURE_MT');
      assert.strictEqual(result, 'MT');
    });

    test('should return plain unit if no prefix', () => {
      const result = normalizeUom('PCS');
      assert.strictEqual(result, 'PCS');
    });

    test('should extract unit from item object', () => {
      const item = { unit: 'UNIT_OF_MEASURE_KG' };
      const result = normalizeUom(item);
      assert.strictEqual(result, 'KG');
    });

    test('should fallback to unit_of_measure field', () => {
      const item = { unit_of_measure: 'UNIT_OF_MEASURE_MT' };
      const result = normalizeUom(item);
      assert.strictEqual(result, 'MT');
    });

    test('should fallback to quantityUom', () => {
      const item = { quantityUom: 'UNIT_OF_MEASURE_PCS' };
      const result = normalizeUom(item);
      assert.strictEqual(result, 'PCS');
    });

    test('should default to PCS for empty input', () => {
      const result = normalizeUom('');
      assert.strictEqual(result, 'PCS');
    });

    test('should default to PCS for empty object', () => {
      const item = {};
      const result = normalizeUom(item);
      assert.strictEqual(result, 'PCS');
    });
  });
});
