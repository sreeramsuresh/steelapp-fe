/**
 * Dashboard Advanced E2E Tests
 *
 * Tests dashboard and KPI functionality:
 * - Dashboard creation and customization
 * - Widget configuration
 * - KPI tracking
 * - Real-time updates
 * - Export and sharing
 *
 * Run: npm run test:e2e -- --spec "**/dashboard-advanced.cy.js"
 */

describe("Dashboard Advanced - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  describe("Dashboard Creation", () => {
    it("should create custom dashboard", () => {
      cy.visit("/dashboards");
      cy.get('button:contains("New Dashboard")').click();

      cy.get('input[placeholder*="Dashboard Name"]').type("Sales Performance");
      cy.get('textarea[placeholder*="Description"]').type("Sales team metrics");

      cy.get('button:contains("Create Dashboard")').click();
      cy.contains("Dashboard created").should("be.visible");
    });

    it("should add widgets to dashboard", () => {
      cy.visit("/dashboards");
      cy.get('[data-testid="dashboard-row"]').first().click();

      cy.get('button:contains("Edit")').click();

      cy.get('button:contains("Add Widget")').click();

      cy.get('select[name="Widget Type"]').select("KPI");

      cy.get('select[name="Metric"]').select("Total Sales");

      cy.get('button:contains("Add Widget")').click();
      cy.contains("Widget added").should("be.visible");
    });

    it("should configure widget parameters", () => {
      cy.visit("/dashboards");
      cy.get('[data-testid="dashboard-row"]').first().click();

      cy.get('button:contains("Edit")').click();

      cy.get('[data-testid="widget"]').first().within(() => {
        cy.get('button[aria-label="Settings"]').click();
      });

      cy.get('input[placeholder*="Title"]').clear().type("YTD Sales");

      cy.get('select[name="Period"]').select("YEAR_TO_DATE");

      cy.get('button:contains("Save")').click();
      cy.contains("Widget updated").should("be.visible");
    });

    it("should resize and reorder widgets", () => {
      cy.visit("/dashboards");
      cy.get('[data-testid="dashboard-row"]').first().click();

      cy.get('button:contains("Edit")').click();

      // Drag widget
      cy.get('[data-testid="widget"]').first().within(() => {
        cy.get('[class*="drag-handle"]').should("exist");
      });

      cy.get('button:contains("Save Layout")').click();
      cy.contains("Layout saved").should("be.visible");
    });
  });

  describe("KPI Tracking", () => {
    it("should view key metrics", () => {
      cy.visit("/dashboards");

      cy.contains("Total Sales").should("be.visible");
      cy.contains("Active Customers").should("be.visible");
      cy.contains("Pending Orders").should("be.visible");
    });

    it("should track sales KPI", () => {
      cy.visit("/analytics/kpis");

      cy.contains("Total Sales").should("be.visible");
      cy.contains("% Change").should("be.visible");
      cy.contains("Trend").should("be.visible");
    });

    it("should view revenue metrics", () => {
      cy.visit("/analytics/revenue");

      cy.contains("Monthly Revenue").should("be.visible");
      cy.contains("Annual Revenue").should("be.visible");
      cy.contains("Average Order Value").should("be.visible");
    });

    it("should track operational KPIs", () => {
      cy.visit("/analytics/operations");

      cy.contains("Order Processing Time").should("be.visible");
      cy.contains("Delivery On-Time Rate").should("be.visible");
      cy.contains("Invoice Collection Rate").should("be.visible");
    });
  });

  describe("Dashboard Sharing", () => {
    it("should share dashboard with user", () => {
      cy.visit("/dashboards");
      cy.get('[data-testid="dashboard-row"]').first().click();

      cy.get('button:contains("Share")').click();

      cy.get('input[placeholder*="User"]').type("john@example.com");

      cy.get('select[name="Permission"]').select("VIEW");

      cy.get('button:contains("Share")').click();
      cy.contains("Dashboard shared").should("be.visible");
    });

    it("should make dashboard public", () => {
      cy.visit("/dashboards");
      cy.get('[data-testid="dashboard-row"]').first().click();

      cy.get('button:contains("Share")').click();

      cy.get('checkbox[name="public"]').check();

      cy.get('button:contains("Generate Link")').click();

      cy.contains("Public link").should("be.visible");
    });

    it("should revoke dashboard access", () => {
      cy.visit("/dashboards");
      cy.get('[data-testid="dashboard-row"]').first().click();

      cy.get('button:contains("Sharing Settings")').click();

      cy.get('[data-testid="share-row"]').first().within(() => {
        cy.get('button[aria-label="Revoke"]').click();
      });

      cy.get('button:contains("Confirm")').click();
      cy.contains("Access revoked").should("be.visible");
    });
  });

  describe("Dashboard Export", () => {
    it("should export dashboard as PDF", () => {
      cy.visit("/dashboards");
      cy.get('[data-testid="dashboard-row"]').first().click();

      cy.get('button:contains("Export")').click();
      cy.get('select[name="Format"]').select("PDF");

      cy.get('button:contains("Export")').click();
      cy.readFile("cypress/downloads/dashboard-*.pdf").should("exist");
    });

    it("should schedule dashboard email", () => {
      cy.visit("/dashboards");
      cy.get('[data-testid="dashboard-row"]').first().click();

      cy.get('button:contains("Schedule")').click();

      cy.get('input[placeholder*="Email"]').type("manager@example.com");

      cy.get('select[name="Frequency"]').select("WEEKLY");
      cy.get('select[name="Day"]').select("Monday");

      cy.get('button:contains("Schedule")').click();
      cy.contains("Email scheduled").should("be.visible");
    });
  });

  describe("Dashboard Analytics", () => {
    it("should view metrics by time period", () => {
      cy.visit("/analytics");

      cy.get('select[name="Period"]').select("MONTH");

      cy.contains("This Month").should("be.visible");
    });

    it("should compare periods", () => {
      cy.visit("/analytics");

      cy.get('button:contains("Compare")').click();

      cy.get('select[name="Period 1"]').select("January");
      cy.get('select[name="Period 2"]').select("February");

      cy.get('button:contains("Compare")').click();

      cy.contains("Comparison").should("be.visible");
    });

    it("should view trend analysis", () => {
      cy.visit("/analytics");

      cy.get('button:contains("Trends")').click();

      cy.contains("3-Month Trend").should("be.visible");
      cy.contains("12-Month Trend").should("be.visible");
    });
  });

  describe("Real-time Dashboard Updates", () => {
    it("should auto-refresh dashboard data", () => {
      cy.visit("/dashboards");

      cy.get('select[name="Refresh Interval"]').select("EVERY_5_MINUTES");

      cy.contains("Auto-refresh enabled").should("be.visible");
    });

    it("should manually refresh dashboard", () => {
      cy.visit("/dashboards");
      cy.get('[data-testid="dashboard-row"]').first().click();

      cy.get('button:contains("Refresh")').click();

      cy.contains("Dashboard updated").should("be.visible");
    });
  });
});
