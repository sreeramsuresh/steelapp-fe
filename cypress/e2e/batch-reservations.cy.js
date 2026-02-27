/**
 * Batch Reservations E2E Tests
 *
 * Tests batch reservation and allocation:
 * - Reserve batches for orders
 * - Auto-release unreserved inventory
 * - Allocation overrides
 * - Reservation expiry
 * - Batch hold management
 *
 */

describe("Batch Reservations - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  describe("Reserve Batches", () => {
    it("should reserve batch for invoice", () => {
      cy.visit("/app/inventory");
      cy.get('button:contains("Create Reservation")').click();

      // Link to invoice
      cy.get('input[placeholder*="Select Invoice"]').type("INV-");
      cy.get('[role="option"]').first().click();

      // Select product
      cy.get('input[placeholder*="Product"]').type("SS-304");
      cy.get('[role="option"]').first().click();

      // Reserve quantity
      cy.get('input[placeholder*="Quantity"]').type("100");

      // Select batch
      cy.get('select[name="Batch"]').should("be.visible");
      cy.get('select[name="Batch"]').select(0);

      cy.get('button:contains("Reserve Batch")').click();
      cy.contains("Batch reserved").should("be.visible");
    });

    it("should auto-select FIFO batch on reservation", () => {
      cy.visit("/app/inventory");
      cy.get('button:contains("Create Reservation")').click();

      cy.get('input[placeholder*="Select Invoice"]').type("INV-");
      cy.get('[role="option"]').first().click();

      cy.get('input[placeholder*="Product"]').type("SS-304");
      cy.get('[role="option"]').first().click();

      cy.get('input[placeholder*="Quantity"]').type("100");

      // Enable FIFO
      cy.get('checkbox[name="use-fifo"]').check();

      cy.get('button:contains("Reserve Batch")').click();
      cy.contains("FIFO batch selected").should("be.visible");
    });

    it("should split reservation across multiple batches", () => {
      cy.visit("/app/inventory");
      cy.get('button:contains("Create Reservation")').click();

      cy.get('input[placeholder*="Select Invoice"]').type("INV-");
      cy.get('[role="option"]').first().click();

      cy.get('input[placeholder*="Product"]').type("SS-304");
      cy.get('[role="option"]').first().click();

      cy.get('input[placeholder*="Quantity"]').type("150");

      // Reserve across multiple batches
      cy.get('checkbox[name="split-batches"]').check();

      cy.get('button:contains("Reserve Batch")').click();
      cy.contains("Reserved across multiple batches").should("be.visible");
    });

    it("should handle insufficient stock on reservation", () => {
      cy.visit("/app/inventory");
      cy.get('button:contains("Create Reservation")').click();

      cy.get('input[placeholder*="Select Invoice"]').type("INV-");
      cy.get('[role="option"]').first().click();

      cy.get('input[placeholder*="Product"]').type("SS-304");
      cy.get('[role="option"]').first().click();

      // Try to reserve more than available
      cy.get('input[placeholder*="Quantity"]').type("999999");

      cy.get('button:contains("Reserve Batch")').click();

      cy.contains("Insufficient stock").should("be.visible");
    });
  });

  describe("Release Reservations", () => {
    it("should release batch reservation", () => {
      cy.visit("/app/inventory");
      cy.get('[data-testid="reservation-row"][data-status="RESERVED"]')
        .first()
        .click();

      cy.get('button:contains("Release")').click();
      cy.get('textarea[placeholder*="Reason"]').type("Order cancelled");

      cy.get('button:contains("Confirm Release")').click();
      cy.contains("Reservation released").should("be.visible");
    });

    it("should partially release reservation", () => {
      cy.visit("/app/inventory");
      cy.get('[data-testid="reservation-row"][data-status="RESERVED"]')
        .first()
        .click();

      cy.get('button:contains("Partial Release")').click();

      cy.get('input[placeholder*="Release Quantity"]').type("50");
      cy.get('textarea[placeholder*="Reason"]').type("Partial cancellation");

      cy.get('button:contains("Release")').click();
      cy.contains("Partial release recorded").should("be.visible");
    });

    it("should auto-release expired reservation", () => {
      cy.visit("/app/inventory");

      // Set expiry filter
      cy.get('input[placeholder*="Show Expiring"]').type("1");

      cy.get('[data-testid="reservation-row"][data-status="EXPIRED"]')
        .first()
        .click();

      cy.get('button:contains("Auto-Release")').click();
      cy.contains("Expired reservation auto-released").should("be.visible");
    });
  });

  describe("Allocation & Conversion", () => {
    it("should convert reservation to allocation", () => {
      cy.visit("/app/inventory");
      cy.get('[data-testid="reservation-row"][data-status="RESERVED"]')
        .first()
        .click();

      cy.get('button:contains("Allocate")').click();

      // Confirm allocation
      cy.get('button:contains("Confirm Allocation")').click();

      cy.contains("Batch allocated").should("be.visible");
    });

    it("should swap batch on reservation", () => {
      cy.visit("/app/inventory");
      cy.get('[data-testid="reservation-row"][data-status="RESERVED"]')
        .first()
        .click();

      cy.get('button:contains("Swap Batch")').click();

      // Select new batch
      cy.get('select[name="New Batch"]').select(1);

      cy.get('button:contains("Confirm Swap")').click();
      cy.contains("Batch swapped").should("be.visible");
    });

    it("should override automatic allocation", () => {
      cy.visit("/app/inventory");
      cy.get('[data-testid="reservation-row"][data-status="RESERVED"]')
        .first()
        .click();

      cy.get('button[aria-label="More"]').click();
      cy.get('button:contains("Override Allocation")').click();

      // Select preferred batch
      cy.get('select[name="Preferred Batch"]').select(0);

      cy.get('textarea[placeholder*="Override Reason"]').type(
        "Special customer request",
      );

      cy.get('button:contains("Apply Override")').click();
      cy.contains("Allocation override applied").should("be.visible");
    });
  });

  describe("Reservation Expiry", () => {
    it("should set reservation expiry", () => {
      cy.visit("/app/inventory");
      cy.get('button:contains("Create Reservation")').click();

      cy.get('input[placeholder*="Select Invoice"]').type("INV-");
      cy.get('[role="option"]').first().click();

      cy.get('input[placeholder*="Product"]').type("SS-304");
      cy.get('[role="option"]').first().click();

      cy.get('input[placeholder*="Quantity"]').type("100");

      // Set expiry
      cy.get('input[placeholder*="Expiry Date"]').type("2024-01-31");
      cy.get('input[placeholder*="Expiry Time"]').type("17:00");

      cy.get('button:contains("Reserve Batch")').click();
      cy.contains("Batch reserved").should("be.visible");
    });

    it("should extend reservation expiry", () => {
      cy.visit("/app/inventory");
      cy.get('[data-testid="reservation-row"][data-status="EXPIRING_SOON"]')
        .first()
        .click();

      cy.get('button:contains("Extend Expiry")').click();

      cy.get('input[placeholder*="New Expiry Date"]').type("2024-02-28");

      cy.get('button:contains("Extend")').click();
      cy.contains("Expiry extended").should("be.visible");
    });

    it("should view expiring reservations", () => {
      cy.visit("/app/inventory");

      cy.get('button:contains("Expiring Soon")').click();

      cy.get('[data-testid="reservation-row"][data-status="EXPIRING_SOON"]').should(
        "have.length.greaterThan",
        0,
      );
    });
  });

  describe("Batch Hold Management", () => {
    it("should place hold on batch", () => {
      cy.visit("/app/inventory");
      cy.get('[data-testid="reservation-row"]').first().click();

      cy.get('button[aria-label="More"]').click();
      cy.get('button:contains("Place Hold")').click();

      cy.get('select[name="Hold Reason"]').select("QUALITY_CHECK");
      cy.get('textarea[placeholder*="Notes"]').type("Pending quality inspection");

      cy.get('button:contains("Apply Hold")').click();
      cy.contains("Hold placed on batch").should("be.visible");
    });

    it("should release hold on batch", () => {
      cy.visit("/app/inventory");
      cy.get('[data-testid="reservation-row"][data-status="ON_HOLD"]')
        .first()
        .click();

      cy.get('button:contains("Release Hold")').click();

      cy.get('button:contains("Confirm Release")').click();
      cy.contains("Hold released").should("be.visible");
    });

    it("should view holds on batch", () => {
      cy.visit("/app/inventory");

      cy.get('button:contains("View Holds")').click();

      cy.get('[data-testid="hold-row"]').should("have.length.greaterThan", 0);
    });
  });

  describe("Reservation Reporting", () => {
    it("should view active reservations by product", () => {
      cy.visit("/app/inventory");

      cy.get('button:contains("Active Reservations")').click();

      cy.get('input[placeholder*="Product"]').type("SS-304");
      cy.get('[role="option"]').first().click();

      cy.get('[data-testid="reservation-row"]').should("have.length.greaterThan", 0);
    });

    it("should view reservation utilization rate", () => {
      cy.visit("/app/inventory");

      cy.get('button:contains("Analytics")').click();

      cy.contains("Total Reserved:").should("be.visible");
      cy.contains("Available Stock:").should("be.visible");
      cy.contains("Utilization %:").should("be.visible");
    });

    it("should identify overallocated products", () => {
      cy.visit("/app/inventory");

      cy.get('button:contains("Overallocation Check")').click();

      // View products with overallocation
      cy.get('[data-testid="alert-row"]').each(($alert) => {
        cy.wrap($alert).should("contain", "Overallocated");
      });
    });
  });

  describe("Batch Conflict Resolution", () => {
    it("should detect conflicting reservations", () => {
      cy.visit("/app/inventory");

      cy.get('button:contains("Check Conflicts")').click();

      // Should show if any conflicts exist
      cy.get('body').then(($body) => {
        if ($body.text().includes("Conflict")) {
          cy.contains("Conflicting reservations detected").should("be.visible");
        }
      });
    });

    it("should resolve reservation priority", () => {
      cy.visit("/app/inventory");

      cy.get('button:contains("Manage Conflicts")').click();

      // Select competing reservation
      cy.get('[data-testid="conflict-row"]').first().click();

      cy.get('button:contains("Set Priority")').click();
      cy.get('select[name="Priority"]').select("HIGH");

      cy.get('button:contains("Apply")').click();
      cy.contains("Priority updated").should("be.visible");
    });
  });

  describe("Reservation Audit", () => {
    it("should view reservation audit trail", () => {
      cy.visit("/app/inventory");
      cy.get('[data-testid="reservation-row"]').first().click();

      cy.get('button:contains("Audit Trail")').click();

      cy.get('[data-testid="audit-entry"]').should("have.length.greaterThan", 0);
    });

    it("should export reservation report", () => {
      cy.visit("/app/inventory");

      cy.get('button:contains("Export")').click();
      cy.get('select[name="Format"]').select("CSV");

      cy.get('button:contains("Export")').click();
      cy.readFile("cypress/downloads/reservations-*.csv").should("exist");
    });
  });
});
