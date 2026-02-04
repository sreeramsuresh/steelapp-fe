import '../../__tests__/init.mjs';
/**
 * Invoice Types Tests
 * Tests invoice and payment status type validation
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  VALID_INVOICE_STATUSES,
  VALID_PAYMENT_STATUSES,
  isValidInvoiceStatus,
  isValidPaymentStatus,
  assertValidInvoiceStatus,
  assertValidPaymentStatus,
  getInvoiceStatusLabel,
  getPaymentStatusLabel,
} from '../invoiceTypes.js';

describe('invoiceTypes', () => {
  describe('VALID_INVOICE_STATUSES', () => {
    test('should contain draft status', () => {
      assert.ok(VALID_INVOICE_STATUSES.includes('draft'));
    });

    test('should contain pending status', () => {
      assert.ok(VALID_INVOICE_STATUSES.includes('pending'));
    });

    test('should contain proforma status', () => {
      assert.ok(VALID_INVOICE_STATUSES.includes('proforma'));
    });

    test('should contain issued status', () => {
      assert.ok(VALID_INVOICE_STATUSES.includes('issued'));
    });

    test('should contain sent status', () => {
      assert.ok(VALID_INVOICE_STATUSES.includes('sent'));
    });

    test('should contain cancelled status', () => {
      assert.ok(VALID_INVOICE_STATUSES.includes('cancelled'));
    });

    test('should contain unspecified status for proto enum default', () => {
      assert.ok(VALID_INVOICE_STATUSES.includes('unspecified'));
    });

    test('should be an array', () => {
      assert.ok(Array.isArray(VALID_INVOICE_STATUSES));
    });
  });

  describe('VALID_PAYMENT_STATUSES', () => {
    test('should contain unpaid status', () => {
      assert.ok(VALID_PAYMENT_STATUSES.includes('unpaid'));
    });

    test('should contain partially_paid status', () => {
      assert.ok(VALID_PAYMENT_STATUSES.includes('partially_paid'));
    });

    test('should contain paid status', () => {
      assert.ok(VALID_PAYMENT_STATUSES.includes('paid'));
    });

    test('should contain fully_paid status for legacy support', () => {
      assert.ok(VALID_PAYMENT_STATUSES.includes('fully_paid'));
    });

    test('should be an array', () => {
      assert.ok(Array.isArray(VALID_PAYMENT_STATUSES));
    });
  });

  describe('isValidInvoiceStatus()', () => {
    test('should return true for draft', () => {
      assert.strictEqual(isValidInvoiceStatus('draft'), true);
    });

    test('should return true for issued', () => {
      assert.strictEqual(isValidInvoiceStatus('issued'), true);
    });

    test('should return true for unspecified', () => {
      assert.strictEqual(isValidInvoiceStatus('unspecified'), true);
    });

    test('should return false for invalid status', () => {
      assert.strictEqual(isValidInvoiceStatus('invalid_status'), false);
    });

    test('should return false for null', () => {
      assert.strictEqual(isValidInvoiceStatus(null), false);
    });

    test('should return false for undefined', () => {
      assert.strictEqual(isValidInvoiceStatus(undefined), false);
    });

    test('should return false for empty string', () => {
      assert.strictEqual(isValidInvoiceStatus(''), false);
    });

    test('should return false for case-sensitive mismatch', () => {
      assert.strictEqual(isValidInvoiceStatus('DRAFT'), false);
    });

    test('should check all valid statuses correctly', () => {
      for (const status of VALID_INVOICE_STATUSES) {
        assert.strictEqual(isValidInvoiceStatus(status), true, `Failed for ${status}`);
      }
    });
  });

  describe('isValidPaymentStatus()', () => {
    test('should return true for unpaid', () => {
      assert.strictEqual(isValidPaymentStatus('unpaid'), true);
    });

    test('should return true for partially_paid', () => {
      assert.strictEqual(isValidPaymentStatus('partially_paid'), true);
    });

    test('should return true for paid', () => {
      assert.strictEqual(isValidPaymentStatus('paid'), true);
    });

    test('should return true for fully_paid', () => {
      assert.strictEqual(isValidPaymentStatus('fully_paid'), true);
    });

    test('should return false for invalid status', () => {
      assert.strictEqual(isValidPaymentStatus('invalid_status'), false);
    });

    test('should return false for null', () => {
      assert.strictEqual(isValidPaymentStatus(null), false);
    });

    test('should return false for undefined', () => {
      assert.strictEqual(isValidPaymentStatus(undefined), false);
    });

    test('should return false for empty string', () => {
      assert.strictEqual(isValidPaymentStatus(''), false);
    });

    test('should return false for case-sensitive mismatch', () => {
      assert.strictEqual(isValidPaymentStatus('PAID'), false);
    });

    test('should check all valid statuses correctly', () => {
      for (const status of VALID_PAYMENT_STATUSES) {
        assert.strictEqual(isValidPaymentStatus(status), true, `Failed for ${status}`);
      }
    });
  });

  describe('assertValidInvoiceStatus()', () => {
    test('should not throw for valid status', () => {
      assert.doesNotThrow(() => {
        assertValidInvoiceStatus('draft', 'test_context');
      });
    });

    test('should not throw for any valid status', () => {
      for (const status of VALID_INVOICE_STATUSES) {
        assert.doesNotThrow(() => {
          assertValidInvoiceStatus(status, 'test');
        });
      }
    });

    test('should not throw in production', () => {
      const originalEnv = process.env.NODE_ENV;
      try {
        process.env.NODE_ENV = 'production';
        assert.doesNotThrow(() => {
          assertValidInvoiceStatus('invalid_status', 'test');
        });
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });

    test('should accept context parameter', () => {
      assert.doesNotThrow(() => {
        assertValidInvoiceStatus('draft', 'custom_context');
      });
    });

    test('should have default context', () => {
      assert.doesNotThrow(() => {
        assertValidInvoiceStatus('draft');
      });
    });
  });

  describe('assertValidPaymentStatus()', () => {
    test('should not throw for valid status', () => {
      assert.doesNotThrow(() => {
        assertValidPaymentStatus('unpaid', 'test_context');
      });
    });

    test('should not throw for any valid status', () => {
      for (const status of VALID_PAYMENT_STATUSES) {
        assert.doesNotThrow(() => {
          assertValidPaymentStatus(status, 'test');
        });
      }
    });

    test('should not throw in production', () => {
      const originalEnv = process.env.NODE_ENV;
      try {
        process.env.NODE_ENV = 'production';
        assert.doesNotThrow(() => {
          assertValidPaymentStatus('invalid_status', 'test');
        });
      } finally {
        process.env.NODE_ENV = originalEnv;
      }
    });

    test('should accept context parameter', () => {
      assert.doesNotThrow(() => {
        assertValidPaymentStatus('paid', 'custom_context');
      });
    });

    test('should have default context', () => {
      assert.doesNotThrow(() => {
        assertValidPaymentStatus('unpaid');
      });
    });
  });

  describe('getInvoiceStatusLabel()', () => {
    test('should return Draft for draft status', () => {
      const label = getInvoiceStatusLabel('draft');
      assert.strictEqual(label, 'Draft');
    });

    test('should return Pending for pending status', () => {
      const label = getInvoiceStatusLabel('pending');
      assert.strictEqual(label, 'Pending');
    });

    test('should return Proforma for proforma status', () => {
      const label = getInvoiceStatusLabel('proforma');
      assert.strictEqual(label, 'Proforma');
    });

    test('should return Sent for sent status', () => {
      const label = getInvoiceStatusLabel('sent');
      assert.strictEqual(label, 'Sent');
    });

    test('should return Issued for issued status', () => {
      const label = getInvoiceStatusLabel('issued');
      assert.strictEqual(label, 'Issued');
    });

    test('should return Cancelled for cancelled status', () => {
      const label = getInvoiceStatusLabel('cancelled');
      assert.strictEqual(label, 'Cancelled');
    });

    test('should return Unknown for invalid status', () => {
      const label = getInvoiceStatusLabel('invalid_status');
      assert.strictEqual(label, 'Unknown');
    });

    test('should return Unknown for null', () => {
      const label = getInvoiceStatusLabel(null);
      assert.strictEqual(label, 'Unknown');
    });

    test('should return Unknown for undefined', () => {
      const label = getInvoiceStatusLabel(undefined);
      assert.strictEqual(label, 'Unknown');
    });

    test('should return capitalized labels', () => {
      const label = getInvoiceStatusLabel('draft');
      assert.strictEqual(label[0], label[0].toUpperCase());
    });

    test('should return label for all valid statuses', () => {
      for (const status of VALID_INVOICE_STATUSES) {
        const label = getInvoiceStatusLabel(status);
        assert.strictEqual(typeof label, 'string');
        assert.ok(label.length > 0);
      }
    });
  });

  describe('getPaymentStatusLabel()', () => {
    test('should return Unpaid for unpaid status', () => {
      const label = getPaymentStatusLabel('unpaid');
      assert.strictEqual(label, 'Unpaid');
    });

    test('should return Partially Paid for partially_paid status', () => {
      const label = getPaymentStatusLabel('partially_paid');
      assert.strictEqual(label, 'Partially Paid');
    });

    test('should return Paid for paid status', () => {
      const label = getPaymentStatusLabel('paid');
      assert.strictEqual(label, 'Paid');
    });

    test('should return Paid for fully_paid status (legacy support)', () => {
      const label = getPaymentStatusLabel('fully_paid');
      assert.strictEqual(label, 'Paid');
    });

    test('should return Unknown for invalid status', () => {
      const label = getPaymentStatusLabel('invalid_status');
      assert.strictEqual(label, 'Unknown');
    });

    test('should return Unknown for null', () => {
      const label = getPaymentStatusLabel(null);
      assert.strictEqual(label, 'Unknown');
    });

    test('should return Unknown for undefined', () => {
      const label = getPaymentStatusLabel(undefined);
      assert.strictEqual(label, 'Unknown');
    });

    test('should return capitalized labels', () => {
      const label = getPaymentStatusLabel('unpaid');
      assert.strictEqual(label[0], label[0].toUpperCase());
    });

    test('should handle underscores in status names', () => {
      const label = getPaymentStatusLabel('partially_paid');
      assert.strictEqual(label, 'Partially Paid');
    });

    test('should return label for all valid statuses', () => {
      for (const status of VALID_PAYMENT_STATUSES) {
        const label = getPaymentStatusLabel(status);
        assert.strictEqual(typeof label, 'string');
        assert.ok(label.length > 0);
      }
    });
  });

  describe('Status Consistency', () => {
    test('should have consistent invoice status definitions', () => {
      const statuses = ['draft', 'pending', 'proforma', 'issued', 'sent', 'cancelled'];
      for (const status of statuses) {
        assert.ok(VALID_INVOICE_STATUSES.includes(status), `Missing ${status}`);
      }
    });

    test('should have consistent payment status definitions', () => {
      const statuses = ['unpaid', 'partially_paid', 'paid', 'fully_paid'];
      for (const status of statuses) {
        assert.ok(VALID_PAYMENT_STATUSES.includes(status), `Missing ${status}`);
      }
    });

    test('should map all invoice statuses to labels', () => {
      for (const status of VALID_INVOICE_STATUSES) {
        const label = getInvoiceStatusLabel(status);
        assert.notStrictEqual(label, 'Unknown', `No label for invoice status: ${status}`);
      }
    });

    test('should map all payment statuses to labels', () => {
      for (const status of VALID_PAYMENT_STATUSES) {
        const label = getPaymentStatusLabel(status);
        assert.notStrictEqual(label, 'Unknown', `No label for payment status: ${status}`);
      }
    });
  });
});
