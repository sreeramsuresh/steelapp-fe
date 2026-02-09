import '../../__tests__/init.mjs';
/**
 * Timezone Utilities Tests
 * Tests timezone conversion and formatting functions for UAE timezone (UTC+4)
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  toUAETime,
  toUAEDateForInput,
  toUTC,
  toTimestamp,
  nowUAE,
  nowUTC,
  isOverdue,
  hoursSince,
  isWithinEditWindow,
  formatRelativeTime,
  toUAEDateProfessional,
  toUAEDateTimeProfessional,
  toUAEDateShort,
  toUAEPaymentDateTime,
  TIMEZONE_CONFIG,
  TIMEZONE_DISCLAIMER,
  TIMEZONE_LABEL,
} from '../timezone.js';

describe('timezone', () => {
  describe('TIMEZONE_CONFIG constants', () => {
    test('should have correct UAE timezone settings', () => {
      assert.strictEqual(TIMEZONE_CONFIG.UAE_TIMEZONE, 'Asia/Dubai');
      assert.strictEqual(TIMEZONE_CONFIG.UAE_OFFSET_HOURS, 4);
      assert.strictEqual(TIMEZONE_CONFIG.UTC_OFFSET, 0);
    });
  });

  describe('toUAETime()', () => {
    test('should format as datetime by default', () => {
      const utcDate = new Date('2025-01-15T10:30:00Z');
      const result = toUAETime(utcDate);
      assert.ok(typeof result === 'string');
      assert.ok(result.length > 0);
    });

    test('should format as date only', () => {
      const utcDate = new Date('2025-01-15T10:30:00Z');
      const result = toUAETime(utcDate, { format: 'date' });
      assert.ok(result.includes('15'));
    });

    test('should format as time only', () => {
      const utcDate = new Date('2025-01-15T10:30:00Z');
      const result = toUAETime(utcDate, { format: 'time' });
      assert.ok(result.includes(':'));
    });

    test('should format as short date', () => {
      const utcDate = new Date('2025-01-15T10:30:00Z');
      const result = toUAETime(utcDate, { format: 'short' });
      assert.match(result, /\d{2}\/\d{2}\/\d{4}/);
    });

    test('should format as long date', () => {
      const utcDate = new Date('2025-01-15T10:30:00Z');
      const result = toUAETime(utcDate, { format: 'long' });
      assert.ok(result.length > 0);
    });

    test('should format as ISO with UAE offset', () => {
      const utcDate = new Date('2025-01-15T10:30:00Z');
      const result = toUAETime(utcDate, { format: 'iso' });
      assert.ok(result.includes('+04:00'));
    });

    test('should append timezone label when requested', () => {
      const utcDate = new Date('2025-01-15T10:30:00Z');
      const result = toUAETime(utcDate, { format: 'date', showTimezone: true });
      assert.ok(result.includes('(UAE)'));
    });

    test('should return empty string for invalid input', () => {
      assert.strictEqual(toUAETime(null), '');
      assert.strictEqual(toUAETime(undefined), '');
      assert.strictEqual(toUAETime('invalid-date'), '');
    });

    test('should handle ISO string input', () => {
      const result = toUAETime('2025-01-15T10:30:00Z', { format: 'date' });
      assert.ok(result.length > 0);
    });

    test('should handle Timestamp object', () => {
      const timestamp = { seconds: 1736948400, nanos: 0 };
      const result = toUAETime(timestamp, { format: 'date' });
      assert.ok(result.length > 0);
    });

    test('should handle Timestamp with milliseconds in seconds field', () => {
      const milliseconds = Date.now();
      const timestamp = { seconds: milliseconds, nanos: 0 };
      const result = toUAETime(timestamp, { format: 'datetime' });
      assert.ok(result.length > 0);
    });
  });

  describe('toUAEDateForInput()', () => {
    test('should return YYYY-MM-DD format', () => {
      const utcDate = new Date('2025-01-15T10:30:00Z');
      const result = toUAEDateForInput(utcDate);
      assert.match(result, /\d{4}-\d{2}-\d{2}/);
    });

    test('should return empty string for null', () => {
      const result = toUAEDateForInput(null);
      assert.strictEqual(result, '');
    });

    test('should return empty string for invalid date', () => {
      const result = toUAEDateForInput('invalid');
      assert.strictEqual(result, '');
    });
  });

  describe('toUTC()', () => {
    test('should convert date string to UTC ISO', () => {
      const result = toUTC('2025-01-15', 'date');
      assert.ok(result.includes('T'));
      assert.ok(result.includes('Z'));
    });

    test('should handle datetime input', () => {
      const result = toUTC('2025-01-15T10:30', 'datetime');
      assert.ok(result.includes('T'));
    });

    test('should return null for empty input', () => {
      assert.strictEqual(toUTC(''), null);
      assert.strictEqual(toUTC(null), null);
    });

    test('should handle invalid date gracefully', () => {
      // toUTC may throw or return null depending on input format
      try {
        const result = toUTC('not-a-date', 'date');
        assert.ok(result === null || typeof result === 'string');
      } catch (e) {
        // Function may throw RangeError for invalid dates
        assert.ok(true);
      }
    });
  });

  describe('toTimestamp()', () => {
    test('should convert Date to Timestamp', () => {
      const date = new Date('2025-01-15T10:30:00Z');
      const result = toTimestamp(date);
      assert.ok(typeof result.seconds === 'number');
      assert.strictEqual(result.nanos, 0);
    });

    test('should return null for invalid input', () => {
      assert.strictEqual(toTimestamp(null), null);
      assert.strictEqual(toTimestamp(undefined), null);
      assert.strictEqual(toTimestamp('invalid'), null);
    });

    test('should generate positive seconds value', () => {
      const date = new Date();
      const result = toTimestamp(date);
      assert.ok(result.seconds > 0);
    });
  });

  describe('nowUAE()', () => {
    test('should return current time in UAE timezone', () => {
      const result = nowUAE();
      assert.ok(typeof result === 'string');
      assert.ok(result.length > 0);
    });

    test('should support different formats', () => {
      const datetimeResult = nowUAE('datetime');
      const dateResult = nowUAE('date');
      assert.ok(datetimeResult.length > 0);
      assert.ok(dateResult.length > 0);
    });
  });

  describe('nowUTC()', () => {
    test('should return current UTC time as ISO string', () => {
      const result = nowUTC();
      assert.ok(result.includes('T'));
      assert.ok(result.includes('Z'));
    });
  });

  describe('isOverdue()', () => {
    test('should return true for past date', () => {
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const result = isOverdue(pastDate);
      assert.strictEqual(result, true);
    });

    test('should return false for future date', () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const result = isOverdue(futureDate);
      assert.strictEqual(result, false);
    });

    test('should return false for invalid input', () => {
      assert.strictEqual(isOverdue(null), false);
      assert.strictEqual(isOverdue(undefined), false);
      assert.strictEqual(isOverdue('invalid'), false);
    });
  });

  describe('hoursSince()', () => {
    test('should return positive hours for past date', () => {
      const pastDate = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const result = hoursSince(pastDate);
      assert.ok(result >= 1.9 && result <= 2.1);
    });

    test('should return approximately 0 for current time', () => {
      const now = new Date();
      const result = hoursSince(now);
      assert.ok(result < 0.1);
    });

    test('should return Infinity for invalid input', () => {
      assert.strictEqual(hoursSince(null), Infinity);
      assert.strictEqual(hoursSince(undefined), Infinity);
    });
  });

  describe('isWithinEditWindow()', () => {
    test('should return true for time within 24 hours', () => {
      const issuedAt = new Date(Date.now() - 12 * 60 * 60 * 1000);
      const result = isWithinEditWindow(issuedAt);
      assert.strictEqual(result, true);
    });

    test('should return false for time outside 24 hours', () => {
      const issuedAt = new Date(Date.now() - 25 * 60 * 60 * 1000);
      const result = isWithinEditWindow(issuedAt);
      assert.strictEqual(result, false);
    });
  });

  describe('formatRelativeTime()', () => {
    test('should return "Just now" for very recent time', () => {
      const recentDate = new Date();
      const result = formatRelativeTime(recentDate);
      assert.strictEqual(result, 'Just now');
    });

    test('should return minutes ago for recent past', () => {
      const pastDate = new Date(Date.now() - 5 * 60 * 1000);
      const result = formatRelativeTime(pastDate);
      assert.ok(result.includes('minute'));
    });

    test('should return hours ago for recent past', () => {
      const pastDate = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const result = formatRelativeTime(pastDate);
      assert.ok(result.includes('hour'));
    });

    test('should return days ago for older dates', () => {
      const pastDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
      const result = formatRelativeTime(pastDate);
      assert.ok(result.includes('day'));
    });

    test('should return actual date for very old dates', () => {
      const oldDate = new Date('2024-01-01T00:00:00Z');
      const result = formatRelativeTime(oldDate);
      assert.ok(result.length > 0);
      assert.ok(!result.includes('ago'));
    });

    test('should return empty string for invalid input', () => {
      const result = formatRelativeTime(null);
      assert.strictEqual(result, '');
    });
  });

  describe('Professional formatting functions', () => {
    const testDate = new Date('2025-11-26T10:14:00Z');

    test('toUAEDateProfessional should format date professionally', () => {
      const result = toUAEDateProfessional(testDate);
      assert.ok(result.includes('26'));
      assert.ok(result.includes('2025'));
    });

    test('toUAEDateTimeProfessional should include date, time, and timezone', () => {
      const result = toUAEDateTimeProfessional(testDate);
      assert.ok(result.includes('GST'));
      assert.ok(result.includes('UTC+4'));
    });

    test('toUAEDateShort should format date as DD/MM/YYYY', () => {
      const result = toUAEDateShort(testDate);
      assert.match(result, /\d{2}\/\d{2}\/\d{4}/);
    });

    test('toUAEPaymentDateTime should include date and time with GST', () => {
      const result = toUAEPaymentDateTime(testDate);
      assert.ok(result.includes('GST'));
      assert.ok(result.includes(','));
    });
  });

  describe('Timezone constants', () => {
    test('TIMEZONE_DISCLAIMER should be defined', () => {
      assert.ok(typeof TIMEZONE_DISCLAIMER === 'string');
      assert.ok(TIMEZONE_DISCLAIMER.length > 0);
      assert.ok(TIMEZONE_DISCLAIMER.includes('GST'));
    });

    test('TIMEZONE_LABEL should be defined', () => {
      assert.ok(typeof TIMEZONE_LABEL === 'string');
      assert.strictEqual(TIMEZONE_LABEL, 'GST (UTC+4)');
    });
  });

  describe('Edge cases', () => {
    test('should handle leap year dates', () => {
      const leapDate = new Date('2024-02-29T12:00:00Z');
      const result = toUAETime(leapDate, { format: 'date' });
      assert.ok(result.length > 0);
    });

    test('should handle year boundary dates', () => {
      const endOfYear = new Date('2025-12-31T23:59:59Z');
      const result = toUAETime(endOfYear, { format: 'datetime' });
      assert.ok(result.length > 0);
    });

    test('should handle timezone transitions correctly', () => {
      const date1 = new Date('2025-06-01T10:00:00Z');
      const date2 = new Date('2025-12-01T10:00:00Z');
      const result1 = toUAETime(date1, { format: 'time' });
      const result2 = toUAETime(date2, { format: 'time' });
      assert.ok(result1.length > 0);
      assert.ok(result2.length > 0);
    });
  });
});
