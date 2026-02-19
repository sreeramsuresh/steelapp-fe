import '../../__tests__/init.mjs';
/**
 * HTML Escape Utilities Tests
 * Tests XSS prevention functions
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import { escapeHtml, escapeHtmlWithLineBreaks } from '../htmlEscape.js';

describe('htmlEscape', () => {
  describe('escapeHtml()', () => {
    test('should escape script tags', () => {
      const input = '<script>alert("XSS")</script>';
      const result = escapeHtml(input);
      assert.strictEqual(result, '&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;');
    });

    test('should escape image tags with event handlers', () => {
      const input = '<img src=x onerror="alert(\'XSS\')">';
      const result = escapeHtml(input);
      assert.ok(result.includes('&lt;img'));
      assert.ok(result.includes('&quot;'));
      assert.ok(!result.includes('<img'));
    });

    test('should escape quotes', () => {
      const input = '"><script>alert("XSS")</script>';
      const result = escapeHtml(input);
      assert.ok(result.includes('&quot;'));
      assert.ok(!result.includes('"'));
    });

    test('should escape single quotes', () => {
      const input = "It's <dangerous>";
      const result = escapeHtml(input);
      assert.ok(result.includes('&#039;'));
    });

    test('should escape ampersands', () => {
      const input = 'Tom & Jerry';
      const result = escapeHtml(input);
      assert.strictEqual(result, 'Tom &amp; Jerry');
    });

    test('should escape forward slashes', () => {
      const input = '<script src="/evil.js"></script>';
      const result = escapeHtml(input);
      assert.ok(result.includes('&#x2F;'));
    });

    test('should handle null value', () => {
      const result = escapeHtml(null);
      assert.strictEqual(result, '');
    });

    test('should handle undefined value', () => {
      const result = escapeHtml(undefined);
      assert.strictEqual(result, '');
    });

    test('should handle empty string', () => {
      const result = escapeHtml('');
      assert.strictEqual(result, '');
    });

    test('should handle normal text', () => {
      const input = 'This is safe text';
      const result = escapeHtml(input);
      assert.strictEqual(result, 'This is safe text');
    });

    test('should handle numeric input', () => {
      const result = escapeHtml(123);
      assert.strictEqual(result, '123');
    });

    test('should escape complex XSS payload', () => {
      const input = '"><script>alert(String.fromCharCode(88,83,83))</script>';
      const result = escapeHtml(input);
      assert.ok(!result.includes('<'));
      assert.ok(!result.includes('>'));
      assert.ok(!result.includes('"'));
    });
  });

  describe('escapeHtmlWithLineBreaks()', () => {
    test('should escape HTML and convert newlines to <br>', () => {
      const input = 'Line 1\nLine 2';
      const result = escapeHtmlWithLineBreaks(input);
      assert.strictEqual(result, 'Line 1<br>Line 2');
    });

    test('should handle multiple newlines', () => {
      const input = 'Line 1\n\nLine 3';
      const result = escapeHtmlWithLineBreaks(input);
      assert.strictEqual(result, 'Line 1<br><br>Line 3');
    });

    test('should escape HTML before converting newlines', () => {
      const input = '<script>alert("XSS")</script>\nHarmless text';
      const result = escapeHtmlWithLineBreaks(input);
      assert.ok(result.includes('&lt;script&gt;'));
      assert.ok(result.includes('<br>'));
      assert.ok(!result.includes('<script>'));
    });

    test('should handle null value', () => {
      const result = escapeHtmlWithLineBreaks(null);
      assert.strictEqual(result, '');
    });

    test('should handle undefined value', () => {
      const result = escapeHtmlWithLineBreaks(undefined);
      assert.strictEqual(result, '');
    });

    test('should handle empty string', () => {
      const result = escapeHtmlWithLineBreaks('');
      assert.strictEqual(result, '');
    });

    test('should handle text without newlines', () => {
      const input = 'Single line text';
      const result = escapeHtmlWithLineBreaks(input);
      assert.strictEqual(result, 'Single line text');
    });

    test('should escape special characters with newlines', () => {
      const input = 'Tom & Jerry\n<script>alert("XSS")</script>';
      const result = escapeHtmlWithLineBreaks(input);
      assert.ok(result.includes('Tom &amp; Jerry'));
      assert.ok(result.includes('&lt;script&gt;'));
      assert.ok(result.includes('<br>'));
    });

    test('should handle trailing newlines', () => {
      const input = 'Text\n';
      const result = escapeHtmlWithLineBreaks(input);
      assert.strictEqual(result, 'Text<br>');
    });

    test('should handle leading newlines', () => {
      const input = '\nText';
      const result = escapeHtmlWithLineBreaks(input);
      assert.strictEqual(result, '<br>Text');
    });
  });
});
