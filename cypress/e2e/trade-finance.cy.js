/**
 * Trade Finance E2E Tests
 *
 * Tests trade finance workflows:
 * - Letter of Credit (LC) management
 * - Trade financing options
 * - Invoice discounting
 * - Financing document tracking
 * - LC amendment and extension
 *
 */

describe("Trade Finance - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  describe("Letter of Credit", () => {
    it("should create Letter of Credit", () => {
      cy.visit("/app/finance");
      cy.get('button:contains("New LC")').click();

      cy.get('input[placeholder*="Supplier"]').type("Supplier");
      cy.get('[role="option"]').first().click();

      cy.get('input[placeholder*="LC Amount"]').type("50000");
      cy.get('select[name="Currency"]').select("USD");
      cy.get('input[placeholder*="Expiry Date"]').type("2024-12-31");

      cy.get('button:contains("Create")').click();
      cy.contains("LC created").should("be.visible");
    });

    it("should track LC status", () => {
      cy.visit("/app/finance");
      cy.get('[data-testid="lc-row"]').first().click();

      cy.contains("Status").should("be.visible");
      cy.contains("Amount Utilized").should("be.visible");
      cy.contains("Available Balance").should("be.visible");
    });

    it("should utilization shipments against LC", () => {
      cy.visit("/app/finance");
      cy.get('[data-testid="lc-row"]').first().click();

      cy.get('button:contains("Utilize")').click();

      cy.get('input[placeholder*="Amount"]').type("10000");
      cy.get('input[placeholder*="Reference"]').type("INV-001");

      cy.get('button:contains("Utilize")').click();
      cy.contains("Amount utilized").should("be.visible");
    });

    it("should amend LC terms", () => {
      cy.visit("/app/finance");
      cy.get('[data-testid="lc-row"]').first().click();

      cy.get('button:contains("Amend")').click();

      cy.get('input[placeholder*="New Amount"]').type("60000");

      cy.get('button:contains("Submit Amendment")').click();
      cy.contains("Amendment submitted").should("be.visible");
    });

    it("should extend LC expiry", () => {
      cy.visit("/app/finance");
      cy.get('[data-testid="lc-row"]').first().click();

      cy.get('button:contains("Extend")').click();

      cy.get('input[placeholder*="New Expiry"]').type("2025-01-31");

      cy.get('button:contains("Extend")').click();
      cy.contains("LC extended").should("be.visible");
    });
  });

  describe("Invoice Discounting", () => {
    it("should discount invoice", () => {
      cy.visit("/app/finance");
      cy.get('button:contains("Invoice Discounting")').click();

      cy.get('input[placeholder*="Invoice"]').type("INV-");
      cy.get('[role="option"]').first().click();

      cy.get('input[placeholder*="Discount Rate %"]').type("2.5");

      cy.get('button:contains("Discount")').click();
      cy.contains("Invoice discounted").should("be.visible");
    });

    it("should track discount proceeds", () => {
      cy.visit("/app/finance");
      cy.get('[data-testid="discount-row"]').first().click();

      cy.contains("Original Amount").should("be.visible");
      cy.contains("Discount Amount").should("be.visible");
      cy.contains("Proceeds").should("be.visible");
    });

    it("should handle maturity of discounted invoice", () => {
      cy.visit("/app/finance");
      cy.get('[data-testid="discount-row"]').first().click();

      cy.get('button:contains("Record Maturity")').click();

      cy.get('button:contains("Confirm")').click();
      cy.contains("Maturity recorded").should("be.visible");
    });
  });

  describe("Financing Documentation", () => {
    it("should upload LC document", () => {
      cy.visit("/app/finance");
      cy.get('[data-testid="lc-row"]').first().click();

      cy.get('button:contains("Upload LC")').click();

      cy.get('input[type="file"]').selectFile("cypress/fixtures/lc-document.pdf");

      cy.get('button:contains("Upload")').click();
      cy.contains("Document uploaded").should("be.visible");
    });

    it("should track financing documents", () => {
      cy.visit("/app/finance");
      cy.get('[data-testid="lc-row"]').first().click();

      cy.get('button:contains("Documents")').click();

      cy.get('[data-testid="document-row"]').should("have.length.greaterThan", 0);
    });

    it("should download financing document", () => {
      cy.visit("/app/finance");
      cy.get('[data-testid="lc-row"]').first().click();

      cy.get('button:contains("Documents")').click();
      cy.get('[data-testid="document-row"]').first().click();

      cy.get('button:contains("Download")').click();

      cy.readFile("cypress/downloads/lc-*.pdf").should("exist");
    });
  });

  describe("Financing Costs & Fees", () => {
    it("should calculate LC fees", () => {
      cy.visit("/app/finance");
      cy.get('[data-testid="lc-row"]').first().click();

      cy.contains("Commission").should("be.visible");
      cy.contains("Handling Charges").should("be.visible");
      cy.contains("Total Fees").should("be.visible");
    });

    it("should record financing charges", () => {
      cy.visit("/app/finance");
      cy.get('[data-testid="lc-row"]').first().click();

      cy.get('button:contains("Record Charges")').click();

      cy.get('input[placeholder*="Amount"]').type("500");
      cy.get('select[name="Charge Type"]').select("COMMISSION");

      cy.get('button:contains("Record")').click();
      cy.contains("Charge recorded").should("be.visible");
    });
  });

  describe("Financing Reports", () => {
    it("should view financing summary", () => {
      cy.visit("/analytics/reports/trade-finance");

      cy.contains("Trade Finance Summary").should("be.visible");
      cy.contains("Active LCs").should("be.visible");
      cy.contains("Total LC Value").should("be.visible");
      cy.contains("Utilized Amount").should("be.visible");
    });

    it("should export financing data", () => {
      cy.visit("/app/finance");

      cy.get('button:contains("Export")').click();
      cy.get('select[name="Format"]').select("EXCEL");

      cy.get('button:contains("Export")').click();
      cy.readFile("cypress/downloads/trade-finance-*.xlsx").should("exist");
    });
  });
});
