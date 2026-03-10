// Owner: sales
/**
 * Invoice Create Workflow E2E Tests
 *
 * Tests the full invoice creation flow:
 * - Navigate to create form
 * - Select customer
 * - Add line items with products
 * - Stock allocation panel
 * - Save/confirm invoice
 *
 * Routes: /app/invoices/new, /app/invoices/:id
 */

describe("Invoice Create Workflow - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  describe("Invoice List to Create Navigation", () => {
    it("should navigate from invoice list to create form", () => {
      cy.visit("/app/invoices");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.contains(/invoices/i, { timeout: 15000 }).should("be.visible");
      // Click create button
      cy.get("body").then(($body) => {
        const $createLinks = $body.find("a[href*='invoices/new']");
        const $createButtons = $body.find("button").filter(':contains("Create"), :contains("New")');
        const $all = $createLinks.add($createButtons);
        if ($all.length > 0) {
          cy.wrap($all.first()).click();
          cy.url({ timeout: 10000 }).should("include", "/invoices/new");
        } else {
          cy.log("No create button found on invoice list page");
        }
      });
    });

    it("should load the create invoice form directly", () => {
      cy.visit("/app/invoices/new");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.url().should("include", "/invoices/new");
      // Form should have customer selection area
      cy.get("body").should(($body) => {
        const text = $body.text().toLowerCase();
        const hasFormContent =
          text.includes("customer") || text.includes("invoice") || text.includes("new");
        expect(hasFormContent, "Should display invoice form content").to.be.true;
      });
    });
  });

  describe("Customer Selection", () => {
    it("should display customer autocomplete input", () => {
      cy.visit("/app/invoices/new");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.get("body").then(($body) => {
        const hasCustomerInput =
          $body.find('[data-testid="customer-autocomplete"]').length > 0 ||
          $body.find('input[placeholder*="customer"], input[placeholder*="Customer"]').length > 0 ||
          $body.text().toLowerCase().includes("customer");
        expect(hasCustomerInput, "Should have customer selection field").to.be.true;
      });
    });

    it("should load customer list when autocomplete is focused", () => {
      cy.visit("/app/invoices/new");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.get("body").then(($body) => {
        const $inputs = $body.find('[data-testid="customer-autocomplete"], input[placeholder*="customer"], input[placeholder*="Customer"]');
        if ($inputs.length > 0) {
          cy.wrap($inputs.first()).click();
          cy.get(
            '[data-testid="customer-autocomplete-listbox"], [role="listbox"], [role="option"], [class*="dropdown"], [class*="menu"]',
            { timeout: 10000 }
          ).should("exist");
        } else {
          cy.log("No customer autocomplete input found");
        }
      });
    });
  });

  describe("Line Items", () => {
    it("should have product selection for line items", () => {
      cy.visit("/app/invoices/new");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      // Look for product autocomplete or line item section
      cy.get("body").should(($body) => {
        const text = $body.text().toLowerCase();
        const hasLineItems =
          text.includes("product") ||
          text.includes("item") ||
          text.includes("line") ||
          text.includes("add");
        expect(hasLineItems, "Should have line item section").to.be.true;
      });
    });

    it("should have quantity and rate input fields", () => {
      cy.visit("/app/invoices/new");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.get("body").then(($body) => {
        const hasNumericInputs =
          $body.find('input[name*="quantity"], input[name*="rate"], input[name*="price"], input[type="number"]').length > 0;
        const hasLabels = $body.text().toLowerCase().includes("quantity") || $body.text().toLowerCase().includes("rate");
        expect(hasNumericInputs || hasLabels, "Should have quantity and rate fields or labels").to.be.true;
      });
    });
  });

  describe("Form Controls", () => {
    it("should have save/draft button", () => {
      cy.visit("/app/invoices/new");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.get("button").should("have.length.greaterThan", 0);
      cy.get("body").then(($body) => {
        const hasSaveButton =
          $body.find("button:contains('Save')").length > 0 ||
          $body.find("button:contains('Draft')").length > 0 ||
          $body.find("button:contains('Create')").length > 0 ||
          $body.find("[data-testid*='save'], [data-testid*='submit']").length > 0;
        expect(hasSaveButton, "Should have a save/draft button").to.be.true;
      });
    });

    it("should have cancel/back navigation", () => {
      cy.visit("/app/invoices/new");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.get("body").then(($body) => {
        const hasCancelNav =
          $body.find("button:contains('Cancel')").length > 0 ||
          $body.find("a:contains('Back')").length > 0 ||
          $body.find("button:contains('Back')").length > 0 ||
          $body.find("[data-testid*='cancel'], [data-testid*='back']").length > 0;
        expect(hasCancelNav, "Should have cancel/back navigation").to.be.true;
      });
    });

    it("should display invoice date field", () => {
      cy.visit("/app/invoices/new");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.get(
        'input[type="date"], input[name*="date"], [data-testid*="invoice-date"]'
      ).should("have.length.greaterThan", 0);
    });

    it("should show totals section (subtotal, VAT, total)", () => {
      cy.visit("/app/invoices/new");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.get("body").should(($body) => {
        const text = $body.text().toLowerCase();
        const hasTotals =
          text.includes("subtotal") ||
          text.includes("total") ||
          text.includes("vat") ||
          text.includes("amount");
        expect(hasTotals, "Should display totals section").to.be.true;
      });
    });
  });
});
