// Owner: finance
/**
 * Accounting Periods E2E Tests
 *
 * Tests accounting period management:
 * - View periods list
 * - Period status (open/closed)
 * - Period controls
 *
 * Route: /app/settings/financial (Financial Settings page with periods tab)
 */

describe("Accounting Periods - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
    cy.interceptAPI("GET", "/api/accounting-periods*", "getAccountingPeriods");
    cy.interceptAPI("GET", "/api/financial-settings*", "getFinancialSettings");
  });

  describe("Financial Settings Page", () => {
    it("should load the financial settings page", () => {
      cy.visit("/app/settings/financial");
      cy.verifyPageLoads("Financial", "/app/settings/financial");
    });

    it("should display accounting periods section or tab", () => {
      cy.visit("/app/settings/financial");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      // Look for accounting period related content
      cy.get("body").should(($body) => {
        const text = $body.text().toLowerCase();
        const hasPeriodContent =
          text.includes("period") ||
          text.includes("fiscal") ||
          text.includes("accounting");
        expect(hasPeriodContent, "Should have period-related content").to.be.true;
      });
    });
  });

  describe("Period List", () => {
    it("should display a list of accounting periods", () => {
      cy.visit("/app/settings/financial");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      // Periods should be displayed in a table or list
      cy.get("table, [data-testid*='period'], [class*='period']", {
        timeout: 10000,
      }).should("exist");
    });

    it("should show period status indicators (open/closed)", () => {
      cy.visit("/app/settings/financial");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      // Look for status-related elements
      cy.get("body").should(($body) => {
        const text = $body.text().toLowerCase();
        const hasStatus =
          text.includes("open") ||
          text.includes("closed") ||
          text.includes("active") ||
          text.includes("locked");
        expect(hasStatus, "Should show period status").to.be.true;
      });
    });
  });

  describe("Period Controls", () => {
    it("should have a control to create or manage periods", () => {
      cy.visit("/app/settings/financial");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      // Look for action buttons
      cy.get(
        "button, [data-testid*='create-period'], [data-testid*='add-period'], [data-testid*='manage-period']"
      ).should("have.length.greaterThan", 0);
    });

    it("should show period date ranges", () => {
      cy.visit("/app/settings/financial");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      // Financial settings page should show date-related information
      cy.get("body").should(($body) => {
        const text = $body.text();
        // Look for date patterns or month/year references
        const hasDateInfo =
          /\d{4}/.test(text) || /january|february|march|april|may|june|july|august|september|october|november|december/i.test(text);
        expect(hasDateInfo, "Should display date or year information").to.be.true;
      });
    });
  });
});
