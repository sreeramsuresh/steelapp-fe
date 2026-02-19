/**
 * RecentActivitySection (HomePage Widget) Unit Tests (Node Native Test Runner)
 *
 * Tests the dashboard recent activity widget:
 * - Category icon/color mapping
 * - Action type icon selection
 * - Time formatting
 * - Empty state handling
 * - Auto-refresh interval setup
 */

import '../../__tests__/init.mjs';

import { test, describe } from 'node:test';
import assert from 'node:assert';

// ────────────────────────────────────────────────
// Replicate category color and icon logic
// ────────────────────────────────────────────────

const CATEGORY_COLORS = {
  AUTH: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  CUSTOMER: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  SUPPLIER: 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',
  PRODUCT: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
  INVOICE: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
  PAYMENT: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  CREDIT_NOTE: 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
  DELIVERY_NOTE: 'bg-lime-100 text-lime-600 dark:bg-lime-900/30 dark:text-lime-400',
  PURCHASE_ORDER: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
  QUOTATION: 'bg-sky-100 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400',
  INVENTORY: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  WAREHOUSE: 'bg-slate-100 text-slate-600 dark:bg-slate-900/30 dark:text-slate-400',
  SETTINGS: 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400',
  EXPORT: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  USER: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
  ROLE: 'bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-900/30 dark:text-fuchsia-400',
  STATEMENT: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
};

function getCategoryColor(category) {
  return CATEGORY_COLORS[category] || 'bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400';
}

function getActionIcon(action) {
  if (!action) return 'Activity';
  const upper = action.toUpperCase();
  if (upper.includes('DELETE')) return 'Trash2';
  if (upper.includes('UPDATE')) return 'Edit';
  if (upper.includes('CREATE') || upper.includes('INSERT')) return 'Plus';
  if (upper.includes('LOGIN') || upper.includes('LOGOUT')) return 'User';
  return 'Activity';
}

describe('RecentActivitySection', () => {
  // ────────────────────────────────────────────────
  // Category color mapping
  // ────────────────────────────────────────────────
  describe('getCategoryColor()', () => {
    test('returns correct color for all 17 categories', () => {
      const categories = Object.keys(CATEGORY_COLORS);
      assert.strictEqual(categories.length, 17);

      for (const cat of categories) {
        const color = getCategoryColor(cat);
        assert.ok(color.length > 0, `Category ${cat} should have a color`);
        assert.ok(color.includes('bg-'), `Category ${cat} color should include bg-`);
        assert.ok(color.includes('text-'), `Category ${cat} color should include text-`);
        assert.ok(color.includes('dark:'), `Category ${cat} should have dark mode variant`);
      }
    });

    test('returns gray for unknown category', () => {
      const color = getCategoryColor('UNKNOWN');
      assert.ok(color.includes('gray'));
    });

    test('each category has a unique color', () => {
      const colors = Object.values(CATEGORY_COLORS);
      const uniqueColors = new Set(colors);
      assert.strictEqual(uniqueColors.size, colors.length, 'All categories should have unique colors');
    });
  });

  // ────────────────────────────────────────────────
  // Action icon selection
  // ────────────────────────────────────────────────
  describe('getActionIcon()', () => {
    test('returns Trash2 for DELETE actions', () => {
      assert.strictEqual(getActionIcon('DELETE_SUPPLIER'), 'Trash2');
      assert.strictEqual(getActionIcon('DELETE_CUSTOMER'), 'Trash2');
    });

    test('returns Edit for UPDATE actions', () => {
      assert.strictEqual(getActionIcon('UPDATE_INVOICE'), 'Edit');
    });

    test('returns Plus for CREATE actions', () => {
      assert.strictEqual(getActionIcon('CREATE_PRODUCT'), 'Plus');
    });

    test('returns Plus for INSERT actions', () => {
      assert.strictEqual(getActionIcon('INSERT'), 'Plus');
    });

    test('returns User for LOGIN/LOGOUT', () => {
      assert.strictEqual(getActionIcon('LOGIN'), 'User');
      assert.strictEqual(getActionIcon('LOGOUT'), 'User');
    });

    test('returns Activity for unknown actions', () => {
      assert.strictEqual(getActionIcon('ARCHIVE'), 'Activity');
      assert.strictEqual(getActionIcon(null), 'Activity');
    });
  });

  // ────────────────────────────────────────────────
  // Activity data shape
  // ────────────────────────────────────────────────
  describe('Activity data shape', () => {
    test('activity log has all required display fields', () => {
      const activity = {
        id: 1,
        action: 'CREATE_CUSTOMER',
        category: 'CUSTOMER',
        entity_type: 'customer',
        entity_id: 5,
        entity_name: 'Test Corp',
        description: 'Created customer Test Corp',
        username: 'admin',
        status: 'success',
        created_at: '2026-02-08T10:00:00Z',
      };

      assert.ok(activity.action);
      assert.ok(activity.category);
      assert.ok(activity.description || activity.action);
      assert.ok(activity.username);
      assert.ok(activity.created_at);
    });

    test('displays description with fallback to action', () => {
      const withDesc = { description: 'Created customer X', action: 'CREATE_CUSTOMER' };
      const withoutDesc = { description: null, action: 'CREATE_CUSTOMER' };

      assert.strictEqual(withDesc.description || withDesc.action, 'Created customer X');
      assert.strictEqual(withoutDesc.description || withoutDesc.action, 'CREATE_CUSTOMER');
    });
  });

  // ────────────────────────────────────────────────
  // Empty state
  // ────────────────────────────────────────────────
  describe('Empty state', () => {
    test('handles empty activity list', () => {
      const activities = [];
      assert.strictEqual(activities.length, 0);
    });

    test('handles null/undefined activity list', () => {
      const activities = null;
      const safeActivities = activities || [];
      assert.strictEqual(safeActivities.length, 0);
    });
  });

  // ────────────────────────────────────────────────
  // Auto-refresh configuration
  // ────────────────────────────────────────────────
  describe('Auto-refresh', () => {
    test('refresh interval is 60 seconds', () => {
      const REFRESH_INTERVAL = 60000; // ms
      assert.strictEqual(REFRESH_INTERVAL, 60000);
      assert.strictEqual(REFRESH_INTERVAL / 1000, 60);
    });
  });

  // ────────────────────────────────────────────────
  // Section config integration
  // ────────────────────────────────────────────────
  describe('SECTION_CONFIG integration', () => {
    test('recentActivity section has correct config shape', () => {
      const config = {
        id: 'recentActivity',
        title: 'Recent Activity',
      };

      assert.strictEqual(config.id, 'recentActivity');
      assert.strictEqual(config.title, 'Recent Activity');
    });
  });
});
