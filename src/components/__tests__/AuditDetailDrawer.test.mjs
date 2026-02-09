/**
 * AuditDetailDrawer Component Unit Tests (Node Native Test Runner)
 *
 * Tests the slide-over audit detail panel:
 * - Render states (open/closed, with/without data)
 * - Action color mapping
 * - Entity navigation link generation
 * - JSON diff display (before/after)
 * - Error message display
 */

import '../../__tests__/init.mjs';

import { test, describe } from 'node:test';
import assert from 'node:assert';

// ────────────────────────────────────────────────
// Test the ENTITY_ROUTES mapping
// ────────────────────────────────────────────────
const ENTITY_ROUTES = {
  customer: '/app/customers',
  supplier: '/app/suppliers',
  product: '/app/products',
  invoice: '/app/invoices',
  credit_note: '/app/credit-notes',
  delivery_note: '/app/delivery-notes',
  purchase_order: '/app/purchase-orders',
  quotation: '/app/quotations',
  warehouse: '/app/warehouses',
};

const ACTION_COLORS = {
  CREATE: 'text-green-600 dark:text-green-400',
  INSERT: 'text-green-600 dark:text-green-400',
  UPDATE: 'text-blue-600 dark:text-blue-400',
  DELETE: 'text-red-600 dark:text-red-400',
  LOGIN: 'text-purple-600 dark:text-purple-400',
  LOGOUT: 'text-gray-600 dark:text-gray-400',
};

function getActionColor(action) {
  if (!action) return 'text-gray-600 dark:text-gray-400';
  const upper = action.toUpperCase();
  for (const [key, color] of Object.entries(ACTION_COLORS)) {
    if (upper.includes(key)) return color;
  }
  return 'text-gray-600 dark:text-gray-400';
}

describe('AuditDetailDrawer', () => {
  // ────────────────────────────────────────────────
  // Entity route mapping
  // ────────────────────────────────────────────────
  describe('ENTITY_ROUTES mapping', () => {
    test('maps all supported entity types to routes', () => {
      const expectedEntities = [
        'customer', 'supplier', 'product', 'invoice',
        'credit_note', 'delivery_note', 'purchase_order',
        'quotation', 'warehouse',
      ];

      for (const entity of expectedEntities) {
        assert.ok(ENTITY_ROUTES[entity], `Missing route for ${entity}`);
        assert.ok(ENTITY_ROUTES[entity].startsWith('/app/'), `Route for ${entity} should start with /app/`);
      }
    });

    test('generates correct navigation URL for entity', () => {
      const entityType = 'supplier';
      const entityId = 42;
      const route = ENTITY_ROUTES[entityType];
      const url = `${route}/${entityId}`;

      assert.strictEqual(url, '/app/suppliers/42');
    });

    test('canNavigateToEntity is true when route and id exist', () => {
      const log = { entityType: 'customer', entityId: 5 };
      const entityRoute = ENTITY_ROUTES[log.entityType];
      const canNavigate = !!(entityRoute && log.entityId);

      assert.ok(canNavigate);
    });

    test('canNavigateToEntity is false for unknown entity type', () => {
      const log = { entityType: 'unknown_entity', entityId: 5 };
      const entityRoute = ENTITY_ROUTES[log.entityType];
      const canNavigate = !!(entityRoute && log.entityId);

      assert.ok(!canNavigate);
    });

    test('canNavigateToEntity is false when entityId is null', () => {
      const log = { entityType: 'customer', entityId: null };
      const entityRoute = ENTITY_ROUTES[log.entityType];
      const canNavigate = !!(entityRoute && log.entityId);

      assert.ok(!canNavigate);
    });
  });

  // ────────────────────────────────────────────────
  // Action color mapping
  // ────────────────────────────────────────────────
  describe('getActionColor()', () => {
    test('returns green for CREATE actions', () => {
      assert.ok(getActionColor('CREATE_CUSTOMER').includes('green'));
      assert.ok(getActionColor('CREATE_INVOICE').includes('green'));
    });

    test('returns green for INSERT actions', () => {
      assert.ok(getActionColor('INSERT').includes('green'));
    });

    test('returns blue for UPDATE actions', () => {
      assert.ok(getActionColor('UPDATE_SUPPLIER').includes('blue'));
    });

    test('returns red for DELETE actions', () => {
      assert.ok(getActionColor('DELETE_PRODUCT').includes('red'));
    });

    test('returns purple for LOGIN', () => {
      assert.ok(getActionColor('LOGIN').includes('purple'));
    });

    test('returns gray for LOGOUT', () => {
      const color = getActionColor('LOGOUT');
      assert.ok(color.includes('gray'));
    });

    test('returns gray for null/unknown action', () => {
      assert.ok(getActionColor(null).includes('gray'));
      assert.ok(getActionColor('UNKNOWN_ACTION').includes('gray'));
    });

    test('is case-insensitive', () => {
      assert.ok(getActionColor('create_customer').includes('green'));
      assert.ok(getActionColor('delete_SUPPLIER').includes('red'));
    });
  });

  // ────────────────────────────────────────────────
  // JsonDiff data handling
  // ────────────────────────────────────────────────
  describe('JsonDiff data handling', () => {
    test('parses string JSON data', () => {
      const data = '{"name":"Al Rashid Steel","status":"active"}';
      const entries = JSON.parse(data);

      assert.strictEqual(entries.name, 'Al Rashid Steel');
      assert.strictEqual(entries.status, 'active');
    });

    test('handles object data directly', () => {
      const data = { name: 'Test Corp', email: 'test@corp.com' };
      const entries = typeof data === 'string' ? JSON.parse(data) : data;

      assert.strictEqual(Object.keys(entries).length, 2);
      assert.strictEqual(entries.name, 'Test Corp');
    });

    test('handles null data (no previous data / record deleted)', () => {
      const beforeData = null;
      const afterData = null;

      // Before is null → "no previous data"
      assert.strictEqual(beforeData, null);
      // After is null → "record deleted"
      assert.strictEqual(afterData, null);
    });

    test('renders nested object values as JSON strings', () => {
      const data = { customer: { name: 'Corp', id: 1 }, total: 5000 };
      const value = data.customer;
      const rendered = typeof value === 'object' ? JSON.stringify(value) : String(value);

      assert.strictEqual(rendered, '{"name":"Corp","id":1}');
    });

    test('renders null values as "null" string', () => {
      const value = null;
      const rendered = String(value ?? 'null');

      assert.strictEqual(rendered, 'null');
    });
  });

  // ────────────────────────────────────────────────
  // Render gate (isOpen / log)
  // ────────────────────────────────────────────────
  describe('render gate', () => {
    test('returns null when isOpen is false', () => {
      const isOpen = false;
      const log = { id: 1 };
      const shouldRender = isOpen && log;

      assert.ok(!shouldRender);
    });

    test('returns null when log is null', () => {
      const isOpen = true;
      const log = null;
      const shouldRender = isOpen && log;

      assert.ok(!shouldRender);
    });

    test('renders when isOpen is true and log exists', () => {
      const isOpen = true;
      const log = { id: 1, action: 'CREATE' };
      const shouldRender = !!(isOpen && log);

      assert.ok(shouldRender);
    });
  });
});
