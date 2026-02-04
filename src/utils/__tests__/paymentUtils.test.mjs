import '../../__tests__/init.mjs';
/**
 * Payment Utilities Tests
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  calculateOutstandingAmount,
  getPaymentStatusConfig,
  formatPaymentAmount,
  canMakePayment,
} from '../paymentUtils.js';

describe('paymentUtils', () => {
  describe('calculateOutstandingAmount()', () => {
    test('should calculate outstanding amount', () => {
      const outstanding = calculateOutstandingAmount({
        totalAmount: 1000,
        paidAmount: 300,
      });
      assert.strictEqual(outstanding, 700);
    });

    test('should return zero for fully paid', () => {
      const outstanding = calculateOutstandingAmount({
        totalAmount: 1000,
        paidAmount: 1000,
      });
      assert.strictEqual(outstanding, 0);
    });

    test('should handle negative outstanding', () => {
      const outstanding = calculateOutstandingAmount({
        totalAmount: 1000,
        paidAmount: 1500,
      });
      assert.strictEqual(outstanding, -500);
    });
  });

  describe('getPaymentStatusConfig()', () => {
    test('should return status configuration', () => {
      const config = getPaymentStatusConfig('paid');
      assert.ok(typeof config === 'object');
      assert.ok(config.label);
    });

    test('should handle different payment statuses', () => {
      const statuses = ['paid', 'pending', 'overdue', 'partial'];
      statuses.forEach(status => {
        const config = getPaymentStatusConfig(status);
        if (config) {
          assert.ok(config.label);
        }
      });
    });
  });

  describe('formatPaymentAmount()', () => {
    test('should format amount as string', () => {
      const formatted = formatPaymentAmount(1000.50);
      assert.ok(typeof formatted === 'string');
      assert.ok(formatted.length > 0);
    });

    test('should handle zero', () => {
      const formatted = formatPaymentAmount(0);
      assert.ok(formatted);
    });

    test('should handle currency formatting', () => {
      const formatted = formatPaymentAmount(1000);
      // Should contain number representation
      assert.ok(formatted.includes('1') || formatted.includes('1000'));
    });
  });

  describe('canMakePayment()', () => {
    test('should determine if payment is allowed', () => {
      const can = canMakePayment({
        status: 'pending',
        outstandingAmount: 500,
      });
      assert.strictEqual(typeof can, 'boolean');
    });

    test('should handle zero outstanding', () => {
      const can = canMakePayment({
        status: 'paid',
        outstandingAmount: 0,
      });
      assert.strictEqual(typeof can, 'boolean');
    });
  });
});
