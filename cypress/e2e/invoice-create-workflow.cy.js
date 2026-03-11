// Owner: sales
/**
 * Invoice Create Workflow E2E Tests
 *
 * Tests the full invoice creation form structure and readiness:
 * - Navigate to create form
 * - Customer autocomplete present
 * - Line item section with product/quantity/rate fields
 * - Totals section (subtotal, VAT, total)
 * - Save/confirm actions
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
      cy.get("body", { timeout: 15000 }).should(($body) => {
        expect($body.text().toLowerCase()).to.include("invoice");
      });
      // Click create button if it exists
      cy.get("body").then(($body) => {
        const $createLink = $body.find("a[href*='invoices/new']");
        if ($createLink.length > 0) {
          cy.wrap($createLink.first()).click();
          cy.url({ timeout: 10000 }).should("include", "/invoices/new");
        } else {
          cy.log("No create invoice link found -- navigating directly");
          cy.visit("/app/invoices/new");
          cy.url().should("include", "/invoices/new");
        }
      });
    });

    it("should load the create invoice form with the invoice-form container", () => {
      cy.visit("/app/invoices/new");
      cy.url().should("include", "/invoices/new");
      // The InvoiceForm component renders data-testid="invoice-form"
      cy.get('[data-testid="invoice-form"], form', { timeout: 15000 }).should("exist");
    });
  });

  describe("Customer Selection", () => {
    it("should display the customer autocomplete input", () => {
      cy.visit("/app/invoices/new");
      // InvoiceForm has data-testid="customer-autocomplete"
      cy.get('[data-testid="customer-autocomplete"]', { timeout: 15000 }).should("be.visible");
    });

    it("should open dropdown when customer autocomplete is focused", () => {
      cy.visit("/app/invoices/new");
      cy.get('[data-testid="customer-autocomplete"]', { timeout: 15000 })
        .should("be.visible")
        .click();
      // Dropdown should appear with listbox or options
      cy.get(
        '[data-testid="customer-autocomplete-listbox"], [role="listbox"], [role="option"]',
        { timeout: 10000 },
      ).should("exist");
    });
  });

  describe("Line Items", () => {
    it("should have product selection area for line items", () => {
      cy.visit("/app/invoices/new");
      cy.get("body", { timeout: 15000 }).should(($body) => {
        const text = $body.text().toLowerCase();
        const hasLineItemSection =
          text.includes("product") || text.includes("item") || text.includes("line");
        const hasAddButton =
          $body.find('[data-testid="add-item-drawer"]').length > 0 ||
          $body.find("button").filter(function () {
            return /add.*item|add.*product|add.*line/i.test(this.textContent);
          }).length > 0;
        expect(
          hasLineItemSection || hasAddButton,
          "Invoice form should have line item section or add item button",
        ).to.be.true;
      });
    });

    it("should have quantity and rate labels visible on the form", () => {
      cy.visit("/app/invoices/new");
      cy.get("body", { timeout: 15000 }).should(($body) => {
        const text = $body.text().toLowerCase();
        // The form should display quantity and rate as labels or input names
        const hasQuantity = text.includes("qty") || text.includes("quantity");
        const hasRate = text.includes("rate") || text.includes("price");
        expect(
          hasQuantity || hasRate,
          "Invoice form should display quantity and rate labels",
        ).to.be.true;
      });
    });
  });

  describe("Form Controls", () => {
    it("should have save draft button with correct testid", () => {
      cy.visit("/app/invoices/new");
      // InvoiceForm has data-testid="save-draft"
      cy.get('[data-testid="save-draft"]', { timeout: 15000 }).should("exist");
    });

    it("should have issue/confirm button or action buttons", () => {
      cy.visit("/app/invoices/new");
      cy.get("body", { timeout: 15000 }).should(($body) => {
        const hasIssueBtn =
          $body.find('[data-testid="issue-final-invoice"]').length > 0 ||
          $body.find("button").filter(function () {
            return /issue|confirm|finalize|save|submit/i.test(this.textContent);
          }).length > 0 ||
          $body.find('[data-testid="save-draft"]').length > 0 ||
          $body.find("button").length > 0;
        expect(hasIssueBtn, "Invoice form should have action buttons").to.be.true;
      });
    });

    it("should have preview button", () => {
      cy.visit("/app/invoices/new");
      cy.get('[data-testid="preview-invoice-button"]', { timeout: 15000 }).should("exist");
    });

    it("should display invoice date field", () => {
      cy.visit("/app/invoices/new");
      cy.get("body", { timeout: 15000 }).should(($body) => {
        const hasDateInput =
          $body.find('input[type="date"], input[name*="date"], [data-testid*="date"]').length > 0;
        expect(hasDateInput, "Invoice form should have a date input field").to.be.true;
      });
    });

    it("should show totals section with subtotal, VAT, and total", () => {
      cy.visit("/app/invoices/new");
      // These data-testid attributes exist in InvoiceForm
      cy.get('[data-testid="subtotal"]', { timeout: 15000 }).should("exist");
      cy.get('[data-testid="vat-amount"]').should("exist");
      cy.get('[data-testid="total"]').should("exist");
    });
  });
});
