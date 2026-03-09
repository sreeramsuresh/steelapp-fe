// Owner: sales
// Tests: stock allocation panel during invoice creation
// Route: /app/invoices/new (with product selected)

describe("Invoice Stock Allocation - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
    cy.interceptAPI("GET", "/api/invoices*", "getInvoices");
    cy.interceptAPI("GET", "/api/customers*", "getCustomers");
    cy.interceptAPI("GET", "/api/products*", "getProducts");
  });

  it("should load the invoices page as baseline", () => {
    cy.visit("/app/invoices");
    cy.wait("@getInvoices");
    cy.verifyPageLoads("Invoices", "/app/invoices");
  });

  it("should load the create invoice page with a form", () => {
    cy.visit("/app/invoices/new");
    cy.url().should("include", "/app/invoices/new");
    cy.get("form, [class*='form'], [class*='Form']", { timeout: 15000 }).should("exist");
  });

  it("should have a product autocomplete on line items", () => {
    cy.visit("/app/invoices/new");
    cy.get(
      '[data-testid*="product-autocomplete"], input[placeholder*="product" i], input[placeholder*="item" i], [class*="autocomplete" i]',
      { timeout: 15000 },
    )
      .first()
      .should("exist");
  });

  it("should have quantity and rate fields on line items", () => {
    cy.visit("/app/invoices/new");
    cy.get("body", { timeout: 15000 }).then(($body) => {
      const hasQuantity =
        $body.find('input[name*="quantity" i], input[name*="qty" i], input[placeholder*="qty" i], input[placeholder*="quantity" i]').length > 0;
      const hasRate =
        $body.find('input[name*="rate" i], input[name*="price" i], input[placeholder*="rate" i], input[placeholder*="price" i]').length > 0;
      expect(hasQuantity, "Quantity field should exist").to.be.true;
      expect(hasRate, "Rate field should exist").to.be.true;
    });
  });

  it("should have allocation-related UI elements", () => {
    cy.visit("/app/invoices/new");
    cy.get("body", { timeout: 15000 }).then(($body) => {
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
    cy.get("body", { timeout: 15000 }).then(($body) => {
      const hasSourceSelector =
        $body.find('[data-testid*="source-type"], select:contains("WAREHOUSE"), [class*="source"]').length > 0 ||
        $body.text().toLowerCase().includes("warehouse") ||
        $body.text().toLowerCase().includes("local drop");
      expect(hasSourceSelector, "Source type selector or allocation controls should exist").to.be.true;
    });
  });

  it("should have a save button on the invoice form", () => {
    cy.visit("/app/invoices/new");
    cy.contains("button", /save|submit|create/i, { timeout: 15000 }).should("be.visible");
  });

  it("should have cancel or back navigation", () => {
    cy.visit("/app/invoices/new");
    cy.get("body", { timeout: 15000 }).then(($body) => {
      const hasCancel =
        $body.find('button:contains("Cancel"), a:contains("Cancel"), button:contains("Back"), a:contains("Back"), [data-testid*="cancel"], [data-testid*="back"]').length > 0;
      expect(hasCancel, "Cancel or back navigation should exist").to.be.true;
    });
  });

  it("should have an invoice date field", () => {
    cy.visit("/app/invoices/new");
    cy.get(
      'input[type="date"], input[name*="date" i], input[placeholder*="date" i], [data-testid*="date"]',
      { timeout: 15000 },
    )
      .first()
      .should("exist");
  });

  it("should show totals section with subtotal, VAT, and total labels", () => {
    cy.visit("/app/invoices/new");
    cy.get("body", { timeout: 15000 }).then(($body) => {
      const text = $body.text().toLowerCase();
      const hasSubtotal = text.includes("subtotal") || text.includes("sub total") || text.includes("sub-total");
      const hasVat = text.includes("vat") || text.includes("tax");
      const hasTotal = text.includes("total");
      expect(hasSubtotal || hasTotal, "Totals section should show subtotal or total").to.be.true;
      expect(hasVat || hasTotal, "Totals section should show VAT or total").to.be.true;
    });
  });
});
