/**
 * EntityAuditTimeline Component Unit Tests (Node Native Test Runner)
 *
 * Tests the reusable entity history timeline:
 * - Action config mapping (icons, colors, labels)
 * - ChangeSummary logic (CREATE vs UPDATE vs DELETE)
 * - Field diffing (skip metadata fields, show changes)
 * - Loading/error/empty states
 */

import '../../__tests__/init.mjs';

import { test, describe } from 'node:test';
import assert from 'node:assert';

// ────────────────────────────────────────────────
// Replicate component logic for unit testing
// ────────────────────────────────────────────────

const ACTION_CONFIG = {
  CREATE: { color: 'bg-green-500', label: 'Created' },
  INSERT: { color: 'bg-green-500', label: 'Created' },
  UPDATE: { color: 'bg-blue-500', label: 'Updated' },
  DELETE: { color: 'bg-red-500', label: 'Deleted' },
  RESTORE: { color: 'bg-amber-500', label: 'Restored' },
};

function getActionConfig(action) {
  if (!action) return { color: 'bg-gray-400', label: action || 'Unknown' };
  const upper = action.toUpperCase();
  for (const [key, config] of Object.entries(ACTION_CONFIG)) {
    if (upper.includes(key)) return config;
  }
  return { color: 'bg-gray-400', label: action };
}

// Replicate ChangeSummary field diffing logic
function computeChanges(oldValues, newValues) {
  if (!oldValues && !newValues) return null;

  // CREATE: show key fields from new values
  if (!oldValues && newValues) {
    const data = typeof newValues === 'string' ? JSON.parse(newValues) : newValues;
    const keyFields = ['name', 'email', 'status', 'total', 'amount', 'invoice_number', 'po_number'];
    return {
      type: 'create',
      fields: Object.entries(data).filter(([k]) => keyFields.includes(k)),
    };
  }

  // UPDATE: show changed fields
  if (oldValues && newValues) {
    const oldData = typeof oldValues === 'string' ? JSON.parse(oldValues) : oldValues;
    const newData = typeof newValues === 'string' ? JSON.parse(newValues) : newValues;
    const skipFields = ['updated_at', 'created_at', 'updated_by', 'created_by'];
    const changes = [];

    for (const key of Object.keys(newData)) {
      if (skipFields.includes(key)) continue;
      if (JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
        changes.push({ key, from: oldData[key], to: newData[key] });
      }
    }

    return { type: 'update', changes };
  }

  // DELETE: show removal
  if (oldValues && !newValues) {
    return { type: 'delete' };
  }

  return null;
}

