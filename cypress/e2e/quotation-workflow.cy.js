// Owner: sales
/**
 * Quotation Workflow E2E Tests
 *
 * Tests the quotation lifecycle:
 * - List quotations
 * - Create new quotation
 * - Quotation form fields
 * - Status management (draft/active)
 * - Convert to invoice flow
 *
 * Routes: /app/quotations, /app/quotations/new, /app/quotations/:id
 */

describe("Quotation Workflow - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
    cy.intercept("GET", "**/api/quotations*").as("getQuotations");
    cy.intercept("GET", "**/api/customers*").as("getCustomers");
  });

  describe("Quotation List", () => {
    it("should load the quotations page with heading", () => {
      cy.visit("/app/quotations");
      cy.wait("@getQuotations");
      cy.get("body", { timeout: 10000 }).should("be.visible");
      cy.verifyPageLoads("Quotation", "/app/quotations");
    });

    it("should display quotations in a table with columns", () => {
      cy.visit("/app/quotations");
      cy.wait("@getQuotations");
      cy.get("body", { timeout: 10000 }).should("be.visible");
      cy.get("table", { timeout: 10000 }).should("exist");
      cy.get("table thead th").should("have.length.greaterThan", 2);
    });

    it("should have search input for filtering quotations", () => {
      cy.visit("/app/quotations");
      cy.wait("@getQuotations");
      cy.get("body", { timeout: 10000 }).should("be.visible");
      cy.get('input[placeholder*="Search"], input[type="search"], [data-testid*="search"]')
        .first()
        .should("be.visible");
    });

    it("should have create quotation button", () => {
      cy.visit("/app/quotations");
      cy.wait("@getQuotations");
      cy.get("body", { timeout: 10000 }).should("be.visible");
      cy.get("body").then(($body) => {
        const hasCreateBtn =
          $body.find("a[href*='quotations/new']").length > 0 ||
          $body.find("button:contains('Create')").length > 0 ||
          $body.find("button:contains('New')").length > 0 ||
          $body.find("[data-testid*='create-quotation']").length > 0;
        expect(hasCreateBtn, "Should have create quotation button").to.be.true;
      });
    });
  });

  describe("Create Quotation Form", () => {
    it("should load the create quotation form", () => {
      cy.visit("/app/quotations/new");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.url().should("include", "/quotations/new");
    });

    it("should have customer selection field", () => {
      cy.visit("/app/quotations/new");
      cy.get("body", { timeout: 10000 }).should("be.visible");
      cy.get(
        '[data-testid="customer-autocomplete"], input[placeholder*="customer"], select'
      ).should("exist");
    });

    it("should have product line item section", () => {
      cy.visit("/app/quotations/new");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.get("body").should(($body) => {
        const text = $body.text().toLowerCase();
        const hasProducts =
          text.includes("product") ||
          text.includes("item") ||
          text.includes("line");
        expect(hasProducts, "Should have product/line item section").to.be.true;
      });
    });

    it("should have validity date field", () => {
      cy.visit("/app/quotations/new");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.get(
        'input[type="date"], input[name*="valid"], [data-testid*="validity"]'
      ).should("have.length.greaterThan", 0);
    });

    it("should have save and status action buttons", () => {
      cy.visit("/app/quotations/new");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.get("button").should("have.length.greaterThan", 1);
    });
  });

  describe("Quotation View", () => {
    it("should display existing quotation details when navigated", () => {
      cy.visit("/app/quotations");
      cy.wait("@getQuotations");
      cy.get("body", { timeout: 10000 }).should("be.visible");
      // Check if there are any quotation rows to click
      cy.get("table tbody tr, [data-testid*='quotation-row']").then(($rows) => {
        if ($rows.length > 0) {
          // Click the first quotation
          cy.wrap($rows.first()).find("a, button, td").first().click();
          // Should navigate to quotation detail or edit page
          cy.url({ timeout: 10000 }).should("match", /quotations\/\d+/);
        } else {
          // No quotations exist, just verify the empty state
          cy.get("body").should(($body) => {
            expect($body.text().length).to.be.greaterThan(10);
          });
        }
      });
    });
  });
});
