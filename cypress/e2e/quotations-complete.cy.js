/**
 * Quotations E2E Tests - Complete Workflow
 *
 * Tests complete quotation lifecycle:
 * - Create quotations
 * - Quote approval/rejection
 * - Convert quote to invoice
 * - Quote expiration
 * - Quote versioning
 *
 */

describe("Quotations - Complete E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  describe("Create Quotations", () => {
    it("should create new quotation", () => {
      cy.visit("/app/quotations");
      cy.get('button:contains("Create Quotation")').click();

      // Fill customer
      cy.get('input[placeholder*="Select customer"]').type("Test Customer");
      cy.get('[role="option"]').first().click();

      // Add line items
      cy.get('button:contains("Add Line Item")').click();
      cy.get('input[placeholder*="Product"]').type("SS-304-Sheet");
      cy.get('[role="option"]').first().click();
      cy.get('input[placeholder*="Quantity"]').type("100");
      cy.get('input[placeholder*="Unit Price"]').type("50");

      // Set validity period
      cy.get('input[placeholder*="Valid Until"]').type("2024-12-31");

      // Set terms
      cy.get('textarea[placeholder*="Notes"]').type("Terms and conditions apply");

      // Submit
      cy.get('button:contains("Create Quotation")').click();
      cy.contains("Quotation created successfully").should("be.visible");

      // Verify quotation number
      cy.contains(/QT-\d{6}/);
    });

    it("should create quotation with multiple line items", () => {
      cy.visit("/app/quotations");
      cy.get('button:contains("Create Quotation")').click();

      cy.get('input[placeholder*="Select customer"]').type("Test Customer");
      cy.get('[role="option"]').first().click();

      // Add first item
      cy.get('button:contains("Add Line Item")').click();
      cy.get('input[placeholder*="Product"]').first().type("SS-304-Sheet");
      cy.get('[role="option"]').first().click();
      cy.get('input[placeholder*="Quantity"]').first().type("100");
      cy.get('input[placeholder*="Unit Price"]').first().type("50");

      // Add second item
      cy.get('button:contains("Add Line Item")').click();
      cy.get('input[placeholder*="Product"]').eq(1).type("SS-316L-Coil");
      cy.get('[role="option"]').first().click();
      cy.get('input[placeholder*="Quantity"]').eq(1).type("50");
      cy.get('input[placeholder*="Unit Price"]').eq(1).type("75");

      // Add third item
      cy.get('button:contains("Add Line Item")').click();
      cy.get('input[placeholder*="Product"]').eq(2).type("SS-316-Tube");
      cy.get('[role="option"]').first().click();
      cy.get('input[placeholder*="Quantity"]').eq(2).type("25");
      cy.get('input[placeholder*="Unit Price"]').eq(2).type("100");

      cy.get('button:contains("Create Quotation")').click();
      cy.contains("Quotation created successfully").should("be.visible");
    });

    it("should create quotation with discount", () => {
      cy.visit("/app/quotations");
      cy.get('button:contains("Create Quotation")').click();

      cy.get('input[placeholder*="Select customer"]').type("Test Customer");
      cy.get('[role="option"]').first().click();

      cy.get('button:contains("Add Line Item")').click();
      cy.get('input[placeholder*="Product"]').type("SS-304-Sheet");
      cy.get('[role="option"]').first().click();
      cy.get('input[placeholder*="Quantity"]').type("100");
      cy.get('input[placeholder*="Unit Price"]').type("50");

      // Apply discount
      cy.get('button[aria-label*="Discount"]').click();
      cy.get('input[placeholder*="Discount %"]').type("10");
      cy.get('button:contains("Apply")').click();

      cy.contains("Discount: -500");

      cy.get('button:contains("Create Quotation")').click();
      cy.contains("Quotation created successfully").should("be.visible");
    });
  });

  describe("Quotation Approval Workflow", () => {
    it("should approve quotation", () => {
      cy.visit("/app/quotations");
      cy.get('[data-testid="quotation-row"][data-status="DRAFT"]')
        .first()
        .click();

      cy.get('button:contains("Submit for Approval")').click();
      cy.contains("Quotation submitted").should("be.visible");

      // In new window, approve as manager
      cy.visit("/app/finance");
      cy.get('[data-testid="approval-item"]').first().click();

      cy.get('button:contains("Approve")').click();
      cy.get('textarea[placeholder*="Comments"]').type("Looks good");
      cy.get('button:contains("Confirm Approval")').click();

      cy.contains("Quotation approved").should("be.visible");
    });

    it("should reject quotation with reason", () => {
      cy.visit("/app/quotations");
      cy.get('[data-testid="quotation-row"][data-status="PENDING_APPROVAL"]')
        .first()
        .click();

      cy.get('button[aria-label="More"]').click();
      cy.get('button:contains("Reject")').click();

      cy.get('textarea[placeholder*="Rejection Reason"]').type(
        "Price too high",
      );
      cy.get('button:contains("Reject Quotation")').click();

      cy.contains("Quotation rejected").should("be.visible");
    });

    it("should amend rejected quotation", () => {
      cy.visit("/app/quotations");
      cy.get('[data-testid="quotation-row"][data-status="REJECTED"]')
        .first()
        .click();

      cy.get('button:contains("Create New Version")').click();

      // Modify pricing
      cy.get('input[placeholder*="Unit Price"]').first().clear().type("45");

      cy.get('button:contains("Create Quotation")').click();
      cy.contains("Quotation created").should("be.visible");
      cy.contains("Version 2");
    });
  });

  describe("Quotation to Invoice Conversion", () => {
    it("should convert approved quotation to invoice", () => {
      cy.visit("/app/quotations");
      cy.get('[data-testid="quotation-row"][data-status="APPROVED"]')
        .first()
        .click();

      cy.get('button:contains("Convert to Invoice")').click();

      // Verify form prefilled
      cy.get('input[placeholder*="Customer"]').should(
        "have.value",
        "Test Customer",
      );

      // Verify line items
      cy.get('[data-testid="invoice-line-item"]').should(
        "have.length.greaterThan",
        0,
      );

      cy.get('button:contains("Create Invoice")').click();
      cy.contains("Invoice created from quotation").should("be.visible");
    });

    it("should allow quantity adjustment during conversion", () => {
      cy.visit("/app/quotations");
      cy.get('[data-testid="quotation-row"][data-status="APPROVED"]')
        .first()
        .click();

      cy.get('button:contains("Convert to Invoice")').click();

      // Adjust quantities
      cy.get('input[placeholder*="Quantity"]').first().clear().type("80");

      cy.get('button:contains("Create Invoice")').click();
      cy.contains("Invoice created from quotation").should("be.visible");
    });

    it("should partial convert quotation", () => {
      cy.visit("/app/quotations");
      cy.get('[data-testid="quotation-row"][data-status="APPROVED"]')
        .first()
        .click();

      cy.get('button:contains("Partial Convert")').click();

      // Uncheck second line item
      cy.get('input[aria-label="Line Item 2"]').click();

      cy.get('button:contains("Convert Selected")').click();

      cy.contains("Invoice created from partial quotation").should("be.visible");
    });
  });

  describe("Quotation Expiration", () => {
    it("should mark expired quotation", () => {
      cy.visit("/app/quotations");

      // Find quotation with past validity date
      cy.get('[data-testid="quotation-row"]').each(($row) => {
        cy.wrap($row).then(($el) => {
          if ($el.attr("data-valid-until") < new Date().toISOString()) {
            cy.wrap($el).click();

            cy.contains("This quotation has expired").should("be.visible");
            cy.get('button:contains("Convert to Invoice")').should("be.disabled");
          }
        });
      });
    });

    it("should renew expired quotation", () => {
      cy.visit("/app/quotations");
      cy.get('[data-testid="quotation-row"][data-status="EXPIRED"]')
        .first()
        .click();

      cy.get('button:contains("Renew Quotation")').click();
      cy.get('input[placeholder*="Valid Until"]').clear().type("2025-12-31");

      cy.get('button:contains("Update")').click();
      cy.contains("Quotation renewed").should("be.visible");
    });
  });

  describe("Quotation Tracking & Analytics", () => {
    it("should track quotation hit rate", () => {
      cy.visit("/app/quotations");

      cy.get('button:contains("Analytics")').click();

      cy.contains("Total Quotations").should("be.visible");
      cy.contains("Hit Rate").should("be.visible");
      cy.contains("Average Value").should("be.visible");

      // Verify numbers
      cy.get('[data-testid="hit-rate-stat"]').should(
        "contain",
        /\d+\.\d+%/,
      );
    });

    it("should filter quotations by customer", () => {
      cy.visit("/app/quotations");

      cy.get('input[placeholder*="Customer"]').type("Test Customer");
      cy.get('button:contains("Filter")').click();

      cy.get('[data-testid="quotation-row"]').each(($row) => {
        cy.wrap($row).contains("Test Customer");
      });
    });

    it("should export quotations", () => {
      cy.visit("/app/quotations");

      cy.get('button:contains("Export")').click();
      cy.get('select[name="Format"]').select("CSV");

      cy.get('button:contains("Export")').click();
      cy.readFile("cypress/downloads/quotations-*.csv").should("exist");
    });
  });
});
