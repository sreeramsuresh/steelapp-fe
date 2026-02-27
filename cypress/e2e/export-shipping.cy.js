/**
 * Export Shipping E2E Tests
 *
 * Tests export shipment management:
 * - Export shipment creation
 * - Shipping logistics planning
 * - Freight and insurance management
 * - Shipment tracking and delivery
 * - Customs clearance at origin
 *
 */

describe("Export Shipping - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  describe("Shipment Creation", () => {
    it("should create export shipment", () => {
      cy.visit("/app/import-export");
      cy.get('[data-testid="order-row"]').first().click();

      cy.get('button:contains("Create Shipment")').click();

      cy.get('select[name="Destination Port"]').select("Singapore Port");
      cy.get('input[placeholder*="Expected Delivery"]').type("2024-02-15");

      cy.get('button:contains("Create")').click();
      cy.contains("Shipment created").should("be.visible");
    });

    it("should assign shipping mode", () => {
      cy.visit("/app/import-export");
      cy.get('[data-testid="shipment-row"]').first().click();

      cy.get('select[name="Shipping Mode"]').select("SEA");

      cy.get('button:contains("Save")').click();
      cy.contains("Mode updated").should("be.visible");
    });

    it("should select freight company", () => {
      cy.visit("/app/import-export");
      cy.get('[data-testid="shipment-row"]').first().click();

      cy.get('button:contains("Assign Freight")').click();

      cy.get('select[name="Freight Provider"]').select("Global Shipping");
      cy.get('input[placeholder*="Freight Cost"]').type("5000");

      cy.get('button:contains("Assign")').click();
      cy.contains("Freight assigned").should("be.visible");
    });
  });

  describe("Shipping Logistics", () => {
    it("should plan consolidation", () => {
      cy.visit("/app/import-export");

      cy.get('button:contains("Consolidate")').click();

      cy.get('[data-testid="shipment-checkbox"]').eq(0).check();
      cy.get('[data-testid="shipment-checkbox"]').eq(1).check();

      cy.get('button:contains("Create Consolidation")').click();
      cy.contains("Consolidation created").should("be.visible");
    });

    it("should book shipping space", () => {
      cy.visit("/app/import-export");
      cy.get('[data-testid="shipment-row"]').first().click();

      cy.get('button:contains("Book Shipping")').click();

      cy.get('input[placeholder*="Container Type"]').type("20FT");
      cy.get('input[placeholder*="Quantity"]').type("1");

      cy.get('button:contains("Book")').click();
      cy.contains("Booking confirmed").should("be.visible");
    });

    it("should arrange insurance", () => {
      cy.visit("/app/import-export");
      cy.get('[data-testid="shipment-row"]').first().click();

      cy.get('button:contains("Arrange Insurance")').click();

      cy.get('input[placeholder*="Insurance Value"]').type("50000");
      cy.get('input[placeholder*="Premium %"]').type("0.5");

      cy.get('button:contains("Arrange")').click();
      cy.contains("Insurance arranged").should("be.visible");
    });
  });

  describe("Shipment Tracking", () => {
    it("should update shipment departure", () => {
      cy.visit("/app/import-export");
      cy.get('[data-testid="shipment-row"][data-status="READY"]').first().click();

      cy.get('button:contains("Mark Departed")').click();

      cy.get('input[placeholder*="Departure Date"]').type("2024-02-01");
      cy.get('input[placeholder*="Vessel"]').type("MV HARMONY");

      cy.get('button:contains("Confirm")').click();
      cy.contains("Status: IN_TRANSIT").should("be.visible");
    });

    it("should track transit status", () => {
      cy.visit("/app/import-export");
      cy.get('[data-testid="shipment-row"][data-status="IN_TRANSIT"]').first().click();

      cy.contains("Departure Port").should("be.visible");
      cy.contains("Current Location").should("be.visible");
      cy.contains("Destination Port").should("be.visible");
    });

    it("should update arrival at port", () => {
      cy.visit("/app/import-export");
      cy.get('[data-testid="shipment-row"]').first().click();

      cy.get('button:contains("Mark Arrived")').click();

      cy.get('input[placeholder*="Arrival Date"]').type("2024-02-08");

      cy.get('button:contains("Confirm")').click();
      cy.contains("Status: AT_DESTINATION").should("be.visible");
    });

    it("should record delivery", () => {
      cy.visit("/app/import-export");
      cy.get('[data-testid="shipment-row"]').first().click();

      cy.get('button:contains("Mark Delivered")').click();

      cy.get('input[placeholder*="Delivery Date"]').type("2024-02-15");

      cy.get('button:contains("Confirm")').click();
      cy.contains("Status: DELIVERED").should("be.visible");
    });
  });

  describe("Freight Management", () => {
    it("should calculate freight charges", () => {
      cy.visit("/app/import-export");
      cy.get('[data-testid="shipment-row"]').first().click();

      cy.contains("Freight Cost").should("be.visible");
      cy.contains("Insurance").should("be.visible");
      cy.contains("Handling").should("be.visible");
      cy.contains("Total Charges").should("be.visible");
    });

    it("should invoice freight", () => {
      cy.visit("/app/import-export");
      cy.get('[data-testid="shipment-row"]').first().click();

      cy.get('button:contains("Invoice Freight")').click();

      cy.get('button:contains("Create Invoice")').click();
      cy.contains("Freight invoice created").should("be.visible");
    });

    it("should track freight documentation", () => {
      cy.visit("/app/import-export");
      cy.get('[data-testid="shipment-row"]').first().click();

      cy.get('button:contains("Freight Documents")').click();

      cy.get('[data-testid="document-row"]').should("have.length.greaterThan", 0);
    });
  });

  describe("Customs Clearance at Origin", () => {
    it("should submit export customs docs", () => {
      cy.visit("/app/import-export");
      cy.get('[data-testid="shipment-row"]').first().click();

      cy.get('button:contains("Customs")').click();

      cy.get('[data-testid="doc-checkbox"]').each(($doc) => {
        cy.wrap($doc).check();
      });

      cy.get('button:contains("Submit")').click();
      cy.contains("Submitted for clearance").should("be.visible");
    });

    it("should track export clearance status", () => {
      cy.visit("/app/import-export");
      cy.get('[data-testid="shipment-row"]').first().click();

      cy.contains("Customs Status").should("be.visible");
      cy.contains("Cleared").should("be.visible");
    });
  });

  describe("Shipping Reports", () => {
    it("should view shipping summary", () => {
      cy.visit("/analytics/reports/export-shipping");

      cy.contains("Export Shipping Report").should("be.visible");
      cy.get('[data-testid="shipment-row"]').should("have.length.greaterThan", 0);
    });

    it("should track shipment performance", () => {
      cy.visit("/analytics/reports/export-shipping");

      cy.get('button:contains("Performance")').click();

      cy.contains("On-Time Delivery %").should("be.visible");
      cy.contains("Delay Analysis").should("be.visible");
    });

    it("should export shipping data", () => {
      cy.visit("/app/import-export");

      cy.get('button:contains("Export")').click();
      cy.get('select[name="Format"]').select("CSV");

      cy.get('button:contains("Export")').click();
      cy.readFile("cypress/downloads/shipments-*.csv").should("exist");
    });
  });
});
