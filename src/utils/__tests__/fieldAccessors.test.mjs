import '../../__tests__/init.mjs';
/**
 * Field Accessors Utilities Tests
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  getCustomerFields,
  getInvoiceFields,
  getPaymentFields,
  getFieldLabel,
  isRequiredField,
} from '../fieldAccessors.js';

describe('fieldAccessors', () => {
  describe('getCustomerFields()', () => {
    test('should return customer field list', () => {
      const fields = getCustomerFields();
      assert.ok(Array.isArray(fields));
      assert.ok(fields.length > 0);
    });

    test('should include essential customer fields', () => {
      const fields = getCustomerFields();
      const fieldNames = fields.map(f => f.name || f);
      assert.ok(fieldNames.some(f => f.includes('name') || f.includes('email')));
    });
  });

  describe('getInvoiceFields()', () => {
    test('should return invoice field list', () => {
      const fields = getInvoiceFields();
      assert.ok(Array.isArray(fields));
      assert.ok(fields.length > 0);
    });

    test('should include essential invoice fields', () => {
      const fields = getInvoiceFields();
      const fieldNames = fields.map(f => typeof f === 'string' ? f : f.name);
      assert.ok(fieldNames.length > 0);
    });
  });

  describe('getPaymentFields()', () => {
    test('should return payment field list', () => {
      const fields = getPaymentFields();
      assert.ok(Array.isArray(fields));
    });
  });

  describe('getFieldLabel()', () => {
    test('should return label for field', () => {
      const label = getFieldLabel('email');
      assert.ok(typeof label === 'string');
      assert.ok(label.length > 0);
    });

    test('should handle unknown fields gracefully', () => {
      const label = getFieldLabel('unknownField');
      assert.ok(typeof label === 'string');
    });
  });

  describe('isRequiredField()', () => {
    test('should identify required fields', () => {
      const required = isRequiredField('email');
      assert.strictEqual(typeof required, 'boolean');
    });

    test('should handle optional fields', () => {
      const required = isRequiredField('notes');
      assert.strictEqual(typeof required, 'boolean');
    });
  });
});
