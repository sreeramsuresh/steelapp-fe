/**
 * Export Orders E2E Tests
 *
 * Tests export order workflows:
 * - Create export orders
 * - Shipping documentation
 * - Customs clearance for exports
 * - Zero-rating validation
 * - Shipment tracking
 *
 * Run: npm run test:e2e -- --spec '**/export-orders.cy.js'
 */

describe("Export Orders - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  describe("Create Export Orders", () => {
    it("should create basic export order", () => {
      cy.visit("/export-orders");
      cy.get('button:contains("Create Export Order")').click();

      // Customer details
      cy.get('input[placeholder*="Select customer"]').type("International Customer");
      cy.get('[role="option"]').first().click();

      // Add items
      cy.get('button:contains("Add Item")').click();
      cy.get('input[placeholder*="Product"]').type("SS-304-Coil");
      cy.get('[role="option"]').first().click();
      cy.get('input[placeholder*="Quantity"]').type("500");
      cy.get('input[placeholder*="Unit Price"]').type("60");

      // Export details
      cy.get('input[placeholder*="Destination Country"]').type("Saudi Arabia");
      cy.get('select[name="Incoterms"]').select("FOB");

      cy.get('button:contains("Create Export Order")').click();
      cy.contains("Export order created").should("be.visible");
    });

    it("should create export order with multiple items", () => {
      cy.visit("/export-orders");
      cy.get('button:contains("Create Export Order")').click();

      cy.get('input[placeholder*="Select customer"]').type("International Customer");
      cy.get('[role="option"]').first().click();

      // Item 1
      cy.get('button:contains("Add Item")').click();
      cy.get('input[placeholder*="Product"]').first().type("SS-304");
      cy.get('[role="option"]').first().click();
      cy.get('input[placeholder*="Quantity"]').first().type("300");
      cy.get('input[placeholder*="Unit Price"]').first().type("60");

      // Item 2
      cy.get('button:contains("Add Item")').click();
      cy.get('input[placeholder*="Product"]').eq(1).type("SS-316L");
      cy.get('[role="option"]').first().click();
      cy.get('input[placeholder*="Quantity"]').eq(1).type("200");
      cy.get('input[placeholder*="Unit Price"]').eq(1).type("85");

      cy.get('input[placeholder*="Destination Country"]').type("Saudi Arabia");

      cy.get('button:contains("Create Export Order")').click();
      cy.contains("Export order created").should("be.visible");
    });

    it("should create export order with zero-rating", () => {
      cy.visit("/export-orders");
      cy.get('button:contains("Create Export Order")').click();

      cy.get('input[placeholder*="Select customer"]').type("International Customer");
      cy.get('[role="option"]').first().click();

      cy.get('button:contains("Add Item")').click();
      cy.get('input[placeholder*="Product"]').type("SS-304");
      cy.get('[role="option"]').first().click();
      cy.get('input[placeholder*="Quantity"]').type("500");
      cy.get('input[placeholder*="Unit Price"]').type("60");

      // Mark as zero-rated
      cy.get('checkbox[name="zero-rated-supply"]').check();

      cy.get('button:contains("Create Export Order")').click();
      cy.contains("Export order created with zero rating").should("be.visible");
    });
  });

  describe("Shipping Documentation", () => {
    it("should generate shipping instructions", () => {
      cy.visit("/export-orders");
      cy.get('[data-testid="export-order-row"]').first().click();

      cy.get('button:contains("Shipping Instructions")').click();

      cy.contains("Shipping Instruction Generated").should("be.visible");
      cy.get('button:contains("Print")').should("be.visible");
    });

    it("should generate Bill of Lading", () => {
      cy.visit("/export-orders");
      cy.get('[data-testid="export-order-row"][data-status="READY_TO_SHIP"]')
        .first()
        .click();

      cy.get('button:contains("Generate BL")').click();

      cy.get('input[placeholder*="Vessel Name"]').type("MV Express");
      cy.get('input[placeholder*="Port of Loading"]').type("Jebel Ali");
      cy.get('input[placeholder*="Port of Discharge"]').type("Jeddah");

      cy.get('button:contains("Generate")').click();
      cy.contains("Bill of Lading generated").should("be.visible");
    });

    it("should generate packing list", () => {
      cy.visit("/export-orders");
      cy.get('[data-testid="export-order-row"]').first().click();

      cy.get('button:contains("Packing List")').click();

      cy.get('button:contains("Generate")').click();

      cy.contains("Packing List Generated").should("be.visible");
    });

    it("should generate Certificate of Origin", () => {
      cy.visit("/export-orders");
      cy.get('[data-testid="export-order-row"]').first().click();

      cy.get('button:contains("Certificate of Origin")').click();

      cy.get('button:contains("Generate")').click();

      cy.contains("Certificate Generated").should("be.visible");
    });
  });

  describe("Customs Clearance for Exports", () => {
    it("should submit export declaration", () => {
      cy.visit("/export-orders");
      cy.get('[data-testid="export-order-row"]').first().click();

      cy.get('button:contains("Export Declaration")').click();

      cy.get('button:contains("Submit")').click();

      cy.contains("Declaration submitted").should("be.visible");
    });

    it("should track customs clearance status", () => {
      cy.visit("/export-orders");
      cy.get('[data-testid="export-order-row"]').first().click();

      cy.get('button:contains("Clearance Status")').click();

      cy.contains("Status:").should("be.visible");
      cy.contains("Submitted:").should("be.visible");
    });

    it("should verify zero-rating for export", () => {
      cy.visit("/export-orders");
      cy.get('[data-testid="export-order-row"][data-zero-rated="true"]')
        .first()
        .click();

      cy.get('button:contains("VAT Status")').click();

      cy.contains("Zero-Rated Supply").should("be.visible");
      cy.contains("0% VAT").should("be.visible");
    });
  });

  describe("Shipment Tracking", () => {
    it("should track shipment status", () => {
      cy.visit("/export-orders");
      cy.get('[data-testid="export-order-row"]').first().click();

      cy.get('button:contains("Track Shipment")').click();

      cy.contains("Shipment Status:").should("be.visible");
      cy.contains("Current Location:").should("be.visible");
      cy.contains("ETA:").should("be.visible");
    });

    it("should record shipment milestones", () => {
      cy.visit("/export-orders");
      cy.get('[data-testid="export-order-row"]').first().click();

      cy.get('button:contains("Track Shipment")').click();

      cy.get('button:contains("Add Milestone")').click();

      cy.get('select[name="Milestone"]').select("SHIPPED");
      cy.get('input[placeholder*="Milestone Date"]').type("2024-01-15");

      cy.get('button:contains("Record")').click();
      cy.contains("Milestone recorded").should("be.visible");
    });

    it("should update customer on shipment", () => {
      cy.visit("/export-orders");
      cy.get('[data-testid="export-order-row"]').first().click();

      cy.get('button:contains("Track Shipment")').click();

      cy.get('button:contains("Notify Customer")').click();

      cy.get('button:contains("Send Notification")').click();
      cy.contains("Notification sent").should("be.visible");
    });
  });

  describe("Delivery & Invoice", () => {
    it("should create delivery note from export order", () => {
      cy.visit("/export-orders");
      cy.get('[data-testid="export-order-row"]').first().click();

      cy.get('button:contains("Create Delivery Note")').click();

      cy.get('button:contains("Create DN")').click();
      cy.contains("Delivery note created").should("be.visible");
    });

    it("should create invoice from export order", () => {
      cy.visit("/export-orders");
      cy.get('[data-testid="export-order-row"]').first().click();

      cy.get('button:contains("Create Invoice")').click();

      // Verify zero-rating is applied
      cy.contains("0% VAT").should("be.visible");

      cy.get('button:contains("Create Invoice")').click();
      cy.contains("Invoice created").should("be.visible");
    });

    it("should mark export order as complete", () => {
      cy.visit("/export-orders");
      cy.get('[data-testid="export-order-row"][data-status="INVOICED"]')
        .first()
        .click();

      cy.get('button:contains("Mark Complete")').click();

      cy.get('button:contains("Confirm")').click();
      cy.contains("Export order completed").should("be.visible");
    });
  });

  describe("Export Order Analytics", () => {
    it("should view export orders metrics", () => {
      cy.visit("/export-orders");

      cy.get('button:contains("Analytics")').click();

      cy.contains("Total Export Orders").should("be.visible");
      cy.contains("Export Value").should("be.visible");
      cy.contains("Average Lead Time").should("be.visible");
    });

    it("should analyze exports by destination", () => {
      cy.visit("/export-orders");

      cy.get('button:contains("By Destination")').click();

      cy.get('[data-testid="country-row"]').should("have.length.greaterThan", 0);
    });

    it("should track zero-rated export supplies", () => {
      cy.visit("/export-orders");

      cy.get('button:contains("Zero-Rated Analysis")').click();

      cy.contains("Total Zero-Rated").should("be.visible");
      cy.contains("Value of Exports").should("be.visible");
    });

    it("should export orders report", () => {
      cy.visit("/export-orders");

      cy.get('button:contains("Export")').click();
      cy.get('select[name="Format"]').select("CSV");

      cy.get('button:contains("Export")').click();
      cy.readFile("cypress/downloads/export-orders-*.csv").should("exist");
    });
  });

  describe("Export Compliance", () => {
    it("should verify export documentation completeness", () => {
      cy.visit("/export-orders");
      cy.get('[data-testid="export-order-row"]').first().click();

      cy.get('button:contains("Documentation Check")').click();

      cy.contains("Packing List").should("be.visible");
      cy.contains("Bill of Lading").should("be.visible");
      cy.contains("Certificate of Origin").should("be.visible");
    });

    it("should validate export eligibility", () => {
      cy.visit("/export-orders");

      cy.get('button:contains("Compliance")').click();

      cy.get('button:contains("Validate Exports")').click();

      cy.contains("Validation Results").should("be.visible");
    });
  });
});
