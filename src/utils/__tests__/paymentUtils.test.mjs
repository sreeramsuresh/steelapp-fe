import '../../__tests__/init.mjs';
/**
 * Payment Utilities Tests
 * Tests payment mode configs, calculations, and validation
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  PAYMENT_MODES,
  PAYMENT_STATUS,
  calculateTotalPaid,
  calculateBalanceDue,
  calculatePaymentStatus,
  getPaymentModeConfig,
  getPaymentStatusConfig,
  validatePayment,
  formatPaymentDisplay,
  getLastPaymentDate,
  generatePaymentId,
} from '../paymentUtils.js';

describe('paymentUtils', () => {
  describe('PAYMENT_MODES', () => {
    test('should have all standard payment modes', () => {
      assert.ok(PAYMENT_MODES.cash);
      assert.ok(PAYMENT_MODES.cheque);
      assert.ok(PAYMENT_MODES.pdc);
      assert.ok(PAYMENT_MODES.bank_transfer);
      assert.ok(PAYMENT_MODES.credit_card);
      assert.ok(PAYMENT_MODES.debit_card);
      assert.ok(PAYMENT_MODES.online);
      assert.ok(PAYMENT_MODES.wire_transfer);
      assert.ok(PAYMENT_MODES.mobile_wallet);
      assert.ok(PAYMENT_MODES.other);
    });

    test('should have correct structure for payment mode', () => {
      const mode = PAYMENT_MODES.cash;
      assert.ok(mode.value);
      assert.ok(mode.label);
      assert.ok(mode.icon);
      assert.ok(typeof mode.requiresRef === 'boolean');
      assert.ok(mode.color);
    });

    test('should set requiresRef correctly for modes', () => {
      assert.strictEqual(PAYMENT_MODES.cash.requiresRef, false);
      assert.strictEqual(PAYMENT_MODES.cheque.requiresRef, true);
      assert.strictEqual(PAYMENT_MODES.bank_transfer.requiresRef, true);
    });

    test('should have refLabel for modes that require ref', () => {
      assert.ok(PAYMENT_MODES.cheque.refLabel);
      assert.ok(PAYMENT_MODES.pdc.refLabel);
      assert.ok(PAYMENT_MODES.bank_transfer.refLabel);
    });
  });

  describe('PAYMENT_STATUS', () => {
    test('should have all payment status configurations', () => {
      assert.ok(PAYMENT_STATUS.unpaid);
      assert.ok(PAYMENT_STATUS.partially_paid);
      assert.ok(PAYMENT_STATUS.paid);
      assert.ok(PAYMENT_STATUS.fully_paid);
      assert.ok(PAYMENT_STATUS.overdue);
      assert.ok(PAYMENT_STATUS.overpaid);
    });

    test('should have correct styling classes for status', () => {
      const status = PAYMENT_STATUS.unpaid;
      assert.ok(status.bgLight);
      assert.ok(status.bgDark);
      assert.ok(status.textLight);
      assert.ok(status.textDark);
      assert.ok(status.borderLight);
      assert.ok(status.borderDark);
    });

    test('should have distinct colors for different statuses', () => {
      assert.strictEqual(PAYMENT_STATUS.unpaid.color, 'red');
      assert.strictEqual(PAYMENT_STATUS.partially_paid.color, 'yellow');
      assert.strictEqual(PAYMENT_STATUS.paid.color, 'green');
      assert.strictEqual(PAYMENT_STATUS.overpaid.color, 'blue');
    });
  });

  describe('calculateTotalPaid()', () => {
    test('should calculate total from valid payments array', () => {
      const payments = [
        { amount: 100 },
        { amount: 50 },
        { amount: 25 },
      ];
      const result = calculateTotalPaid(payments);
      assert.strictEqual(result, 175);
    });

    test('should return 0 for empty array', () => {
      const result = calculateTotalPaid([]);
      assert.strictEqual(result, 0);
    });

    test('should return 0 for null', () => {
      const result = calculateTotalPaid(null);
      assert.strictEqual(result, 0);
    });

    test('should return 0 for undefined', () => {
      const result = calculateTotalPaid(undefined);
      assert.strictEqual(result, 0);
    });

    test('should handle string amounts', () => {
      const payments = [
        { amount: '100' },
        { amount: '50.50' },
      ];
      const result = calculateTotalPaid(payments);
      assert.strictEqual(result, 150.5);
    });

    test('should handle mixed string and number amounts', () => {
      const payments = [
        { amount: 100 },
        { amount: '50.25' },
      ];
      const result = calculateTotalPaid(payments);
      assert.strictEqual(result, 150.25);
    });

    test('should ignore missing or invalid amounts', () => {
      const payments = [
        { amount: 100 },
        { amount: undefined },
        { amount: 'invalid' },
        { amount: 50 },
      ];
      const result = calculateTotalPaid(payments);
      assert.strictEqual(result, 150);
    });

    test('should handle negative amounts', () => {
      const payments = [
        { amount: 100 },
        { amount: -30 },
      ];
      const result = calculateTotalPaid(payments);
      assert.strictEqual(result, 70);
    });
  });

  describe('calculateBalanceDue()', () => {
    test('should calculate balance correctly', () => {
      const balance = calculateBalanceDue(1000, [
        { amount: 300 },
        { amount: 200 },
      ]);
      assert.strictEqual(balance, 500);
    });

    test('should return full amount when no payments', () => {
      const balance = calculateBalanceDue(1000, []);
      assert.strictEqual(balance, 1000);
    });

    test('should return 0 when fully paid', () => {
      const balance = calculateBalanceDue(1000, [{ amount: 1000 }]);
      assert.strictEqual(balance, 0);
    });

    test('should return 0 when overpaid (not negative)', () => {
      const balance = calculateBalanceDue(1000, [{ amount: 1500 }]);
      assert.strictEqual(balance, 0);
    });

    test('should handle string invoice total', () => {
      const balance = calculateBalanceDue('1000', [{ amount: 300 }]);
      assert.strictEqual(balance, 700);
    });

    test('should handle null invoice total', () => {
      const balance = calculateBalanceDue(null, []);
      assert.strictEqual(balance, 0);
    });

    test('should handle undefined invoice total', () => {
      const balance = calculateBalanceDue(undefined, []);
      assert.strictEqual(balance, 0);
    });
  });

  describe('calculatePaymentStatus()', () => {
    test('should return unpaid when no payments', () => {
      const status = calculatePaymentStatus(1000, []);
      assert.strictEqual(status, 'unpaid');
    });

    test('should return unpaid when total is 0', () => {
      const status = calculatePaymentStatus(0, []);
      assert.strictEqual(status, 'unpaid');
    });

    test('should return partially_paid with partial payments', () => {
      const status = calculatePaymentStatus(1000, [{ amount: 300 }]);
      assert.strictEqual(status, 'partially_paid');
    });

    test('should return fully_paid when paid in full', () => {
      const status = calculatePaymentStatus(1000, [{ amount: 1000 }]);
      assert.strictEqual(status, 'fully_paid');
    });

    test('should return fully_paid when overpaid', () => {
      const status = calculatePaymentStatus(1000, [{ amount: 1500 }]);
      assert.strictEqual(status, 'fully_paid');
    });

    test('should handle string amounts', () => {
      const status = calculatePaymentStatus('1000', [{ amount: '500' }]);
      assert.strictEqual(status, 'partially_paid');
    });
  });

  describe('getPaymentModeConfig()', () => {
    test('should return config for valid mode', () => {
      const config = getPaymentModeConfig('cash');
      assert.strictEqual(config.value, 'cash');
      assert.strictEqual(config.label, 'Cash');
      assert.strictEqual(config.requiresRef, false);
    });

    test('should be case insensitive', () => {
      const config = getPaymentModeConfig('CHEQUE');
      assert.strictEqual(config.value, 'cheque');
    });

    test('should handle spaces and convert to underscores', () => {
      const config = getPaymentModeConfig('bank transfer');
      assert.strictEqual(config.value, 'bank_transfer');
    });

    test('should match by label', () => {
      const config = getPaymentModeConfig('Cash');
      assert.strictEqual(config.value, 'cash');
    });

    test('should return other for unknown mode', () => {
      const config = getPaymentModeConfig('unknown_mode');
      assert.strictEqual(config.value, 'other');
    });

    test('should return other for null', () => {
      const config = getPaymentModeConfig(null);
      assert.strictEqual(config.value, 'other');
    });

    test('should return other for undefined', () => {
      const config = getPaymentModeConfig(undefined);
      assert.strictEqual(config.value, 'other');
    });

    test('should return other for empty string', () => {
      const config = getPaymentModeConfig('');
      assert.strictEqual(config.value, 'other');
    });
  });

  describe('getPaymentStatusConfig()', () => {
    test('should return config for valid status', () => {
      const config = getPaymentStatusConfig('unpaid');
      assert.strictEqual(config.value, 'unpaid');
      assert.ok(config.label);
      assert.ok(config.color);
    });

    test('should handle paid status', () => {
      const config = getPaymentStatusConfig('paid');
      assert.strictEqual(config.color, 'green');
    });

    test('should return unpaid for unknown status', () => {
      const config = getPaymentStatusConfig('unknown_status');
      assert.strictEqual(config.value, 'unpaid');
    });

    test('should return unpaid for null', () => {
      const config = getPaymentStatusConfig(null);
      assert.strictEqual(config.value, 'unpaid');
    });
  });

  describe('validatePayment()', () => {
    test('should pass validation for correct payment', () => {
      const payment = {
        amount: 100,
        date: '2024-01-15',
        paymentMethod: 'cash',
      };
      const errors = validatePayment(payment, 1000, []);
      const criticalErrors = errors.filter(e => !e.includes('Warning'));
      assert.strictEqual(criticalErrors.length, 0);
    });

    test('should require amount', () => {
      const payment = {
        date: '2024-01-15',
        paymentMethod: 'cash',
      };
      const errors = validatePayment(payment, 1000, []);
      assert.ok(errors.some(e => e.includes('Amount')));
    });

    test('should reject negative amount', () => {
      const payment = {
        amount: -100,
        date: '2024-01-15',
        paymentMethod: 'cash',
      };
      const errors = validatePayment(payment, 1000, []);
      assert.ok(errors.some(e => e.includes('Amount')));
    });

    test('should reject zero amount', () => {
      const payment = {
        amount: 0,
        date: '2024-01-15',
        paymentMethod: 'cash',
      };
      const errors = validatePayment(payment, 1000, []);
      assert.ok(errors.some(e => e.includes('Amount')));
    });

    test('should require date', () => {
      const payment = {
        amount: 100,
        paymentMethod: 'cash',
      };
      const errors = validatePayment(payment, 1000, []);
      assert.ok(errors.some(e => e.includes('date')));
    });

    test('should require payment method', () => {
      const payment = {
        amount: 100,
        date: '2024-01-15',
      };
      const errors = validatePayment(payment, 1000, []);
      assert.ok(errors.some(e => e.includes('Payment mode')));
    });

    test('should require reference for cheque payments', () => {
      const payment = {
        amount: 100,
        date: '2024-01-15',
        paymentMethod: 'cheque',
      };
      const errors = validatePayment(payment, 1000, []);
      assert.ok(errors.some(e => e.includes('Reference number')));
    });

    test('should not require reference for cash payments', () => {
      const payment = {
        amount: 100,
        date: '2024-01-15',
        paymentMethod: 'cash',
      };
      const errors = validatePayment(payment, 1000, []);
      const refErrors = errors.filter(e => e.includes('Reference'));
      assert.strictEqual(refErrors.length, 0);
    });

    test('should warn when payment exceeds balance', () => {
      const payment = {
        amount: 1500,
        date: '2024-01-15',
        paymentMethod: 'cash',
      };
      const errors = validatePayment(payment, 1000, []);
      assert.ok(errors.some(e => e.includes('Warning')));
    });

    test('should accept paymentMode field name', () => {
      const payment = {
        amount: 100,
        date: '2024-01-15',
        paymentMode: 'cash',
      };
      const errors = validatePayment(payment, 1000, []);
      const methodErrors = errors.filter(e => e.includes('Payment mode'));
      assert.strictEqual(methodErrors.length, 0);
    });
  });

  describe('formatPaymentDisplay()', () => {
    test('should format payment correctly', () => {
      const payment = {
        amount: 500,
        date: '2024-01-15',
        paymentMethod: 'cash',
      };
      const formatted = formatPaymentDisplay(payment);
      assert.ok(formatted.modeLabel);
      assert.ok(formatted.modeIcon);
      assert.ok(formatted.formattedAmount);
      assert.ok(formatted.formattedDate);
    });

    test('should format amount as AED currency', () => {
      const payment = {
        amount: 1000,
        date: '2024-01-15',
        paymentMethod: 'cash',
      };
      const formatted = formatPaymentDisplay(payment);
      assert.ok(formatted.formattedAmount.includes('AED') || formatted.formattedAmount.includes('1,000'));
    });

    test('should handle null date', () => {
      const payment = {
        amount: 500,
        date: null,
        paymentMethod: 'cash',
      };
      const formatted = formatPaymentDisplay(payment);
      assert.strictEqual(formatted.formattedDate, 'N/A');
    });

    test('should accept paymentMode field', () => {
      const payment = {
        amount: 500,
        date: '2024-01-15',
        paymentMode: 'cheque',
      };
      const formatted = formatPaymentDisplay(payment);
      assert.strictEqual(formatted.modeLabel, 'Cheque');
    });

    test('should accept paymentDate field name', () => {
      const payment = {
        amount: 500,
        paymentDate: '2024-01-15',
        paymentMethod: 'cash',
      };
      const formatted = formatPaymentDisplay(payment);
      assert.ok(formatted.formattedDate !== 'N/A');
    });

    test('should handle invalid date format', () => {
      const payment = {
        amount: 500,
        date: 'invalid-date',
        paymentMethod: 'cash',
      };
      const formatted = formatPaymentDisplay(payment);
      // Invalid dates return N/A from the catch block
      assert.ok(formatted.formattedDate === 'N/A' || formatted.formattedDate === 'Invalid Date');
    });

    test('should handle missing amount', () => {
      const payment = {
        date: '2024-01-15',
        paymentMethod: 'cash',
      };
      const formatted = formatPaymentDisplay(payment);
      assert.ok(formatted.formattedAmount);
    });
  });

  describe('getLastPaymentDate()', () => {
    test('should return most recent payment date', () => {
      const payments = [
        { date: '2024-01-10' },
        { date: '2024-01-20' },
        { date: '2024-01-15' },
      ];
      const lastDate = getLastPaymentDate(payments);
      assert.strictEqual(lastDate, '2024-01-20');
    });

    test('should return null for empty array', () => {
      const lastDate = getLastPaymentDate([]);
      assert.strictEqual(lastDate, null);
    });

    test('should return null for null input', () => {
      const lastDate = getLastPaymentDate(null);
      assert.strictEqual(lastDate, null);
    });

    test('should return null for undefined', () => {
      const lastDate = getLastPaymentDate(undefined);
      assert.strictEqual(lastDate, null);
    });

    test('should return single payment date', () => {
      const payments = [{ date: '2024-01-15' }];
      const lastDate = getLastPaymentDate(payments);
      assert.strictEqual(lastDate, '2024-01-15');
    });

    test('should handle ISO date format', () => {
      const payments = [
        { date: '2024-01-10T10:00:00Z' },
        { date: '2024-01-20T15:00:00Z' },
      ];
      const lastDate = getLastPaymentDate(payments);
      assert.ok(lastDate.includes('2024-01-20'));
    });
  });

  describe('generatePaymentId()', () => {
    test('should generate unique IDs', () => {
      const id1 = generatePaymentId();
      const id2 = generatePaymentId();
      assert.notStrictEqual(id1, id2);
    });

    test('should use PAY- prefix', () => {
      const id = generatePaymentId();
      assert.ok(id.startsWith('PAY-'));
    });

    test('should include timestamp', () => {
      const id = generatePaymentId();
      const parts = id.split('-');
      assert.strictEqual(parts.length, 3);
      assert.ok(!isNaN(parseInt(parts[1])));
    });

    test('should have sufficient length for uniqueness', () => {
      const id = generatePaymentId();
      assert.ok(id.length > 20);
    });

    test('should generate alphanumeric IDs', () => {
      const id = generatePaymentId();
      // Should match pattern PAY-[timestamp]-[alphanumeric]
      assert.ok(/^PAY-\d+-[a-z0-9]+$/.test(id));
    });
  });
});
