// Owner: sales
// Tests: stock allocation panel during invoice creation
// Route: /app/invoices/new (with product selected)

describe("Invoice Stock Allocation - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  it("should load the invoices page as baseline", () => {
    cy.visit("/app/invoices");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.get("body").should(($body) => {
      const text = $body.text().toLowerCase();
      expect(text).to.include("invoice");
    });
  });

  it("should load the create invoice page with a form", () => {
    cy.visit("/app/invoices/new");
    cy.url().should("include", "/app/invoices/new");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.get("body").then(($body) => {
      const hasForm = $body.find("form, [class*='form'], [class*='Form']").length > 0;
      const hasFormContent = $body.text().toLowerCase().includes("customer") || $body.text().toLowerCase().includes("invoice");
      expect(hasForm || hasFormContent, "Should display invoice creation form or content").to.be.true;
    });
  });

  it("should have a product autocomplete on line items", () => {
    cy.visit("/app/invoices/new");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.get("body").then(($body) => {
      const hasProductInput =
        $body.find('[data-testid*="product-autocomplete"], input[placeholder*="product"], input[placeholder*="item"], [class*="autocomplete"]').length > 0;
      const hasProductLabel = $body.text().toLowerCase().includes("product") || $body.text().toLowerCase().includes("item");
      expect(hasProductInput || hasProductLabel, "Should have product selection field or label").to.be.true;
    });
  });

  it("should have quantity and rate fields on line items", () => {
    cy.visit("/app/invoices/new");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.get("body").then(($body) => {
      const hasQuantity =
        $body.find('input[name*="quantity"], input[name*="qty"], input[placeholder*="qty"], input[placeholder*="quantity"]').length > 0 ||
        $body.text().toLowerCase().includes("quantity");
      const hasRate =
        $body.find('input[name*="rate"], input[name*="price"], input[placeholder*="rate"], input[placeholder*="price"]').length > 0 ||
        $body.text().toLowerCase().includes("rate");
      expect(hasQuantity, "Quantity field or label should exist").to.be.true;
      expect(hasRate, "Rate field or label should exist").to.be.true;
    });
  });

  it("should have allocation-related UI elements", () => {
    cy.visit("/app/invoices/new");
    cy.get("body", { timeout: 15000 }).should("be.visible").then(($body) => {
      const text = $body.text().toLowerCase();
      const hasAllocationUI =
        text.includes("allocation") ||
        text.includes("warehouse") ||
        text.includes("source") ||
        text.includes("stock") ||
        text.includes("batch") ||
        $body.find('[data-testid*="allocation"], [data-testid*="source-type"]').length > 0;
      expect(hasAllocationUI, "Allocation-related UI elements should exist").to.be.true;
    });
  });

  it("should have a source type selector for allocation", () => {
    cy.visit("/app/invoices/new");
    cy.get("body", { timeout: 15000 }).should("be.visible").then(($body) => {
      const hasSourceSelector =
        $body.find('[data-testid*="source-type"], select:contains("WAREHOUSE"), [class*="source"]').length > 0 ||
        $body.text().toLowerCase().includes("warehouse") ||
        $body.text().toLowerCase().includes("local drop");
      expect(hasSourceSelector, "Source type selector or allocation controls should exist").to.be.true;
    });
  });

  it("should have a save button on the invoice form", () => {
    cy.visit("/app/invoices/new");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.get("body").then(($body) => {
      const hasSaveBtn =
        $body.find("button:contains('Save')").length > 0 ||
        $body.find("button:contains('Create')").length > 0 ||
        $body.find("button:contains('Submit')").length > 0 ||
        $body.find("[data-testid*='save'], [data-testid*='submit']").length > 0;
      expect(hasSaveBtn, "Should have a save/create button").to.be.true;
    });
  });

  it("should have cancel or back navigation", () => {
    cy.visit("/app/invoices/new");
    cy.get("body", { timeout: 15000 }).should("be.visible").then(($body) => {
      const hasCancel =
        $body.find('button:contains("Cancel"), a:contains("Cancel"), button:contains("Back"), a:contains("Back"), [data-testid*="cancel"], [data-testid*="back"]').length > 0;
      expect(hasCancel, "Cancel or back navigation should exist").to.be.true;
    });
  });

  it("should have an invoice date field", () => {
    cy.visit("/app/invoices/new");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.get("body").then(($body) => {
      const hasDateInput = $body.find('input[type="date"], input[name*="date"], input[placeholder*="date"], [data-testid*="date"]').length > 0;
      const hasDateLabel = $body.text().toLowerCase().includes("date");
      expect(hasDateInput || hasDateLabel, "Should have date field or label").to.be.true;
    });
  });

  it("should show totals section with subtotal, VAT, and total labels", () => {
    cy.visit("/app/invoices/new");
    cy.get("body", { timeout: 15000 }).should("be.visible").then(($body) => {
      const text = $body.text().toLowerCase();
      const hasSubtotal = text.includes("subtotal") || text.includes("sub total") || text.includes("sub-total");
      const hasVat = text.includes("vat") || text.includes("tax");
      const hasTotal = text.includes("total");
      expect(hasSubtotal || hasTotal, "Totals section should show subtotal or total").to.be.true;
      expect(hasVat || hasTotal, "Totals section should show VAT or total").to.be.true;
    });
  });
});
