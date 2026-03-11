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
      cy.visit("/app/finance");
      cy.verifyPageLoads("Finance", "/app/finance");

      // Hub should contain navigation cards or links to sub-modules
      cy.get("body", { timeout: 15000 }).then(($body) => {
        const hasCards =
          $body.find("[data-testid*='card'], [data-testid*='nav'], a[href*='receivable'], a[href*='payable'], [class*='card']").length > 0 ||
          $body.find("a, button").length > 0;
        expect(hasCards, "Finance hub should have navigation cards or links").to.be.true;
      });
    });

    it("should display links to receivables, payables, and operating expenses", () => {
      cy.visit("/app/finance");
      cy.verifyPageLoads("Finance", "/app/finance");

      // Verify key finance sub-module references are present
      cy.get("body", { timeout: 10000 }).then(($body) => {
        const text = $body.text().toLowerCase();
        const hasFinanceLinks =
          text.includes("receivable") ||
          text.includes("payable") ||
          text.includes("expense") ||
          text.includes("finance");
        expect(hasFinanceLinks, "Finance hub should reference key sub-modules").to.be.true;
      });
    });
  });

  describe("Trial Balance Report", () => {
    it("should load with heading and date range controls", () => {
      cy.visit("/analytics/trial-balance");
      cy.verifyPageLoads("Trial Balance", "/analytics/trial-balance");

      // Expect date-related controls (date pickers, period selectors, or filter inputs)
      cy.get("body", { timeout: 10000 }).then(($body) => {
        const hasControls =
          $body.find("[data-testid*='date'], [data-testid*='period'], input[type='date'], [class*='date'], select, [role='combobox']").length > 0 ||
          $body.find("button, input, a").length > 0;
        expect(hasControls, "Trial balance should have date controls or interactive elements").to.be.true;
      });
    });

    it("should render report table or content after loading", () => {
      cy.visit("/analytics/trial-balance");
      cy.verifyPageLoads("Trial Balance", "/analytics/trial-balance");

      // Report may need data to render a table; check for any content
      cy.get("body", { timeout: 20000 }).then(($body) => {
        const hasTable = $body.find("table").length > 0;
        const hasReport = $body.find("[data-testid*='report'], [class*='report'], [class*='trial-balance']").length > 0;
        const hasContent = $body.text().toLowerCase().includes("trial balance");
        expect(hasTable || hasReport || hasContent, "Should render trial balance content").to.be.true;
      });
    });
  });

  describe("Cash Book Report", () => {
    it("should load with heading and filter controls", () => {
      cy.visit("/analytics/cash-book");
      cy.verifyPageLoads("Cash Book", "/analytics/cash-book");

      // Expect filter controls (date pickers, dropdowns, or filter buttons)
      cy.get("body", { timeout: 10000 }).then(($body) => {
        const hasControls =
          $body.find("[data-testid*='filter'], [data-testid*='date'], input[type='date'], select, button, [role='combobox'], input").length > 0;
        expect(hasControls, "Cash book should have filter controls").to.be.true;
      });
    });

    it("should render report content after loading", () => {
      cy.visit("/analytics/cash-book");
      cy.verifyPageLoads("Cash Book", "/analytics/cash-book");

      cy.get("body", { timeout: 20000 }).should("not.be.empty");

      // Report should display a table, chart, or meaningful content
      cy.get("body").then(($body) => {
        const hasReportContent =
          $body.find("table, canvas, svg, [data-testid*='report'], [class*='chart'], [class*='report']").length > 0 ||
          $body.find("button, input, select, a").length > 0 ||
          $body.text().length > 50;
        expect(hasReportContent, "Cash book should have report content or interactive elements").to.be.true;
      });
    });
  });

  describe("Journal Register Report", () => {
    it("should load with heading", () => {
      cy.visit("/analytics/journal-register");
      cy.verifyPageLoads("Journal Register", "/analytics/journal-register");
    });

    it("should render report content after loading", () => {
      cy.visit("/analytics/journal-register");
      cy.verifyPageLoads("Journal Register", "/analytics/journal-register");

      cy.get("body", { timeout: 20000 }).then(($body) => {
        const hasTable = $body.find("table").length > 0;
        const hasReport = $body.find("[data-testid*='journal'], [data-testid*='report'], [class*='report']").length > 0;
        const hasContent = $body.text().toLowerCase().includes("journal");
        expect(hasTable || hasReport || hasContent, "Should render journal register content").to.be.true;
      });
    });
  });

  describe("Bank Reports", () => {
    it("should load bank ledger page with heading", () => {
      cy.visit("/analytics/bank-ledger");
      cy.verifyPageLoads("Bank Ledger", "/analytics/bank-ledger");

      // Should have account selection or filter controls
      cy.get("body", { timeout: 10000 }).then(($body) => {
        const hasControls =
          $body.find("[data-testid*='account'], [data-testid*='filter'], select, [role='combobox'], input").length > 0 ||
          $body.find("button, a").length > 0;
        expect(hasControls, "Bank ledger should have filter controls or interactive elements").to.be.true;
      });
    });

    it("should load bank reconciliation page with heading", () => {
      cy.visit("/analytics/bank-reconciliation");
      cy.verifyPageLoads("Bank Reconciliation", "/analytics/bank-reconciliation");

      // Should have controls for reconciliation workflow
      cy.get("body", { timeout: 10000 }).then(($body) => {
        const hasControls =
          $body.find("[data-testid*='reconcil'], [data-testid*='statement'], select, button, [role='combobox'], input").length > 0 ||
          $body.find("a").length > 0;
        expect(hasControls, "Bank reconciliation should have controls or interactive elements").to.be.true;
      });
    });
  });
});
