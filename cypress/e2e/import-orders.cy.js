/**
 * Import Orders E2E Tests
 *
 * Tests import order lifecycle:
 * - Create import orders
 * - Container tracking
 * - Landed cost allocation
 * - Customs documentation
 * - GRN receipt
 *
 * Run: npm run test:e2e -- --spec "**/import-orders.cy.js"
 */

describe("Import Orders - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  describe("Create Import Orders", () => {
    it("should create basic import order", () => {
      cy.visit("/import-orders");
      cy.get('button:contains("Create Import Order")').click();

      // Supplier details
      cy.get('input[placeholder*="Select supplier"]').type("International Supplier");
      cy.get('[role="option"]').first().click();

      // Add line items
      cy.get('button:contains("Add Item")').click();
      cy.get('input[placeholder*="Product"]').type("SS-304-Coil");
      cy.get('[role="option"]').first().click();
      cy.get('input[placeholder*="Quantity"]').type("1000");
      cy.get('input[placeholder*="Unit Price"]').type("50");

      // Set Incoterms
      cy.get('select[name="Incoterms"]').select("CIF");
      cy.get('input[placeholder*="Port of Destination"]').type("Jebel Ali");

      cy.get('button:contains("Create Import Order")').click();
      cy.contains("Import order created").should("be.visible");
    });

    it("should create import order with multiple items", () => {
      cy.visit("/import-orders");
      cy.get('button:contains("Create Import Order")').click();

      cy.get('input[placeholder*="Select supplier"]').type("International Supplier");
      cy.get('[role="option"]').first().click();

      // Item 1
      cy.get('button:contains("Add Item")').click();
      cy.get('input[placeholder*="Product"]').first().type("SS-304");
      cy.get('[role="option"]').first().click();
      cy.get('input[placeholder*="Quantity"]').first().type("500");
      cy.get('input[placeholder*="Unit Price"]').first().type("50");

      // Item 2
      cy.get('button:contains("Add Item")').click();
      cy.get('input[placeholder*="Product"]').eq(1).type("SS-316L");
      cy.get('[role="option"]').first().click();
      cy.get('input[placeholder*="Quantity"]').eq(1).type("500");
      cy.get('input[placeholder*="Unit Price"]').eq(1).type("75");

      cy.get('select[name="Incoterms"]').select("FOB");

      cy.get('button:contains("Create Import Order")').click();
      cy.contains("Import order created").should("be.visible");
    });

    it("should create import order with landed costs", () => {
      cy.visit("/import-orders");
      cy.get('button:contains("Create Import Order")').click();

      cy.get('input[placeholder*="Select supplier"]').type("International Supplier");
      cy.get('[role="option"]').first().click();

      cy.get('button:contains("Add Item")').click();
      cy.get('input[placeholder*="Product"]').type("SS-304");
      cy.get('[role="option"]').first().click();
      cy.get('input[placeholder*="Quantity"]').type("1000");
      cy.get('input[placeholder*="Unit Price"]').type("50");

      // Add landed costs
      cy.get('button:contains("Add Landed Costs")').click();
      cy.get('input[placeholder*="Freight"]').type("5000");
      cy.get('input[placeholder*="Insurance"]').type("2000");

      cy.get('button:contains("Create Import Order")').click();
      cy.contains("Import order created").should("be.visible");
    });
  });

  describe("Container Tracking", () => {
    it("should link import order to container", () => {
      cy.visit("/import-orders");
      cy.get('[data-testid="import-order-row"]').first().click();

      cy.get('button:contains("Link Container")').click();

      cy.get('input[placeholder*="Container Number"]').type("CONT-12345");
      cy.get('input[placeholder*="Bill of Lading"]').type("BL-98765");
      cy.get('input[placeholder*="Vessel Name"]').type("MV Ocean");

      cy.get('button:contains("Link Container")').click();
      cy.contains("Container linked").should("be.visible");
    });

    it("should track container status", () => {
      cy.visit("/import-orders");
      cy.get('[data-testid="import-order-row"]').first().click();

      cy.get('button:contains("Container Tracking")').click();

      cy.contains("Container Status:").should("be.visible");
      cy.contains("ETA:").should("be.visible");
      cy.contains("Location:").should("be.visible");
    });

    it("should record port activities", () => {
      cy.visit("/import-orders");
      cy.get('[data-testid="import-order-row"]').first().click();

      cy.get('button:contains("Port Activities")').click();

      cy.get('button:contains("Add Activity")').click();

      cy.get('select[name="Activity"]').select("ARRIVED_PORT");
      cy.get('input[placeholder*="Activity Date"]').type("2024-01-15");

      cy.get('button:contains("Record Activity")').click();
      cy.contains("Activity recorded").should("be.visible");
    });
  });

  describe("Customs & Documentation", () => {
    it("should upload customs documents", () => {
      cy.visit("/import-orders");
      cy.get('[data-testid="import-order-row"]').first().click();

      cy.get('button:contains("Customs Documents")').click();

      // Upload Bill of Entry
      cy.get('input[placeholder*="Bill of Entry"]').selectFile(
        "cypress/fixtures/boe.pdf",
      );

      // Upload COO
      cy.get('input[placeholder*="Certificate of Origin"]').selectFile(
        "cypress/fixtures/coo.pdf",
      );

      cy.get('button:contains("Upload")').click();
      cy.contains("Documents uploaded").should("be.visible");
    });

    it("should track customs clearance status", () => {
      cy.visit("/import-orders");
      cy.get('[data-testid="import-order-row"]').first().click();

      cy.get('button:contains("Customs Status")').click();

      cy.contains("Clearance Status:").should("be.visible");
      cy.contains("Duty Assessment:").should("be.visible");
      cy.contains("VAT Payable:").should("be.visible");
    });

    it("should record customs payment", () => {
      cy.visit("/import-orders");
      cy.get('[data-testid="import-order-row"]').first().click();

      cy.get('button:contains("Customs Payment")').click();

      cy.get('input[placeholder*="Duty Amount"]').type("2500");
      cy.get('input[placeholder*="VAT Amount"]').type("1250");
      cy.get('input[placeholder*="Payment Reference"]').type("CUSTOMS-001");

      cy.get('button:contains("Record Payment")').click();
      cy.contains("Customs payment recorded").should("be.visible");
    });
  });

  describe("Landed Cost Allocation", () => {
    it("should allocate landed costs to items", () => {
      cy.visit("/import-orders");
      cy.get('[data-testid="import-order-row"]').first().click();

      cy.get('button:contains("Allocate Costs")').click();

      // Verify cost breakdown
      cy.contains("Base Cost").should("be.visible");
      cy.contains("Freight").should("be.visible");
      cy.contains("Customs Duty").should("be.visible");
      cy.contains("Insurance").should("be.visible");

      cy.get('button:contains("Allocate")').click();
      cy.contains("Landed costs allocated").should("be.visible");
    });

    it("should calculate cost per unit with landed costs", () => {
      cy.visit("/import-orders");
      cy.get('[data-testid="import-order-row"]').first().click();

      cy.get('button:contains("Cost Breakdown")').click();

      cy.get('[data-testid="item-row"]').first().within(() => {
        cy.contains("Base Price").should("be.visible");
        cy.contains("Landed Cost").should("be.visible");
      });
    });
  });

  describe("GRN from Import Order", () => {
    it("should create GRN from import order", () => {
      cy.visit("/import-orders");
      cy.get('[data-testid="import-order-row"][data-status="ARRIVED"]')
        .first()
        .click();

      cy.get('button:contains("Create GRN")').click();

      cy.get('input[placeholder*="Received Qty"]').first().type("1000");

      cy.get('button:contains("Create GRN")').click();
      cy.contains("GRN created from import order").should("be.visible");
    });

    it("should record partial receipt of import", () => {
      cy.visit("/import-orders");
      cy.get('[data-testid="import-order-row"][data-status="ARRIVED"]')
        .first()
        .click();

      cy.get('button:contains("Create GRN")').click();

      // Receive partial
      cy.get('input[placeholder*="Received Qty"]').first().type("800");

      cy.get('button:contains("Create GRN")').click();
      cy.contains("Partial GRN created").should("be.visible");
    });
  });

  describe("Import Order Analytics", () => {
    it("should view import order metrics", () => {
      cy.visit("/import-orders");

      cy.get('button:contains("Analytics")').click();

      cy.contains("Total Import Orders").should("be.visible");
      cy.contains("Average Lead Time").should("be.visible");
      cy.contains("Landed Cost Variance").should("be.visible");
    });

    it("should track import costs by supplier", () => {
      cy.visit("/import-orders");

      cy.get('button:contains("Cost Analysis")').click();

      cy.get('[data-testid="supplier-row"]').should("have.length.greaterThan", 0);
    });

    it("should export import orders report", () => {
      cy.visit("/import-orders");

      cy.get('button:contains("Export")').click();
      cy.get('select[name="Format"]').select("CSV");

      cy.get('button:contains("Export")').click();
      cy.readFile("cypress/downloads/import-orders-*.csv").should("exist");
    });
  });
});
