/**
 * DashboardConfig Tests
 * Tests role-based widget visibility configuration
 */

import { describe, expect, it } from "vitest";
import {
  canViewWidget,
  DASHBOARD_ROLES,
  getDefaultLayout,
  getVisibleWidgets,
  getWidgetsByCategory,
  WIDGET_CATEGORIES,
} from "../config/DashboardConfig";

// Alias for cleaner tests
const ROLES = DASHBOARD_ROLES;

describe("DashboardConfig", () => {
  describe("canViewWidget", () => {
    it("returns true for CEO on all widgets", () => {
      expect(canViewWidget("revenue-kpi", ROLES.CEO)).toBe(true);
      expect(canViewWidget("vat-collection", ROLES.CEO)).toBe(true);
      expect(canViewWidget("inventory-health", ROLES.CEO)).toBe(true);
    });

    it("returns true for ADMIN on all widgets", () => {
      expect(canViewWidget("revenue-kpi", ROLES.ADMIN)).toBe(true);
      expect(canViewWidget("agent-scorecard", ROLES.ADMIN)).toBe(true);
    });

    it("returns false for SALES_AGENT on financial widgets", () => {
      expect(canViewWidget("cash-flow", ROLES.SALES_AGENT)).toBe(false);
      expect(canViewWidget("gross-margin", ROLES.SALES_AGENT)).toBe(false);
    });

    it("returns true for SALES_AGENT on their own widgets", () => {
      expect(canViewWidget("agent-scorecard", ROLES.SALES_AGENT)).toBe(true);
      expect(canViewWidget("commission-tracker", ROLES.SALES_AGENT)).toBe(true);
    });

    it("returns true for CFO on financial and VAT widgets", () => {
      expect(canViewWidget("revenue-kpi", ROLES.CFO)).toBe(true);
      expect(canViewWidget("vat-collection", ROLES.CFO)).toBe(true);
      expect(canViewWidget("ar-aging", ROLES.CFO)).toBe(true);
    });

    it("returns true for WAREHOUSE_MANAGER on inventory widgets", () => {
      expect(canViewWidget("inventory-health", ROLES.WAREHOUSE_MANAGER)).toBe(true);
      expect(canViewWidget("reorder-alerts", ROLES.WAREHOUSE_MANAGER)).toBe(true);
    });

    it("handles case-insensitive roles", () => {
      expect(canViewWidget("revenue-kpi", "ceo")).toBe(true);
      expect(canViewWidget("revenue-kpi", "CEO")).toBe(true);
    });

    it("returns true for unconfigured widget (default visible)", () => {
      expect(canViewWidget("unknown-widget", ROLES.CEO)).toBe(true);
    });
  });

  describe("getVisibleWidgets", () => {
    it("returns all widgets for CEO", () => {
      const widgets = getVisibleWidgets(ROLES.CEO);
      expect(widgets.length).toBeGreaterThan(20);
    });

    it("returns limited widgets for SALES_AGENT", () => {
      const widgets = getVisibleWidgets(ROLES.SALES_AGENT);
      expect(widgets.length).toBeLessThan(15);
      expect(widgets).toContain("agent-scorecard");
    });

    it("returns financial widgets for ACCOUNTANT", () => {
      const widgets = getVisibleWidgets(ROLES.ACCOUNTANT);
      expect(widgets).toContain("ar-aging");
      expect(widgets).toContain("vat-collection");
    });
  });

  describe("getWidgetsByCategory", () => {
    it("returns financial widgets for CFO", () => {
      const widgets = getWidgetsByCategory("FINANCIAL", ROLES.CFO);
      expect(widgets).toContain("revenue-kpi");
      expect(widgets).toContain("cash-flow");
    });

    it("returns inventory widgets for WAREHOUSE_MANAGER", () => {
      const widgets = getWidgetsByCategory("INVENTORY", ROLES.WAREHOUSE_MANAGER);
      expect(widgets).toContain("inventory-health");
    });

    it("returns empty array for unauthorized category", () => {
      const widgets = getWidgetsByCategory("FINANCIAL", ROLES.SALES_AGENT);
      expect(widgets.length).toBe(0);
    });

    it("returns VAT widgets for ACCOUNTANT", () => {
      const widgets = getWidgetsByCategory("VAT", ROLES.ACCOUNTANT);
      expect(widgets).toContain("vat-collection");
    });
  });

  describe("getDefaultLayout", () => {
    it("returns valid layout for CEO", () => {
      const layout = getDefaultLayout(ROLES.CEO);
      expect(layout).toBeDefined();
      expect(Array.isArray(layout)).toBe(true);
    });

    it("returns valid layout for SALES_AGENT", () => {
      const layout = getDefaultLayout(ROLES.SALES_AGENT);
      expect(layout).toBeDefined();
    });

    it("handles unknown role with fallback", () => {
      const layout = getDefaultLayout("unknown");
      expect(layout).toBeDefined();
    });
  });

  describe("WIDGET_CATEGORIES", () => {
    it("has all required categories", () => {
      expect(WIDGET_CATEGORIES).toHaveProperty("FINANCIAL");
      expect(WIDGET_CATEGORIES).toHaveProperty("INVENTORY");
      expect(WIDGET_CATEGORIES).toHaveProperty("PRODUCT");
      expect(WIDGET_CATEGORIES).toHaveProperty("CUSTOMER");
      expect(WIDGET_CATEGORIES).toHaveProperty("SALES_AGENT");
      expect(WIDGET_CATEGORIES).toHaveProperty("VAT");
    });
  });
});
