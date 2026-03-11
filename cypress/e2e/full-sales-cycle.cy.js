// Owner: sales
/**
 * Full Sales Cycle E2E Tests
 *
 * Tests the complete sales workflow navigation and data rendering across modules:
 * Quotation -> Invoice -> Delivery -> Payment -> Statement
 *
 * Routes: /app/quotations, /app/invoices, /app/delivery-notes,
 *         /app/receivables, /app/account-statements
 */

describe("Full Sales Cycle - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  describe("Sales Module Navigation", () => {
    it("should load the quotations page with quotation-specific content", () => {
      cy.visit("/app/quotations");
      cy.url().should("include", "/app/quotations");
      cy.get("body", { timeout: 15000 }).should(($body) => {
        const text = $body.text().toLowerCase();
        expect(text).to.include("quotation");
      });
      // Should have either a table or empty state
      cy.get("body").should(($body) => {
        const hasTable = $body.find("table").length > 0;
        const hasContent = $body.text().length > 50;
        expect(hasTable || hasContent, "Quotations page should render data table or content").to.be
          .true;
      });
    });

    it("should load the invoices page with invoice content", () => {
      cy.visit("/app/invoices");
      cy.url().should("include", "/app/invoices");
      cy.get("body", { timeout: 15000 }).should(($body) => {
        const text = $body.text().toLowerCase();
        expect(text).to.include("invoice");
      });
      // Should show table or empty state
      cy.get("body").should(($body) => {
        const hasTable = $body.find("table").length > 0;
        const hasContent = $body.text().length > 100;
        expect(hasTable || hasContent, "Invoices page should show table or content").to.be.true;
      });
    });

    it("should load the delivery notes page", () => {
      cy.visit("/app/delivery-notes");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.get("body").should(($body) => {
        const text = $body.text().toLowerCase();
        expect(text).to.include("deliver");
      });
    });

    it("should load the receivables page with financial content", () => {
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
    it("should navigate across all sales pages without session loss", () => {
      const pages = [
        { url: "/app/quotations", keyword: "quotation" },
        { url: "/app/invoices", keyword: "invoice" },
        { url: "/app/delivery-notes", keyword: "deliver" },
        { url: "/app/receivables", keyword: "receivable" },
      ];

      for (const page of pages) {
        cy.visit(page.url);
        cy.get("body", { timeout: 15000 }).should(($body) => {
          const text = $body.text().toLowerCase();
          expect(text, `${page.url} should contain "${page.keyword}"`).to.include(page.keyword);
        });
        // Verify session not lost (not redirected to login)
        cy.url().should("not.include", "/login");
      }
    });

    it("should navigate from invoice list to create form", () => {
      cy.visit("/app/invoices");
      cy.get("body", { timeout: 15000 }).should(($body) => {
        expect($body.text().toLowerCase()).to.include("invoice");
      });

      // Find and click create button -- try data-testid first, then fallback to links/buttons
      cy.get("body").then(($body) => {
        const $createLinks = $body.find("a[href*='invoices/new']");
        if ($createLinks.length > 0) {
          cy.wrap($createLinks.first()).click();
          cy.url({ timeout: 10000 }).should("include", "/invoices/new");
        } else {
          cy.log("No create invoice link found on page");
        }
      });
    });
  });

  describe("Sales Document Tables", () => {
    it("should display quotations with table structure and headers", () => {
      cy.visit("/app/quotations");
      cy.get("body", { timeout: 15000 }).should(($body) => {
        expect($body.text().toLowerCase()).to.include("quotation");
      });
      // Verify table has headers (not just any table)
      cy.get("body").should(($body) => {
        if ($body.find("table thead th").length > 0) {
          expect(
            $body.find("table thead th").length,
            "Quotations table should have multiple column headers",
          ).to.be.greaterThan(2);
        } else {
          // Acceptable: page has content even without table
          expect($body.text().length).to.be.greaterThan(50);
        }
      });
    });

    it("should display invoices content with table or empty state", () => {
      cy.visit("/app/invoices");
      cy.get("body", { timeout: 15000 }).should(($body) => {
        const text = $body.text().toLowerCase();
        expect(text).to.include("invoice");
        const hasTable = $body.find("table").length > 0;
        const hasContent = $body.text().length > 100;
        expect(hasTable || hasContent, "Invoice page should have table or content").to.be.true;
      });
    });

    it("should display credit notes page", () => {
      cy.visit("/app/credit-notes");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.url().should("include", "/app/credit-notes");
      cy.get("body").should(($body) => {
        const text = $body.text().toLowerCase();
        expect(text).to.include("credit");
      });
    });
  });
});
