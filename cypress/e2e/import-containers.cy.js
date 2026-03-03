/**
 * Import Containers E2E Tests
 *
 * Tests import container management:
 * - Container creation and tracking
 * - Shipment status tracking
 * - Container consolidation
 * - Weight and volume tracking
 * - Port and customs clearance
 *
 * Run: npm run test:e2e -- --spec '**/import-containers.cy.js'
 */

describe("Import Containers - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  describe("Container Creation", () => {
    it("should create new import container", () => {
      cy.visit("/import-containers");
      cy.get('button:contains("New Container")').click();

      cy.get('input[placeholder*="Container Number"]').type("CONT-001");
      cy.get('select[name="Container Type"]').select("20FT");
      cy.get('input[placeholder*="Seal Number"]').type("SEAL-12345");

      cy.get('button:contains("Create")').click();
      cy.contains("Container created").should("be.visible");
    });

    it("should assign container to import order", () => {
      cy.visit("/import-orders");
      cy.get('[data-testid="order-row"]').first().click();

      cy.get('button:contains("Assign Container")').click();

      cy.get('input[placeholder*="Container Number"]').type("CONT-001");
      cy.get('[role="option"]').first().click();

      cy.get('button:contains("Assign")').click();
      cy.contains("Container assigned").should("be.visible");
    });

    it("should add items to container", () => {
      cy.visit("/import-containers");
      cy.get('[data-testid="container-row"]').first().click();

      cy.get('button:contains("Add Items")').click();

      cy.get('input[placeholder*="Product"]').type("SS-304");
      cy.get('[role="option"]').first().click();

      cy.get('input[placeholder*="Quantity"]').type("500");
      cy.get('input[placeholder*="Weight"]').type("2500");

      cy.get('button:contains("Add")').click();
      cy.contains("Item added").should("be.visible");
    });
  });

  describe("Container Tracking", () => {
    it("should update container status to in-transit", () => {
      cy.visit("/import-containers");
      cy.get('[data-testid="container-row"][data-status="CREATED"]').first().click();

      cy.get('button:contains("Mark In Transit")').click();

      cy.get('input[placeholder*="Departure Date"]').type("2024-01-15");
      cy.get('input[placeholder*="Vessel"]').type("SHIP-001");

      cy.get('button:contains("Confirm")').click();
      cy.contains("Status: IN_TRANSIT").should("be.visible");
    });

    it("should update container status to port", () => {
      cy.visit("/import-containers");
      cy.get('[data-testid="container-row"][data-status="IN_TRANSIT"]').first().click();

      cy.get('button:contains("Arrived at Port")').click();

      cy.get('input[placeholder*="Arrival Date"]').type("2024-01-20");
      cy.get('select[name="Port"]').select("Jebel Ali");

      cy.get('button:contains("Confirm")').click();
      cy.contains("Status: AT_PORT").should("be.visible");
    });

    it("should track customs clearance status", () => {
      cy.visit("/import-containers");
      cy.get('[data-testid="container-row"]').first().click();

      cy.contains("Customs Status").should("be.visible");
      cy.contains("Documents Submitted").should("be.visible");
    });

    it("should mark container as cleared", () => {
      cy.visit("/import-containers");
      cy.get('[data-testid="container-row"][data-status="AT_PORT"]').first().click();

      cy.get('button:contains("Mark Cleared")').click();

      cy.get('input[placeholder*="Clearance Date"]').type("2024-01-22");

      cy.get('button:contains("Confirm")').click();
      cy.contains("Status: CLEARED").should("be.visible");
    });
  });

  describe("Container Consolidation", () => {
    it("should consolidate multiple import orders into container", () => {
      cy.visit("/import-containers");

      cy.get('button:contains("Consolidate")').click();

      cy.get('[data-testid="order-checkbox"]').eq(0).check();
      cy.get('[data-testid="order-checkbox"]').eq(1).check();

      cy.get('button:contains("Consolidate Selected")').click();
      cy.contains("Consolidation created").should("be.visible");
    });

    it("should split container items", () => {
      cy.visit("/import-containers");
      cy.get('[data-testid="container-row"]').first().click();

      cy.get('[data-testid="item-row"]').first().click();

      cy.get('button:contains("Split Item")').click();

      cy.get('input[placeholder*="Split Qty"]').type("250");

      cy.get('button:contains("Create Split")').click();
      cy.contains("Item split").should("be.visible");
    });
  });

  describe("Weight & Volume Tracking", () => {
    it("should calculate container weight", () => {
      cy.visit("/import-containers");
      cy.get('[data-testid="container-row"]').first().click();

      cy.contains("Total Weight").should("be.visible");
      cy.contains("Unit Weight").should("be.visible");
    });

    it("should track volume utilization", () => {
      cy.visit("/import-containers");
      cy.get('[data-testid="container-row"]').first().click();

      cy.contains("Container Capacity").should("be.visible");
      cy.contains("Volume Used").should("be.visible");
      cy.contains("Utilization %").should("be.visible");
    });

    it("should warn on overweight", () => {
      cy.visit("/import-containers");
      cy.get('[data-testid="container-row"]').first().click();

      cy.get('button:contains("Add Items")').click();

      cy.get('input[placeholder*="Weight"]').type("25000");

      cy.contains("Overweight warning").should("be.visible");
    });
  });

  describe("Port & Customs Management", () => {
    it("should select departure port", () => {
      cy.visit("/import-containers");
      cy.get('[data-testid="container-row"]').first().click();

      cy.get('select[name="Departure Port"]').select("Shanghai");

      cy.get('button:contains("Save")').click();
      cy.contains("Port updated").should("be.visible");
    });

    it("should select destination port", () => {
      cy.visit("/import-containers");
      cy.get('[data-testid="container-row"]').first().click();

      cy.get('select[name="Destination Port"]').select("Jebel Ali");

      cy.get('button:contains("Save")').click();
      cy.contains("Port updated").should("be.visible");
    });

    it("should track estimated arrival", () => {
      cy.visit("/import-containers");
      cy.get('[data-testid="container-row"]').first().click();

      cy.contains("Estimated Arrival").should("be.visible");
      cy.contains("Actual Arrival").should("be.visible");
    });

    it("should manage customs documents", () => {
      cy.visit("/import-containers");
      cy.get('[data-testid="container-row"]').first().click();

      cy.get('button:contains("Customs Docs")').click();

      cy.get('[data-testid="doc-row"]').should("have.length.greaterThan", 0);
    });
  });

  describe("Container Receiving", () => {
    it("should mark container as received", () => {
      cy.visit("/import-containers");
      cy.get('[data-testid="container-row"][data-status="CLEARED"]').first().click();

      cy.get('button:contains("Mark Received")').click();

      cy.get('input[placeholder*="Warehouse"]').type("Main Warehouse");
      cy.get('input[placeholder*="Receipt Date"]').type("2024-01-23");

      cy.get('button:contains("Confirm")').click();
      cy.contains("Status: RECEIVED").should("be.visible");
    });

    it("should verify container contents on receipt", () => {
      cy.visit("/import-containers");
      cy.get('[data-testid="container-row"][data-status="RECEIVED"]').first().click();

      cy.get('button:contains("Verify Contents")').click();

      cy.get('[data-testid="item-row"]').each(($item) => {
        cy.wrap($item).find('checkbox').check();
      });

      cy.get('button:contains("Confirm Receipt")').click();
      cy.contains("Contents verified").should("be.visible");
    });

    it("should create GRN from container receipt", () => {
      cy.visit("/import-containers");
      cy.get('[data-testid="container-row"][data-status="RECEIVED"]').first().click();

      cy.get('button:contains("Create GRN")').click();

      cy.contains("GRN created").should("be.visible");
    });
  });

  describe("Container Reporting", () => {
    it("should view container status report", () => {
      cy.visit("/reports/import-containers");

      cy.contains("Container Status Report").should("be.visible");
      cy.get('[data-testid="container-row"]').should("have.length.greaterThan", 0);
    });

    it("should filter containers by status", () => {
      cy.visit("/import-containers");

      cy.get('select[name="Status"]').select("IN_TRANSIT");

      cy.get('[data-testid="container-row"]').should("have.length.greaterThan", 0);
    });

    it("should export container tracking data", () => {
      cy.visit("/import-containers");

      cy.get('button:contains("Export")').click();
      cy.get('select[name="Format"]').select("CSV");

      cy.get('button:contains("Export")').click();
      cy.readFile("cypress/downloads/containers-*.csv").should("exist");
    });
  });
});
