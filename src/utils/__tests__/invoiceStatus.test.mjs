import '../../__tests__/init.mjs';
/**
 * Invoice Status Tests
 * Tests invoice status badge generation and payment/reminder logic
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  INVOICE_STATUS_CONFIG,
  getInvoiceStatusBadges,
} from '../invoiceStatus.js';

describe('invoiceStatus', () => {
  describe('INVOICE_STATUS_CONFIG', () => {
    test('should have all invoice status configurations', () => {
      assert.ok(INVOICE_STATUS_CONFIG.draft);
      assert.ok(INVOICE_STATUS_CONFIG.proforma);
      assert.ok(INVOICE_STATUS_CONFIG.sent);
      assert.ok(INVOICE_STATUS_CONFIG.issued);
      assert.ok(INVOICE_STATUS_CONFIG.overdue);
    });

    test('should have styling for each status', () => {
      const status = INVOICE_STATUS_CONFIG.draft;
      assert.ok(status.label);
      assert.ok(status.bgLight);
      assert.ok(status.bgDark);
      assert.ok(status.textLight);
      assert.ok(status.textDark);
      assert.ok(status.borderLight);
      assert.ok(status.borderDark);
    });

    test('should have distinct colors for different statuses', () => {
      const draft = INVOICE_STATUS_CONFIG.draft;
      const issued = INVOICE_STATUS_CONFIG.issued;
      assert.notStrictEqual(draft.label, issued.label);
    });
  });

  describe('getInvoiceStatusBadges()', () => {
    test('should return array of badges', () => {
      const invoice = { status: 'draft' };
      const badges = getInvoiceStatusBadges(invoice);
      assert.ok(Array.isArray(badges));
    });

    test('should include invoice status badge', () => {
      const invoice = { status: 'issued' };
      const badges = getInvoiceStatusBadges(invoice);
      assert.ok(badges.some(b => b.type === 'invoice_status'));
    });

    test('should return at least one badge', () => {
      const invoice = { status: 'draft' };
      const badges = getInvoiceStatusBadges(invoice);
      assert.ok(badges.length > 0);
    });

    test('should handle draft invoices', () => {
      const invoice = { status: 'draft' };
      const badges = getInvoiceStatusBadges(invoice);
      const statusBadge = badges.find(b => b.type === 'invoice_status');
      assert.ok(statusBadge);
      assert.ok(statusBadge.label.includes('DRAFT'));
    });

    test('should handle issued invoices', () => {
      const invoice = { status: 'issued', paymentStatus: 'unpaid' };
      const badges = getInvoiceStatusBadges(invoice);
      assert.ok(badges.length > 0);
    });

    test('should handle proforma invoices', () => {
      const invoice = { status: 'proforma' };
      const badges = getInvoiceStatusBadges(invoice);
      const statusBadge = badges.find(b => b.type === 'invoice_status');
      assert.ok(statusBadge);
    });

    test('should handle sent status', () => {
      const invoice = { status: 'sent' };
      const badges = getInvoiceStatusBadges(invoice);
      assert.ok(badges.length > 0);
    });

    test('should handle cancelled invoices', () => {
      const invoice = { status: 'cancelled' };
      const badges = getInvoiceStatusBadges(invoice);
      assert.ok(badges.length > 0);
    });

    test('should not include payment badge for draft invoices', () => {
      const invoice = { status: 'draft' };
      const badges = getInvoiceStatusBadges(invoice);
      assert.ok(!badges.some(b => b.type === 'payment_status'));
    });

    test('should include payment badge for issued unpaid invoices', () => {
      const invoice = {
        status: 'issued',
        paymentStatus: 'unpaid',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };
      const badges = getInvoiceStatusBadges(invoice);
      const paymentBadge = badges.find(b => b.type === 'payment_status');
      assert.ok(paymentBadge);
    });

    test('should handle unspecified status (proto default)', () => {
      const invoice = { status: 'unspecified' };
      const badges = getInvoiceStatusBadges(invoice);
      // Should treat as draft
      assert.ok(badges.length > 0);
    });

    test('should filter out null badges', () => {
      const invoice = { status: 'draft' };
      const badges = getInvoiceStatusBadges(invoice);
      assert.ok(!badges.includes(null));
      assert.ok(!badges.includes(undefined));
    });

    test('should have type property for all badges', () => {
      const invoice = { status: 'issued', paymentStatus: 'unpaid' };
      const badges = getInvoiceStatusBadges(invoice);
      badges.forEach(badge => {
        assert.ok(badge.type);
      });
    });

    test('should have label property for all badges', () => {
      const invoice = { status: 'issued', paymentStatus: 'unpaid' };
      const badges = getInvoiceStatusBadges(invoice);
      badges.forEach(badge => {
        assert.ok(badge.label);
      });
    });

    test('should handle partially paid invoices', () => {
      const invoice = {
        status: 'issued',
        paymentStatus: 'partially_paid',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };
      const badges = getInvoiceStatusBadges(invoice);
      const paymentBadge = badges.find(b => b.type === 'payment_status');
      assert.ok(paymentBadge);
    });

    test('should not include reminder for paid invoices', () => {
      const invoice = {
        status: 'issued',
        paymentStatus: 'paid',
        dueDate: new Date().toISOString(),
      };
      const badges = getInvoiceStatusBadges(invoice);
      assert.ok(!badges.some(b => b.type === 'reminder'));
    });

    test('should handle missing paymentStatus field', () => {
      const invoice = { status: 'issued' };
      const badges = getInvoiceStatusBadges(invoice);
      // Should not throw, should default to unpaid
      assert.ok(badges.length > 0);
    });

    test('should include all badge properties', () => {
      const invoice = { status: 'draft' };
      const badges = getInvoiceStatusBadges(invoice);
      badges.forEach(badge => {
        assert.ok(badge.type);
        assert.ok(badge.label);
        assert.ok(badge.config || badge.icon);
      });
    });

    test('should handle invoices with all payment statuses', () => {
      const statuses = ['unpaid', 'partially_paid', 'paid', 'fully_paid'];
      for (const paymentStatus of statuses) {
        const invoice = {
          status: 'issued',
          paymentStatus,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        };
        const badges = getInvoiceStatusBadges(invoice);
        assert.ok(badges.length > 0, `Failed for payment status: ${paymentStatus}`);
      }
    });

    test('should maintain consistent badge order', () => {
      const invoice = {
        status: 'issued',
        paymentStatus: 'unpaid',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      };
      const badges = getInvoiceStatusBadges(invoice);
      // Invoice status should be first
      assert.strictEqual(badges[0].type, 'invoice_status');
    });
  });

  describe('Badge Consistency', () => {
    test('should handle all valid invoice statuses', () => {
      const validStatuses = ['draft', 'pending', 'proforma', 'sent', 'issued', 'cancelled'];
      for (const status of validStatuses) {
        const invoice = { status };
        const badges = getInvoiceStatusBadges(invoice);
        assert.ok(badges.length > 0, `No badges for status: ${status}`);
      }
    });

    test('should provide badges without errors', () => {
      const testCases = [
        { status: 'draft' },
        { status: 'issued', paymentStatus: 'paid' },
        { status: 'issued', paymentStatus: 'unpaid', dueDate: new Date().toISOString() },
        { status: 'issued', paymentStatus: 'partially_paid' },
      ];

      for (const testCase of testCases) {
        assert.doesNotThrow(() => {
          getInvoiceStatusBadges(testCase);
        });
      }
    });
  });
});
