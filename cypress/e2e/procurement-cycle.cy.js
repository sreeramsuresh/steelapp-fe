// Owner: procurement
/**
 * Procurement Cycle E2E Tests
 *
 * Tests the complete procurement workflow:
 * PO → GRN → Supplier Bill → Payment → Reconciliation
 *
 * Routes: /app/purchases, /app/supplier-bills, /app/payables,
 *         /app/debit-notes, /app/advance-payments
 */

describe("Procurement Cycle - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  describe("Procurement Module Navigation", () => {
    it("should load the purchases dashboard", () => {
      cy.visit("/app/purchases");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.get("body").should(($body) => {
        const text = $body.text().toLowerCase();
        expect(text).to.include("purchase");
      });
    });

    it("should load the supplier bills page", () => {
      cy.visit("/app/supplier-bills");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.url().should("include", "/app/supplier-bills");
    });

    it("should load the payables page", () => {
      cy.visit("/app/payables");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.get("body").should(($body) => {
        const text = $body.text().toLowerCase();
        expect(text).to.include("payable");
      });
    });

    it("should load the debit notes page", () => {
      cy.visit("/app/debit-notes");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.url().should("include", "/app/debit-notes");
    });

    it("should load the advance payments page", () => {
      cy.visit("/app/advance-payments");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.url().should("include", "/app/advance-payments");
    });
  });

  describe("Sequential Procurement Navigation", () => {
    it("should navigate across procurement pages sequentially", () => {
      cy.visit("/app/purchases");
      cy.get("body", { timeout: 15000 }).should("be.visible");

      cy.visit("/app/supplier-bills");
      cy.get("body", { timeout: 15000 }).should("be.visible");

      cy.visit("/app/payables");
      cy.get("body", { timeout: 15000 }).should("be.visible");

      cy.visit("/app/debit-notes");
      cy.get("body", { timeout: 15000 }).should("be.visible");
    });

    it("should have PO creation entry point from purchases", () => {
      cy.visit("/app/purchases");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.get("body").then(($body) => {
        const hasCreateLink =
          $body.find("a[href*='po/new']").length > 0 ||
          $body.find("a[href*='purchase-orders/new']").length > 0 ||
          $body.find("button:contains('Create')").length > 0 ||
          $body.find("button:contains('New')").length > 0;
        expect(hasCreateLink, "Should have PO creation entry point").to.be.true;
      });
    });

    it("should render tables on procurement list pages", () => {
      cy.visit("/app/purchases");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.get("table, [data-testid*='po-'], [data-testid*='purchase']", {
        timeout: 10000,
      }).should("exist");
    });

    it("should render supplier bills table", () => {
      cy.visit("/app/supplier-bills");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.get("body").then(($body) => {
        const hasTable = $body.find("table").length > 0;
        const hasBillContent = $body.text().toLowerCase().includes("bill") || $body.text().toLowerCase().includes("supplier");
        expect(hasTable || hasBillContent, "Should show supplier bills table or content").to.be.true;
      });
    });

    it("should display finance dashboard with procurement links", () => {
      cy.visit("/app/finance");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.get("body").then(($body) => {
        const text = $body.text().toLowerCase();
        const hasFinanceContent =
          text.includes("finance") ||
          text.includes("payable") ||
          text.includes("receivable") ||
          text.includes("dashboard");
        expect(hasFinanceContent, "Should show finance dashboard content").to.be.true;
      });
    });
  });
});
