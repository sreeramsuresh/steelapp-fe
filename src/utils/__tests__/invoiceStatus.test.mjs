import '../../__tests__/init.mjs';
/**
 * Invoice Status Utilities Tests
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import { INVOICE_STATUS_CONFIG } from '../invoiceStatus.js';

describe('invoiceStatus', () => {
  describe('INVOICE_STATUS_CONFIG constants', () => {
    test('should have status configurations for all statuses', () => {
      const statuses = ['draft', 'proforma', 'sent', 'issued', 'overdue'];
      statuses.forEach(status => {
        assert.ok(INVOICE_STATUS_CONFIG[status], `Config missing for ${status}`);
      });
    });

    test('draft status should have correct styling', () => {
      const config = INVOICE_STATUS_CONFIG.draft;
      assert.strictEqual(config.label, 'DRAFT INVOICE');
      assert.ok(config.bgLight.includes('gray'));
      assert.ok(config.textLight.includes('gray'));
    });

    test('issued status should have green styling', () => {
      const config = INVOICE_STATUS_CONFIG.issued;
      assert.strictEqual(config.label, 'ISSUED');
      assert.ok(config.bgLight.includes('green'));
      assert.ok(config.textLight.includes('green'));
    });

    test('overdue status should have red styling', () => {
      const config = INVOICE_STATUS_CONFIG.overdue;
      assert.strictEqual(config.label, 'OVERDUE');
      assert.ok(config.bgLight.includes('red'));
      assert.ok(config.textLight.includes('red'));
    });

    test('all statuses should have light and dark variants', () => {
      Object.values(INVOICE_STATUS_CONFIG).forEach(config => {
        assert.ok(config.bgLight, 'Missing bgLight');
        assert.ok(config.bgDark, 'Missing bgDark');
        assert.ok(config.textLight, 'Missing textLight');
        assert.ok(config.textDark, 'Missing textDark');
        assert.ok(config.borderLight, 'Missing borderLight');
        assert.ok(config.borderDark, 'Missing borderDark');
        assert.ok(config.label, 'Missing label');
      });
    });
  });
});
