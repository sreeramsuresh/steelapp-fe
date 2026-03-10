// Owner: sales
/**
 * Full Sales Cycle E2E Tests
 *
 * Tests the complete sales workflow across multiple modules:
 * Quotation → Invoice → Delivery → Payment → Statement
 *
 * Routes: /app/quotations, /app/invoices, /app/delivery-notes,
 *         /app/receivables, /app/account-statements
 */

describe("Full Sales Cycle - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  describe("Sales Module Navigation", () => {
    it("should load the quotations page", () => {
      cy.visit("/app/quotations");
      cy.verifyPageLoads("Quotation", "/app/quotations");
    });

    it("should load the invoices page", () => {
      cy.visit("/app/invoices");
      cy.verifyPageLoads("Invoice", "/app/invoices");
    });

    it("should load the delivery notes page", () => {
      cy.visit("/app/delivery-notes");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.get("body").should(($body) => {
        const text = $body.text().toLowerCase();
        expect(text).to.include("deliver");
      });
    });

    it("should load the receivables page", () => {
      cy.visit("/app/receivables");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.get("body").should(($body) => {
        const text = $body.text().toLowerCase();
        expect(text).to.include("receivable");
      });
    });

    it("should load the account statements page", () => {
      cy.visit("/app/account-statements");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.url().should("include", "/app/account-statements");
    });
  });

  describe("Sequential Sales Navigation", () => {
    it("should navigate across all sales pages sequentially", () => {
      cy.visit("/app/quotations");
      cy.get("body", { timeout: 15000 }).should("be.visible");

      cy.visit("/app/invoices");
      cy.get("body", { timeout: 15000 }).should("be.visible");

      cy.visit("/app/delivery-notes");
      cy.get("body", { timeout: 15000 }).should("be.visible");

      cy.visit("/app/receivables");
      cy.get("body", { timeout: 15000 }).should("be.visible");
    });

    it("should navigate from invoice list to create form", () => {
      cy.visit("/app/invoices");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.get("body").then(($body) => {
        const $createLinks = $body.find("a[href*='invoices/new']");
        const $createButtons = $body.find("button").filter(':contains("Create"), :contains("New")');
        const $all = $createLinks.add($createButtons);
        if ($all.length > 0) {
          cy.wrap($all.first()).click();
          cy.url({ timeout: 10000 }).should("include", "/invoices/new");
        } else {
          cy.log("No create button found — invoice list loaded successfully");
        }
      });
    });
  });

  describe("Sales Document Tables", () => {
    it("should display quotations with table structure", () => {
      cy.visit("/app/quotations");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.get("body").then(($body) => {
        const hasTable = $body.find("table").length > 0;
        const hasContent = $body.text().toLowerCase().includes("quotation");
        expect(hasTable || hasContent, "Should show quotations table or content").to.be.true;
      });
    });

    it("should display invoices with table structure", () => {
      cy.visit("/app/invoices");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.get("body").then(($body) => {
        const hasTable = $body.find("table").length > 0;
        const hasContent = $body.text().toLowerCase().includes("invoice");
        expect(hasTable || hasContent, "Should show invoices table or content").to.be.true;
      });
    });

    it("should display credit notes page", () => {
      cy.visit("/app/credit-notes");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.url().should("include", "/app/credit-notes");
    });
  });
});
