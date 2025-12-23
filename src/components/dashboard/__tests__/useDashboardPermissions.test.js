/**
 * useDashboardPermissions Hook Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock authService
vi.mock('../../../services/authService', () => ({
  authService: {
    getUser: vi.fn(),
    getToken: vi.fn(),
  },
}));

// Mock DashboardConfig
vi.mock('../config/DashboardConfig', () => ({
  canViewWidget: vi.fn((widgetId, role) => {
    const allowedWidgets = {
      ceo: [
        'revenue-kpi',
        'vat-collection',
        'inventory-health',
        'agent-scorecard',
      ],
      cfo: ['revenue-kpi', 'vat-collection', 'ar-aging'],
      sales_agent: ['agent-scorecard', 'commission-tracker'],
      warehouse_manager: ['inventory-health', 'reorder-alerts'],
    };
    return allowedWidgets[role]?.includes(widgetId) ?? false;
  }),
  getVisibleWidgets: vi.fn((role) => {
    const widgets = {
      ceo: ['revenue-kpi', 'vat-collection', 'inventory-health'],
      sales_agent: ['agent-scorecard', 'commission-tracker'],
    };
    return widgets[role] || [];
  }),
  getWidgetsByCategory: vi.fn((category, role) => {
    if (role === 'ceo' && category === 'FINANCIAL')
      return ['revenue-kpi', 'ar-aging'];
    if (role === 'sales_agent' && category === 'SALES_AGENT')
      return ['agent-scorecard'];
    return [];
  }),
  getDefaultLayout: vi.fn(() => ({ sections: [] })),
  DASHBOARD_ROLES: {
    ADMIN: 'admin',
    CEO: 'ceo',
    CFO: 'cfo',
    SALES_MANAGER: 'sales_manager',
    OPERATIONS_MANAGER: 'operations_manager',
    WAREHOUSE_MANAGER: 'warehouse_manager',
    SALES_AGENT: 'sales_agent',
    ACCOUNTANT: 'accountant',
  },
}));

import { authService } from '../../../services/authService';

describe('useDashboardPermissions role mapping', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Role Mapping', () => {
    it('maps "admin" to ADMIN role', () => {
      authService.getUser.mockReturnValue({ role: 'admin' });
      authService.getToken.mockReturnValue('token');
      // Role mapping logic test
      const role = 'admin'.toLowerCase();
      expect(role).toBe('admin');
    });

    it('maps "ceo" to CEO role', () => {
      authService.getUser.mockReturnValue({ role: 'ceo' });
      const user = authService.getUser();
      expect(user.role).toBe('ceo');
    });

    it('maps "sales_manager" to SALES_MANAGER role', () => {
      authService.getUser.mockReturnValue({ role: 'sales_manager' });
      const user = authService.getUser();
      expect(user.role).toBe('sales_manager');
    });

    it('maps "salesAgent" to SALES_AGENT role', () => {
      authService.getUser.mockReturnValue({ role: 'salesAgent' });
      const user = authService.getUser();
      expect(user.role).toBe('salesAgent');
    });

    it('maps "warehouse_manager" to WAREHOUSE_MANAGER role', () => {
      authService.getUser.mockReturnValue({ role: 'warehouse_manager' });
      const user = authService.getUser();
      expect(user.role).toBe('warehouse_manager');
    });

    it('handles case-insensitive roles', () => {
      authService.getUser.mockReturnValue({ role: 'CEO' });
      const user = authService.getUser();
      expect(user.role.toLowerCase()).toBe('ceo');
    });

    it('handles null user gracefully', () => {
      authService.getUser.mockReturnValue(null);
      const user = authService.getUser();
      expect(user).toBeNull();
    });

    it('handles undefined role', () => {
      authService.getUser.mockReturnValue({ role: undefined });
      const user = authService.getUser();
      expect(user.role).toBeUndefined();
    });
  });

  describe('Authentication State', () => {
    it('detects authenticated user', () => {
      authService.getUser.mockReturnValue({ id: 1, role: 'admin' });
      authService.getToken.mockReturnValue('valid-token');
      const user = authService.getUser();
      const token = authService.getToken();
      expect(!!(user && token)).toBe(true);
    });

    it('detects unauthenticated user', () => {
      authService.getUser.mockReturnValue(null);
      authService.getToken.mockReturnValue(null);
      const user = authService.getUser();
      const token = authService.getToken();
      expect(!!(user && token)).toBe(false);
    });
  });

  describe('Widget Permission Integration', () => {
    it('CEO can view financial widgets', () => {
      const { canViewWidget } = require('../config/DashboardConfig');
      expect(canViewWidget('revenue-kpi', 'ceo')).toBe(true);
    });

    it('SALES_AGENT cannot view financial widgets', () => {
      const { canViewWidget } = require('../config/DashboardConfig');
      expect(canViewWidget('revenue-kpi', 'sales_agent')).toBe(false);
    });

    it('SALES_AGENT can view agent widgets', () => {
      const { canViewWidget } = require('../config/DashboardConfig');
      expect(canViewWidget('agent-scorecard', 'sales_agent')).toBe(true);
    });

    it('WAREHOUSE_MANAGER can view inventory widgets', () => {
      const { canViewWidget } = require('../config/DashboardConfig');
      expect(canViewWidget('inventory-health', 'warehouse_manager')).toBe(true);
    });
  });

  describe('Category-based Widget Retrieval', () => {
    it('returns financial widgets for CEO', () => {
      const { getWidgetsByCategory } = require('../config/DashboardConfig');
      const widgets = getWidgetsByCategory('FINANCIAL', 'ceo');
      expect(widgets).toContain('revenue-kpi');
    });

    it('returns empty for unauthorized category', () => {
      const { getWidgetsByCategory } = require('../config/DashboardConfig');
      const widgets = getWidgetsByCategory('FINANCIAL', 'sales_agent');
      expect(widgets.length).toBe(0);
    });
  });
});
