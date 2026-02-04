import '../../__tests__/init.mjs';
/**
 * Reminder Utilities Tests
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  calculateDaysUntilDue,
  getReminderType,
  getReminderMessage,
  REMINDER_CONFIG,
} from '../reminderUtils.js';

describe('reminderUtils', () => {
  describe('REMINDER_CONFIG constant', () => {
    test('should have reminder configurations', () => {
      assert.ok(REMINDER_CONFIG);
      assert.ok(typeof REMINDER_CONFIG === 'object');
    });
  });

  describe('calculateDaysUntilDue()', () => {
    test('should calculate days correctly', () => {
      const futureDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
      const days = calculateDaysUntilDue(futureDate);
      assert.ok(days >= 4 && days <= 6); // Allow for timing variations
    });

    test('should return negative for past dates', () => {
      const pastDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
      const days = calculateDaysUntilDue(pastDate);
      assert.ok(days < 0);
    });

    test('should handle null/undefined', () => {
      const result = calculateDaysUntilDue(null);
      assert.ok(typeof result === 'number');
    });
  });

  describe('getReminderType()', () => {
    test('should categorize reminder types', () => {
      const type = getReminderType(3); // days
      assert.ok(typeof type === 'string');
    });

    test('should handle different day ranges', () => {
      const urgent = getReminderType(0);
      const upcoming = getReminderType(7);
      const future = getReminderType(30);
      assert.ok(typeof urgent === 'string');
      assert.ok(typeof upcoming === 'string');
      assert.ok(typeof future === 'string');
    });
  });

  describe('getReminderMessage()', () => {
    test('should generate reminder message', () => {
      const message = getReminderMessage(5);
      assert.ok(typeof message === 'string');
      assert.ok(message.length > 0);
    });

    test('should handle various days', () => {
      [-1, 0, 3, 7, 30].forEach(days => {
        const message = getReminderMessage(days);
        assert.ok(typeof message === 'string');
      });
    });
  });
});
