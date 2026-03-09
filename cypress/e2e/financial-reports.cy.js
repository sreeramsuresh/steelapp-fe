// Owner: finance
/**
 * Financial Reports - E2E Tests
 *
 * Covers navigation and rendering for financial report pages:
 * Trial Balance, Cash Book, Journal Register, Bank Ledger,
 * Bank Reconciliation, and the Finance Dashboard hub.
 */

describe("Financial Reports - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  describe("Finance Dashboard", () => {
    it("should load finance hub page with navigation cards", () => {
      cy.intercept("GET", "/api/receivables*").as("getReceivables");
      cy.intercept("GET", "/api/payables*").as("getPayables");

      cy.visit("/app/finance");
      cy.verifyPageLoads("Finance", "/app/finance");

      // Hub should contain navigation cards or links to sub-modules
      cy.get(
        "[data-testid*='card'], [data-testid*='nav'], a[href*='receivable'], a[href*='payable'], [class*='card']",
        { timeout: 15000 },
      ).should("have.length.greaterThan", 0);
    });

    it("should display links to receivables, payables, and operating expenses", () => {
      cy.visit("/app/finance");
      cy.verifyPageLoads("Finance", "/app/finance");

      // Verify key finance sub-module references are present
      cy.contains(/receivable/i, { timeout: 10000 }).should("exist");
      cy.contains(/payable/i, { timeout: 10000 }).should("exist");
      cy.contains(/expense/i, { timeout: 10000 }).should("exist");
    });
  });

  describe("Trial Balance Report", () => {
    it("should load with heading and date range controls", () => {
      cy.intercept("GET", "/api/financial-reports/trial-balance*").as("getTrialBalance");

      cy.visit("/analytics/trial-balance");
      cy.verifyPageLoads("Trial Balance", "/analytics/trial-balance");

      // Expect date-related controls (date pickers, period selectors, or filter inputs)
      cy.get(
        "[data-testid*='date'], [data-testid*='period'], input[type='date'], [class*='date'], select, [role='combobox']",
        { timeout: 10000 },
      ).should("have.length.greaterThan", 0);
    });

    it("should render report table or content after loading", () => {
      cy.intercept("GET", "/api/financial-reports/trial-balance*").as("getTrialBalance");

      cy.visit("/analytics/trial-balance");
      cy.verifyPageLoads("Trial Balance", "/analytics/trial-balance");

      // Wait for the API call to complete
      cy.wait("@getTrialBalance", { timeout: 20000 });

      // Report should render a table, chart, or meaningful content area
      cy.get("table, [data-testid*='report'], [data-testid*='table'], [class*='report']", {
        timeout: 15000,
      }).should("have.length.greaterThan", 0);
    });
  });

  describe("Cash Book Report", () => {
    it("should load with heading and filter controls", () => {
      cy.intercept("GET", "/api/financial-reports/*").as("getCashBook");

      cy.visit("/analytics/cash-book");
      cy.verifyPageLoads("Cash Book", "/analytics/cash-book");

      // Expect filter controls (date pickers, dropdowns, or filter buttons)
      cy.get(
        "[data-testid*='filter'], [data-testid*='date'], input[type='date'], select, button, [role='combobox']",
        { timeout: 10000 },
      ).should("have.length.greaterThan", 0);
    });

    it("should render report content after loading", () => {
      cy.intercept("GET", "/api/financial-reports/*").as("getCashBookData");

      cy.visit("/analytics/cash-book");
      cy.verifyPageLoads("Cash Book", "/analytics/cash-book");

      cy.wait("@getCashBookData", { timeout: 20000 });

      // Report should display a table or chart
      cy.get("table, canvas, svg, [data-testid*='report'], [class*='chart'], [class*='report']", {
        timeout: 15000,
      }).should("have.length.greaterThan", 0);
    });
  });

  describe("Journal Register Report", () => {
    it("should load with heading", () => {
      cy.intercept("GET", "/api/financial-reports/journal-register*").as("getJournalRegister");

      cy.visit("/analytics/journal-register");
      cy.verifyPageLoads("Journal Register", "/analytics/journal-register");
    });

    it("should render report content after loading", () => {
      cy.intercept("GET", "/api/financial-reports/journal-register*").as("getJournalRegister");

      cy.visit("/analytics/journal-register");
      cy.verifyPageLoads("Journal Register", "/analytics/journal-register");

      cy.wait("@getJournalRegister", { timeout: 20000 });

      // Journal register should render tabular data or a content area
      cy.get("table, [data-testid*='journal'], [data-testid*='report'], [class*='report']", {
        timeout: 15000,
      }).should("have.length.greaterThan", 0);
    });
  });

  describe("Bank Reports", () => {
    it("should load bank ledger page with heading", () => {
      cy.intercept("GET", "/api/bank-reconciliation/bank-ledger*").as("getBankLedger");

      cy.visit("/analytics/bank-ledger");
      cy.verifyPageLoads("Bank Ledger", "/analytics/bank-ledger");

      // Should have account selection or filter controls
      cy.get(
        "[data-testid*='account'], [data-testid*='filter'], select, [role='combobox'], input",
        { timeout: 10000 },
      ).should("have.length.greaterThan", 0);
    });

    it("should load bank reconciliation page with heading", () => {
      cy.intercept("GET", "/api/bank-reconciliation/*").as("getBankReconciliation");

      cy.visit("/analytics/bank-reconciliation");
      cy.verifyPageLoads("Bank Reconciliation", "/analytics/bank-reconciliation");

      // Should have controls for reconciliation workflow
      cy.get(
        "[data-testid*='reconcil'], [data-testid*='statement'], select, button, [role='combobox'], input",
        { timeout: 10000 },
      ).should("have.length.greaterThan", 0);
    });
  });
});
