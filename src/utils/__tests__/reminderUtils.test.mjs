import '../../__tests__/init.mjs';
/**
 * Reminder Utils Tests
 * Tests payment reminder calculations and configurations
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  REMINDER_TYPES,
  REMINDER_CONFIG,
  calculateDaysUntilDue,
  getReminderType,
  getInvoiceReminderInfo,
  formatDaysMessage,
  formatPromiseMessage,
  getPromiseIndicatorInfo,
} from '../reminderUtils.js';

describe('reminderUtils', () => {
  describe('REMINDER_TYPES', () => {
    test('should have all reminder type constants', () => {
      assert.ok(REMINDER_TYPES.ADVANCE);
      assert.ok(REMINDER_TYPES.DUE_SOON);
      assert.ok(REMINDER_TYPES.DUE_TODAY);
      assert.ok(REMINDER_TYPES.POLITE_OVERDUE);
      assert.ok(REMINDER_TYPES.URGENT_OVERDUE);
      assert.ok(REMINDER_TYPES.FINAL_OVERDUE);
    });

    test('should have string values for reminder types', () => {
      assert.strictEqual(typeof REMINDER_TYPES.ADVANCE, 'string');
      assert.strictEqual(typeof REMINDER_TYPES.DUE_SOON, 'string');
    });
  });

  describe('REMINDER_CONFIG', () => {
    test('should have config for all reminder types', () => {
      assert.ok(REMINDER_CONFIG[REMINDER_TYPES.ADVANCE]);
      assert.ok(REMINDER_CONFIG[REMINDER_TYPES.DUE_SOON]);
      assert.ok(REMINDER_CONFIG[REMINDER_TYPES.DUE_TODAY]);
      assert.ok(REMINDER_CONFIG[REMINDER_TYPES.POLITE_OVERDUE]);
      assert.ok(REMINDER_CONFIG[REMINDER_TYPES.URGENT_OVERDUE]);
      assert.ok(REMINDER_CONFIG[REMINDER_TYPES.FINAL_OVERDUE]);
    });

    test('should have styling for each reminder type', () => {
      const config = REMINDER_CONFIG[REMINDER_TYPES.ADVANCE];
      assert.ok(config.label);
      assert.ok(config.icon);
      assert.ok(config.color);
      assert.ok(config.bgLight);
      assert.ok(config.bgDark);
      assert.ok(config.textLight);
      assert.ok(config.textDark);
    });

    test('should have distinct colors for different reminder types', () => {
      const advance = REMINDER_CONFIG[REMINDER_TYPES.ADVANCE];
      const overdue = REMINDER_CONFIG[REMINDER_TYPES.POLITE_OVERDUE];
      assert.notStrictEqual(advance.color, overdue.color);
    });
  });

  describe('calculateDaysUntilDue()', () => {
    test('should return 0 for no due date', () => {
      const days = calculateDaysUntilDue(null);
      assert.strictEqual(days, 0);
    });

    test('should return 0 for empty due date', () => {
      const days = calculateDaysUntilDue('');
      assert.strictEqual(days, 0);
    });

    test('should return positive number for future dates', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const days = calculateDaysUntilDue(tomorrow.toISOString());
      assert.ok(days >= 1);
    });

    test('should return negative number for past dates', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const days = calculateDaysUntilDue(yesterday.toISOString());
      assert.ok(days <= -1);
    });

    test('should calculate correct days for week ahead', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 7);
      const days = calculateDaysUntilDue(futureDate.toISOString());
      assert.ok(days >= 6 && days <= 7);
    });

    test('should handle ISO date format', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);
      const isoDate = futureDate.toISOString();
      const days = calculateDaysUntilDue(isoDate);
      assert.ok(days >= 4 && days <= 5);
    });
  });

  describe('getReminderType()', () => {
    test('should return ADVANCE for 7+ days before due', () => {
      const type = getReminderType(10);
      assert.strictEqual(type, REMINDER_TYPES.ADVANCE);
    });

    test('should return DUE_SOON for 1-6 days before due', () => {
      const type = getReminderType(5);
      assert.strictEqual(type, REMINDER_TYPES.DUE_SOON);
    });

    test('should return DUE_TODAY for 0 days', () => {
      const type = getReminderType(0);
      assert.strictEqual(type, REMINDER_TYPES.DUE_TODAY);
    });

    test('should return POLITE_OVERDUE for 1-7 days overdue', () => {
      const type = getReminderType(-3);
      assert.strictEqual(type, REMINDER_TYPES.POLITE_OVERDUE);
    });

    test('should return URGENT_OVERDUE for 8-30 days overdue', () => {
      const type = getReminderType(-15);
      assert.strictEqual(type, REMINDER_TYPES.URGENT_OVERDUE);
    });

    test('should return FINAL_OVERDUE for 31+ days overdue', () => {
      const type = getReminderType(-40);
      assert.strictEqual(type, REMINDER_TYPES.FINAL_OVERDUE);
    });

    test('should handle boundary values', () => {
      assert.strictEqual(getReminderType(7), REMINDER_TYPES.ADVANCE);
      assert.strictEqual(getReminderType(6), REMINDER_TYPES.DUE_SOON);
      assert.strictEqual(getReminderType(1), REMINDER_TYPES.DUE_SOON);
      assert.strictEqual(getReminderType(-7), REMINDER_TYPES.POLITE_OVERDUE);
      assert.strictEqual(getReminderType(-8), REMINDER_TYPES.URGENT_OVERDUE);
      assert.strictEqual(getReminderType(-30), REMINDER_TYPES.URGENT_OVERDUE);
      assert.strictEqual(getReminderType(-31), REMINDER_TYPES.FINAL_OVERDUE);
    });
  });

  describe('getInvoiceReminderInfo()', () => {
    test('should return null for non-issued invoices', () => {
      const invoice = { status: 'draft', total: 1000, payments: [] };
      const info = getInvoiceReminderInfo(invoice);
      assert.strictEqual(info, null);
    });

    test('should return null for paid invoices', () => {
      const invoice = {
        status: 'issued',
        paymentStatus: 'paid',
        total: 1000,
        payments: [{ amount: 1000 }],
        dueDate: new Date().toISOString(),
      };
      const info = getInvoiceReminderInfo(invoice);
      assert.strictEqual(info, null);
    });

    test('should return reminder info for unpaid invoices', () => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 5);
      const invoice = {
        status: 'issued',
        paymentStatus: 'unpaid',
        total: 1000,
        payments: [],
        dueDate: dueDate.toISOString(),
      };
      const info = getInvoiceReminderInfo(invoice);
      assert.ok(info);
      assert.ok(info.type);
      assert.ok(info.config);
      assert.ok(info.daysUntilDue);
      assert.ok(info.balanceDue);
    });

    test('should calculate balance due correctly', () => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 5);
      const invoice = {
        status: 'issued',
        paymentStatus: 'partially_paid',
        total: 1000,
        payments: [{ amount: 300 }],
        dueDate: dueDate.toISOString(),
      };
      const info = getInvoiceReminderInfo(invoice);
      assert.strictEqual(info.balanceDue, 700);
    });

    test('should handle status normalization', () => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 3);
      const invoice = {
        status: 'STATUS_ISSUED', // Proto enum format
        paymentStatus: 'PAYMENT_STATUS_UNPAID',
        total: 1000,
        payments: [],
        dueDate: dueDate.toISOString(),
      };
      const info = getInvoiceReminderInfo(invoice);
      assert.ok(info);
    });
  });

  describe('formatDaysMessage()', () => {
    test('should format "Due Today" message for 0 days', () => {
      const message = formatDaysMessage(0);
      assert.strictEqual(message, 'Due Today');
    });

    test('should format singular day message', () => {
      const message = formatDaysMessage(1);
      assert.strictEqual(message, 'Payment due in 1 day');
    });

    test('should format plural days message', () => {
      const message = formatDaysMessage(5);
      assert.strictEqual(message, 'Payment due in 5 days');
    });

    test('should format overdue singular message', () => {
      const message = formatDaysMessage(-1);
      assert.strictEqual(message, '1 day overdue');
    });

    test('should format overdue plural message', () => {
      const message = formatDaysMessage(-7);
      assert.strictEqual(message, '7 days overdue');
    });

    test('should return string', () => {
      const message = formatDaysMessage(10);
      assert.strictEqual(typeof message, 'string');
    });
  });

  describe('formatPromiseMessage()', () => {
    test('should format "Promised Today" message for 0 days', () => {
      const message = formatPromiseMessage(0);
      assert.strictEqual(message, 'Promised Today');
    });

    test('should format singular day message', () => {
      const message = formatPromiseMessage(1);
      assert.strictEqual(message, 'Promised in 1 day');
    });

    test('should format plural days message', () => {
      const message = formatPromiseMessage(5);
      assert.strictEqual(message, 'Promised in 5 days');
    });

    test('should format broken promise singular message', () => {
      const message = formatPromiseMessage(-1);
      assert.strictEqual(message, 'Promise 1 day late');
    });

    test('should format broken promise plural message', () => {
      const message = formatPromiseMessage(-7);
      assert.strictEqual(message, 'Promise 7 days late');
    });
  });

  describe('getPromiseIndicatorInfo()', () => {
    test('should return null for non-issued invoices', () => {
      const invoice = { status: 'draft' };
      const reminder = { promisedDate: new Date().toISOString() };
      const info = getPromiseIndicatorInfo(invoice, reminder);
      assert.strictEqual(info, null);
    });

    test('should return null without promised date', () => {
      const invoice = { status: 'issued' };
      const reminder = {};
      const info = getPromiseIndicatorInfo(invoice, reminder);
      assert.strictEqual(info, null);
    });

    test('should return null for null reminder', () => {
      const invoice = { status: 'issued' };
      const info = getPromiseIndicatorInfo(invoice, null);
      assert.strictEqual(info, null);
    });

    test('should return promise info for valid invoice with promise', () => {
      const promiseDate = new Date();
      promiseDate.setDate(promiseDate.getDate() + 3);
      const invoice = {
        status: 'issued',
        paymentStatus: 'unpaid',
        total: 1000,
        payments: [],
      };
      const reminder = {
        promisedDate: promiseDate.toISOString(),
        promisedAmount: 500,
      };
      const info = getPromiseIndicatorInfo(invoice, reminder);
      assert.ok(info);
      assert.ok(info.config);
      assert.ok(info.daysUntilPromised);
    });

    test('should return null for paid invoices', () => {
      const promiseDate = new Date();
      promiseDate.setDate(promiseDate.getDate() + 3);
      const invoice = {
        status: 'issued',
        paymentStatus: 'paid',
        total: 1000,
        payments: [{ amount: 1000 }],
      };
      const reminder = { promisedDate: promiseDate.toISOString() };
      const info = getPromiseIndicatorInfo(invoice, reminder);
      assert.strictEqual(info, null);
    });

    test('should detect broken promises', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);
      const invoice = {
        status: 'issued',
        paymentStatus: 'unpaid',
        total: 1000,
        payments: [],
      };
      const reminder = { promisedDate: pastDate.toISOString() };
      const info = getPromiseIndicatorInfo(invoice, reminder);
      assert.ok(info.isPromiseBroken);
    });
  });

  describe('Reminder Logic', () => {
    test('should correctly classify reminder stages', () => {
      assert.strictEqual(getReminderType(30), REMINDER_TYPES.ADVANCE);
      assert.strictEqual(getReminderType(0), REMINDER_TYPES.DUE_TODAY);
      assert.strictEqual(getReminderType(-5), REMINDER_TYPES.POLITE_OVERDUE);
      assert.strictEqual(getReminderType(-50), REMINDER_TYPES.FINAL_OVERDUE);
    });

    test('should provide config for all reminder states', () => {
      const states = [7, 3, 0, -3, -15, -40];
      for (const days of states) {
        const type = getReminderType(days);
        const config = REMINDER_CONFIG[type];
        assert.ok(config, `No config for type: ${type}`);
      }
    });
  });
});
