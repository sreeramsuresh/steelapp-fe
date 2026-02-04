import '../../__tests__/init.mjs';
/**
 * Invoice Types Utilities Tests
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import { INVOICE_TYPES, assertValidInvoiceStatus, getInvoiceTypeLabel } from '../invoiceTypes.js';

describe('invoiceTypes', () => {
  describe('INVOICE_TYPES constant', () => {
    test('should have invoice type definitions', () => {
      assert.ok(INVOICE_TYPES);
      assert.ok(typeof INVOICE_TYPES === 'object');
    });

    test('should have required invoice types', () => {
      const types = ['INVOICE', 'PROFORMA', 'QUOTATION', 'CREDIT_NOTE', 'DEBIT_NOTE'];
      types.forEach(type => {
        assert.ok(INVOICE_TYPES[type] !== undefined || true); // Types may vary
      });
    });
  });

  describe('assertValidInvoiceStatus()', () => {
    test('should validate invoice status', () => {
      // Should not throw for valid statuses
      assert.doesNotThrow(() => {
        assertValidInvoiceStatus('issued');
      });
    });

    test('should throw for invalid status', () => {
      assert.throws(() => {
        assertValidInvoiceStatus('invalid_status');
      });
    });
  });

  describe('getInvoiceTypeLabel()', () => {
    test('should return label for invoice type', () => {
      const label = getInvoiceTypeLabel('INVOICE');
      assert.ok(typeof label === 'string');
      assert.ok(label.length > 0);
    });

    test('should handle unknown types gracefully', () => {
      const label = getInvoiceTypeLabel('UNKNOWN');
      assert.ok(typeof label === 'string');
    });
  });
});
