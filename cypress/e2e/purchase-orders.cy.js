/**
 * Purchase Orders E2E Tests
 *
 * Tests complete purchase order lifecycle:
 * - Create purchase orders
 * - PO approval/rejection
 * - PO amendments
 * - Partial receipts via GRN
 * - Supplier quotes to PO conversion
 *
 * Run: npm run test:e2e -- --spec '**/purchase-orders.cy.js'
 */

describe("Purchase Orders - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  describe("Create Purchase Orders", () => {
    it("should create new purchase order", () => {
      cy.visit("/purchase-orders");
      cy.get('button:contains("Create Purchase Order")').click();

      // Select supplier
      cy.get('input[placeholder*="Select supplier"]').type("Test Supplier");
      cy.get('[role="option"]').first().click();

      // Add line item
      cy.get('button:contains("Add Line Item")').click();
      cy.get('input[placeholder*="Product"]').type("SS-304-Sheet");
      cy.get('[role="option"]').first().click();
      cy.get('input[placeholder*="Quantity"]').type("100");
      cy.get('input[placeholder*="Unit Price"]').type("50");

      // Set delivery date
      cy.get('input[placeholder*="Delivery Date"]').type("2024-12-31");

      // Submit
      cy.get('button:contains("Create PO")').click();
      cy.contains("Purchase order created").should("be.visible");

      // Verify PO number
      cy.contains(/PO-\d{6}/);
    });

    it("should create PO with multiple line items", () => {
      cy.visit("/purchase-orders");
      cy.get('button:contains("Create Purchase Order")').click();

      cy.get('input[placeholder*="Select supplier"]').type("Test Supplier");
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

      cy.get('input[placeholder*="Delivery Date"]').type("2024-12-31");

      cy.get('button:contains("Create PO")').click();
      cy.contains("Purchase order created").should("be.visible");
    });

    it("should create PO with delivery terms", () => {
      cy.visit("/purchase-orders");
      cy.get('button:contains("Create Purchase Order")').click();

      cy.get('input[placeholder*="Select supplier"]').type("Test Supplier");
      cy.get('[role="option"]').first().click();

      cy.get('button:contains("Add Line Item")').click();
      cy.get('input[placeholder*="Product"]').type("SS-304-Sheet");
      cy.get('[role="option"]').first().click();
      cy.get('input[placeholder*="Quantity"]').type("100");
      cy.get('input[placeholder*="Unit Price"]').type("50");

      // Set Incoterms
      cy.get('select[name="Incoterms"]').select("CIF");
      cy.get('input[placeholder*="Port of Delivery"]').type("Jebel Ali");

      cy.get('button:contains("Create PO")').click();
      cy.contains("Purchase order created").should("be.visible");
    });
  });

  describe("PO Approval Workflow", () => {
    it("should submit PO for approval", () => {
      cy.visit("/purchase-orders");
      cy.get('[data-testid="po-row"][data-status="DRAFT"]').first().click();

      cy.get('button:contains("Submit for Approval")').click();
      cy.contains("PO submitted").should("be.visible");
    });

    it("should approve purchase order", () => {
      cy.visit("/purchase-orders");
      cy.get('[data-testid="po-row"][data-status="PENDING_APPROVAL"]')
        .first()
        .click();

      cy.get('button:contains("Approve")').click();
      cy.get('textarea[placeholder*="Comments"]').type("Approved");
      cy.get('button:contains("Confirm Approval")').click();

      cy.contains("Purchase order approved").should("be.visible");
    });

    it("should reject purchase order with reason", () => {
      cy.visit("/purchase-orders");
      cy.get('[data-testid="po-row"][data-status="PENDING_APPROVAL"]')
        .first()
        .click();

      cy.get('button[aria-label="More"]').click();
      cy.get('button:contains("Reject")').click();

      cy.get('textarea[placeholder*="Rejection Reason"]').type(
        "Price exceeds budget",
      );
      cy.get('button:contains("Reject PO")').click();

      cy.contains("Purchase order rejected").should("be.visible");
    });

    it("should amend rejected purchase order", () => {
      cy.visit("/purchase-orders");
      cy.get('[data-testid="po-row"][data-status="REJECTED"]')
        .first()
        .click();

      cy.get('button:contains("Create Amendment")').click();

      // Modify pricing
      cy.get('input[placeholder*="Unit Price"]').first().clear().type("45");

      cy.get('button:contains("Create PO")').click();
      cy.contains("PO amendment created").should("be.visible");
    });
  });

  describe("PO Amendments", () => {
    it("should add line item to approved PO", () => {
      cy.visit("/purchase-orders");
      cy.get('[data-testid="po-row"][data-status="APPROVED"]')
        .first()
        .click();

      cy.get('button:contains("Amend")').click();
      cy.get('button:contains("Add Line Item")').click();

      cy.get('input[placeholder*="Product"]').type("SS-316-Tube");
      cy.get('[role="option"]').first().click();
      cy.get('input[placeholder*="Quantity"]').type("25");
      cy.get('input[placeholder*="Unit Price"]').type("100");

      cy.get('button:contains("Save Amendment")').click();
      cy.contains("Item added to PO").should("be.visible");
    });

    it("should remove line item from PO", () => {
      cy.visit("/purchase-orders");
      cy.get('[data-testid="po-row"][data-status="APPROVED"]')
        .first()
        .click();

      cy.get('button:contains("Amend")').click();

      // Remove first line item
      cy.get('button[aria-label="Remove"]').first().click();
      cy.get('button:contains("Confirm")').click();

      cy.get('button:contains("Save Amendment")').click();
      cy.contains("Item removed from PO").should("be.visible");
    });

    it("should update quantity in PO", () => {
      cy.visit("/purchase-orders");
      cy.get('[data-testid="po-row"][data-status="APPROVED"]')
        .first()
        .click();

      cy.get('button:contains("Amend")').click();

      cy.get('input[placeholder*="Quantity"]').first().clear().type("150");

      cy.get('button:contains("Save Amendment")').click();
      cy.contains("PO updated").should("be.visible");
    });
  });

  describe("PO to GRN Workflow", () => {
    it("should create GRN from approved PO", () => {
      cy.visit("/purchase-orders");
      cy.get('[data-testid="po-row"][data-status="APPROVED"]')
        .first()
        .click();

      cy.get('button:contains("Create GRN")').click();

      // Verify prefilled data
      cy.contains(/GRN-\d{6}/);
      cy.get('[data-testid="grn-line-item"]').should("have.length.greaterThan", 0);

      cy.get('button:contains("Create GRN")').click();
      cy.contains("GRN created").should("be.visible");
    });

    it("should record partial receipt", () => {
      cy.visit("/purchase-orders");
      cy.get('[data-testid="po-row"][data-status="APPROVED"]')
        .first()
        .click();

      cy.get('button:contains("Create GRN")').click();

      // Adjust received quantities
      cy.get('input[placeholder*="Received Qty"]').first().clear().type("80");

      cy.get('button:contains("Create GRN")').click();
      cy.contains("Partial GRN created").should("be.visible");
    });
  });

  describe("PO Analytics & Tracking", () => {
    it("should view PO performance metrics", () => {
      cy.visit("/purchase-orders");

      cy.get('button:contains("Analytics")').click();

      cy.contains("Total POs").should("be.visible");
      cy.contains("Approved Rate").should("be.visible");
      cy.contains("On-Time Delivery").should("be.visible");
    });

    it("should filter POs by status", () => {
      cy.visit("/purchase-orders");

      cy.get('select[name="Status"]').select("APPROVED");
      cy.get('button:contains("Filter")').click();

      cy.get('[data-testid="po-row"]').each(($row) => {
        cy.wrap($row).should("have.attr", "data-status", "APPROVED");
      });
    });

    it("should filter POs by supplier", () => {
      cy.visit("/purchase-orders");

      cy.get('input[placeholder*="Supplier"]').type("Test Supplier");
      cy.get('button:contains("Filter")').click();

      cy.get('[data-testid="po-row"]').each(($row) => {
        cy.wrap($row).contains("Test Supplier");
      });
    });
  });

  describe("PO Printing & Export", () => {
    it("should download PO as PDF", () => {
      cy.visit("/purchase-orders");
      cy.get('[data-testid="po-row"]').first().click();

      cy.get('button:contains("Download PDF")').click();

      cy.readFile("cypress/downloads/po-*.pdf").should("exist");
    });

    it("should email PO to supplier", () => {
      cy.visit("/purchase-orders");
      cy.get('[data-testid="po-row"]').first().click();

      cy.get('button[aria-label="Email"]').click();
      cy.get('input[placeholder*="Email To"]').should("have.value");

      cy.get('button:contains("Send")').click();
      cy.contains("PO sent via email").should("be.visible");
    });
  });
});