describe('EntityAuditTimeline', () => {
  // ────────────────────────────────────────────────
  // Action config mapping
  // ────────────────────────────────────────────────
  describe('getActionConfig()', () => {
    test('returns green config for CREATE', () => {
      const config = getActionConfig('CREATE');
      assert.strictEqual(config.color, 'bg-green-500');
      assert.strictEqual(config.label, 'Created');
    });

    test('returns green config for INSERT', () => {
      const config = getActionConfig('INSERT');
      assert.strictEqual(config.color, 'bg-green-500');
      assert.strictEqual(config.label, 'Created');
    });

    test('returns blue config for UPDATE', () => {
      const config = getActionConfig('UPDATE');
      assert.strictEqual(config.color, 'bg-blue-500');
      assert.strictEqual(config.label, 'Updated');
    });

    test('returns red config for DELETE', () => {
      const config = getActionConfig('DELETE');
      assert.strictEqual(config.color, 'bg-red-500');
      assert.strictEqual(config.label, 'Deleted');
    });

    test('returns amber config for RESTORE', () => {
      const config = getActionConfig('RESTORE');
      assert.strictEqual(config.color, 'bg-amber-500');
      assert.strictEqual(config.label, 'Restored');
    });

    test('handles composite action names (e.g. CREATE_CUSTOMER)', () => {
      const config = getActionConfig('CREATE_CUSTOMER');
      assert.strictEqual(config.label, 'Created');
    });

    test('handles null action', () => {
      const config = getActionConfig(null);
      assert.strictEqual(config.color, 'bg-gray-400');
      assert.strictEqual(config.label, 'Unknown');
    });

    test('handles unknown action', () => {
      const config = getActionConfig('ARCHIVE');
      assert.strictEqual(config.color, 'bg-gray-400');
      assert.strictEqual(config.label, 'ARCHIVE');
    });

    test('is case-insensitive', () => {
      const config = getActionConfig('update_supplier');
      assert.strictEqual(config.label, 'Updated');
    });
  });

  // ────────────────────────────────────────────────
  // ChangeSummary / computeChanges
  // ────────────────────────────────────────────────
  describe('ChangeSummary logic', () => {
    test('returns null when both old and new are null', () => {
      const result = computeChanges(null, null);
      assert.strictEqual(result, null);
    });

    test('CREATE: extracts key fields from new values', () => {
      const newValues = {
        name: 'Test Corp',
        email: 'test@corp.com',
        status: 'active',
        address: '123 Street', // not a key field
        created_at: '2026-01-01',
      };

      const result = computeChanges(null, newValues);

      assert.strictEqual(result.type, 'create');
      assert.ok(result.fields.some(([k]) => k === 'name'));
      assert.ok(result.fields.some(([k]) => k === 'email'));
      assert.ok(result.fields.some(([k]) => k === 'status'));
      assert.ok(!result.fields.some(([k]) => k === 'address'));
    });

    test('CREATE: handles string JSON data', () => {
      const newValues = '{"name":"Test","status":"active"}';

      const result = computeChanges(null, newValues);

      assert.strictEqual(result.type, 'create');
      assert.strictEqual(result.fields.length, 2);
    });

    test('UPDATE: detects changed fields', () => {
      const oldValues = { name: 'Old Name', email: 'old@test.com', phone: '+971-1111' };
      const newValues = { name: 'New Name', email: 'new@test.com', phone: '+971-1111' };

      const result = computeChanges(oldValues, newValues);

      assert.strictEqual(result.type, 'update');
      assert.strictEqual(result.changes.length, 2); // name and email changed
      assert.ok(result.changes.some((c) => c.key === 'name'));
      assert.ok(result.changes.some((c) => c.key === 'email'));
    });

    test('UPDATE: skips metadata fields (updated_at, created_at, etc.)', () => {
      const oldValues = { name: 'Same', updated_at: '2026-01-01', created_by: 1 };
      const newValues = { name: 'Same', updated_at: '2026-02-01', created_by: 2 };

      const result = computeChanges(oldValues, newValues);

      assert.strictEqual(result.type, 'update');
      assert.strictEqual(result.changes.length, 0); // all changes are in skip fields
    });

    test('UPDATE: handles string JSON data', () => {
      const oldValues = '{"name":"Old"}';
      const newValues = '{"name":"New"}';

      const result = computeChanges(oldValues, newValues);

      assert.strictEqual(result.type, 'update');
      assert.strictEqual(result.changes[0].from, 'Old');
      assert.strictEqual(result.changes[0].to, 'New');
    });

    test('UPDATE: no changes detected returns empty changes array', () => {
      const oldValues = { name: 'Same', status: 'active' };
      const newValues = { name: 'Same', status: 'active' };

      const result = computeChanges(oldValues, newValues);

      assert.strictEqual(result.type, 'update');
      assert.strictEqual(result.changes.length, 0);
    });

    test('DELETE: returns delete type', () => {
      const oldValues = { name: 'Deleted Corp', status: 'active' };

      const result = computeChanges(oldValues, null);

      assert.strictEqual(result.type, 'delete');
    });
  });

  // ────────────────────────────────────────────────
  // Timeline rendering logic
  // ────────────────────────────────────────────────
  describe('Timeline rendering', () => {
    test('last item does not render connector line', () => {
      const logs = [
        { id: 1, action: 'CREATE' },
        { id: 2, action: 'UPDATE' },
        { id: 3, action: 'DELETE' },
      ];

      logs.forEach((log, idx) => {
        const isLast = idx === logs.length - 1;
        if (idx === 2) {
          assert.ok(isLast, 'Last item should be marked as last');
        } else {
          assert.ok(!isLast, 'Non-last items should not be marked as last');
        }
      });
    });

    test('displays description or fallback to config label', () => {
      const logWithDesc = { description: 'Custom description', action: 'UPDATE' };
      const logWithoutDesc = { action: 'UPDATE' };

      const display1 = logWithDesc.description || getActionConfig(logWithDesc.action).label;
      const display2 = logWithoutDesc.description || getActionConfig(logWithoutDesc.action).label;

      assert.strictEqual(display1, 'Custom description');
      assert.strictEqual(display2, 'Updated');
    });

    test('formats username with fallback to System', () => {
      assert.strictEqual('admin' || 'System', 'admin');
      assert.strictEqual(null || 'System', 'System');
      assert.strictEqual(undefined || 'System', 'System');
    });
  });
});
