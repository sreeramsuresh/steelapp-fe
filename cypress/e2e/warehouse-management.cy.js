/**
 * Warehouse Management E2E Tests
 *
 * Tests warehouse operations:
 * - Create and configure warehouses
 * - Location management
 * - Capacity tracking
 * - Stock level monitoring
 * - Warehouse transfers
 *
 */

describe("Warehouse Management - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  describe("Create Warehouses", () => {
    it("should create new warehouse", () => {
      cy.visit("/app/warehouses");
      cy.get('button:contains("Create Warehouse")').click();

      cy.get('input[placeholder*="Warehouse Name"]').type("New Warehouse");
      cy.get('input[placeholder*="Warehouse Code"]').type("WH-NEW");

      // Address info
      cy.get('input[placeholder*="Street"]').type("123 Warehouse Ave");
      cy.get('input[placeholder*="City"]').type("Dubai");
      cy.get('select[name="Country"]').select("United Arab Emirates");

      // Capacity
      cy.get('input[placeholder*="Max Capacity"]').type("10000");
      cy.get('select[name="Capacity Unit"]').select("Units");

      cy.get('button:contains("Create Warehouse")').click();
      cy.contains("Warehouse created").should("be.visible");
    });

    it("should create warehouse with multiple zones", () => {
      cy.visit("/app/warehouses");
      cy.get('button:contains("Create Warehouse")').click();

      cy.get('input[placeholder*="Warehouse Name"]').type("Multi-Zone WH");
      cy.get('input[placeholder*="Warehouse Code"]').type("WH-MZ");

      cy.get('input[placeholder*="Street"]').type("456 Storage St");
      cy.get('input[placeholder*="City"]').type("Abu Dhabi");

      // Add zones
      cy.get('button:contains("Add Zone")').click();
      cy.get('input[placeholder*="Zone Name"]').first().type("Zone A");
      cy.get('input[placeholder*="Zone Capacity"]').first().type("5000");

      cy.get('button:contains("Add Zone")').click();
      cy.get('input[placeholder*="Zone Name"]').eq(1).type("Zone B");
      cy.get('input[placeholder*="Zone Capacity"]').eq(1).type("3000");

      cy.get('button:contains("Create Warehouse")').click();
      cy.contains("Warehouse created").should("be.visible");
    });

    it("should create warehouse with special storage", () => {
      cy.visit("/app/warehouses");
      cy.get('button:contains("Create Warehouse")').click();

      cy.get('input[placeholder*="Warehouse Name"]').type("Climate Controlled WH");
      cy.get('input[placeholder*="Warehouse Code"]').type("WH-CC");

      cy.get('input[placeholder*="Street"]').type("789 Climate St");
      cy.get('input[placeholder*="City"]').type("Sharjah");

      // Special storage
      cy.get('checkbox[name="climate-controlled"]').check();
      cy.get('input[placeholder*="Temp Range"]').type("-5 to 25C");

      cy.get('checkbox[name="secure-storage"]').check();

      cy.get('button:contains("Create Warehouse")').click();
      cy.contains("Warehouse created").should("be.visible");
    });
  });

  describe("Warehouse Configuration", () => {
    it("should configure warehouse settings", () => {
      cy.visit("/app/warehouses");
      cy.get('[data-testid="warehouse-row"]').first().click();

      cy.get('button:contains("Settings")').click();

      // Update capacity
      cy.get('input[placeholder*="Max Capacity"]').clear().type("15000");

      // Set reorder levels
      cy.get('input[placeholder*="Critical Level"]').type("500");
      cy.get('input[placeholder*="Reorder Level"]').type("1000");

      cy.get('button:contains("Save Settings")').click();
      cy.contains("Warehouse settings updated").should("be.visible");
    });

    it("should manage warehouse locations", () => {
      cy.visit("/app/warehouses");
      cy.get('[data-testid="warehouse-row"]').first().click();

      cy.get('button:contains("Manage Locations")').click();

      cy.get('button:contains("Add Location")').click();

      cy.get('input[placeholder*="Location Code"]').type("LOC-001");
      cy.get('input[placeholder*="Zone"]').type("Zone A");
      cy.get('input[placeholder*="Aisle"]').type("A");
      cy.get('input[placeholder*="Shelf"]').type("1");
      cy.get('input[placeholder*="Bin"]').type("001");

      cy.get('button:contains("Add Location")').click();
      cy.contains("Location added").should("be.visible");
    });

    it("should set warehouse holidays and closing dates", () => {
      cy.visit("/app/warehouses");
      cy.get('[data-testid="warehouse-row"]').first().click();

      cy.get('button:contains("Operating Hours")').click();

      // Set regular hours
      cy.get('select[name="Day"]').select("Monday");
      cy.get('input[placeholder*="Opening Time"]').type("08:00");
      cy.get('input[placeholder*="Closing Time"]').type("18:00");

      // Add holiday
      cy.get('button:contains("Add Holiday")').click();
      cy.get('input[placeholder*="Holiday Date"]').type("2024-12-25");

      cy.get('button:contains("Save Hours")').click();
      cy.contains("Operating hours updated").should("be.visible");
    });
  });

  describe("Stock Level Monitoring", () => {
    it("should view warehouse stock levels", () => {
      cy.visit("/app/warehouses");
      cy.get('[data-testid="warehouse-row"]').first().click();

      cy.get('button:contains("Stock Levels")').click();

      cy.contains("Total Units:").should("be.visible");
      cy.contains("Available:").should("be.visible");
      cy.contains("Reserved:").should("be.visible");
      cy.contains("Capacity Used:").should("be.visible");
    });

    it("should view stock by location", () => {
      cy.visit("/app/warehouses");
      cy.get('[data-testid="warehouse-row"]').first().click();

      cy.get('button:contains("Stock by Location")').click();

      cy.get('[data-testid="location-row"]').should("have.length.greaterThan", 0);

      cy.get('[data-testid="location-row"]')
        .first()
        .within(() => {
          cy.contains(/LOC-\d+/).should("be.visible");
          cy.contains(/\d+/).should("be.visible"); // Quantity
        });
    });

    it("should alert on low stock and capacity", () => {
      cy.visit("/app/warehouses");
      cy.get('[data-testid="warehouse-row"]').first().click();

      cy.get('button:contains("Alerts")').click();

      // Check for low stock alerts
      cy.get('[data-testid="alert-row"][data-alert-type="LOW_STOCK"]').should(
        "have.length.greaterThan",
        0,
      );

      // Check for capacity alerts
      cy.get('[data-testid="alert-row"][data-alert-type="HIGH_CAPACITY"]').each(
        ($alert) => {
          cy.wrap($alert).should("be.visible");
        },
      );
    });
  });

  describe("Warehouse Operations", () => {
    it("should initiate stock transfer between warehouses", () => {
      cy.visit("/app/warehouses");
      cy.get('[data-testid="warehouse-row"]').first().click();

      cy.get('button:contains("Transfer Stock")').click();

      cy.get('select[name="Destination Warehouse"]').select("Main Warehouse");
      cy.get('input[placeholder*="Product"]').type("SS-304");
      cy.get('[role="option"]').first().click();

      cy.get('input[placeholder*="Quantity"]').type("100");

      cy.get('button:contains("Initiate Transfer")').click();
      cy.contains("Transfer initiated").should("be.visible");
    });

    it("should perform stock count and reconciliation", () => {
      cy.visit("/app/warehouses");
      cy.get('[data-testid="warehouse-row"]').first().click();

      cy.get('button:contains("Stock Count")').click();

      // Create count session
      cy.get('button:contains("Start Count")').click();

      cy.get('input[placeholder*="Product"]').type("SS-304");
      cy.get('[role="option"]').first().click();

      cy.get('input[placeholder*="Physical Count"]').type("98");

      cy.get('button:contains("Record Item")').click();

      cy.get('button:contains("Complete Count")').click();

      // Review variance
      cy.get('body').then(($body) => {
        if ($body.text().includes("Variance")) {
          cy.contains("Reconcile").should("be.visible");
        }
      });
    });

    it("should record warehouse adjustment", () => {
      cy.visit("/app/warehouses");
      cy.get('[data-testid="warehouse-row"]').first().click();

      cy.get('button:contains("Adjustments")').click();
      cy.get('button:contains("New Adjustment")').click();

      cy.get('input[placeholder*="Product"]').type("SS-304");
      cy.get('[role="option"]').first().click();

      cy.get('input[placeholder*="Quantity"]').type("-5");
      cy.get('select[name="Reason"]').select("DAMAGED");
      cy.get('textarea[placeholder*="Notes"]').type("Water damage");

      cy.get('button:contains("Record Adjustment")').click();
      cy.contains("Adjustment recorded").should("be.visible");
    });
  });

  describe("Warehouse Analytics", () => {
    it("should view warehouse utilization metrics", () => {
      cy.visit("/app/warehouses");

      cy.get('button:contains("Analytics")').click();

      cy.contains("Total Warehouses:").should("be.visible");
      cy.contains("Total Capacity:").should("be.visible");
      cy.contains("Average Utilization:").should("be.visible");
      cy.contains("Inventory Value:").should("be.visible");
    });

    it("should compare warehouse performance", () => {
      cy.visit("/app/warehouses");

      cy.get('button:contains("Performance")').click();

      // View warehouse comparison
      cy.get('[data-testid="warehouse-comparison"]').should("exist");

      cy.contains("Turnover Rate").should("be.visible");
      cy.contains("Space Efficiency").should("be.visible");
    });

    it("should view stock aging by warehouse", () => {
      cy.visit("/app/warehouses");

      cy.get('button:contains("Stock Aging")').click();

      cy.get('select[name="Warehouse"]').select("Main Warehouse");

      cy.contains("0-30 Days:").should("be.visible");
      cy.contains("31-90 Days:").should("be.visible");
      cy.contains("Over 90 Days:").should("be.visible");
    });
  });

  describe("Warehouse Staff & Access", () => {
    it("should assign staff to warehouse", () => {
      cy.visit("/app/warehouses");
      cy.get('[data-testid="warehouse-row"]').first().click();

      cy.get('button:contains("Manage Staff")').click();

      cy.get('button:contains("Assign Staff")').click();

      cy.get('input[placeholder*="Select User"]').type("Warehouse Manager");
      cy.get('[role="option"]').first().click();

      cy.get('select[name="Role"]').select("Warehouse Manager");

      cy.get('button:contains("Assign")').click();
      cy.contains("Staff assigned").should("be.visible");
    });

    it("should set warehouse access controls", () => {
      cy.visit("/app/warehouses");
      cy.get('[data-testid="warehouse-row"]').first().click();

      cy.get('button:contains("Access Control")').click();

      cy.get('checkbox[name="restrict-access"]').check();

      cy.get('input[placeholder*="Authorized Users"]').type("User 1, User 2");

      cy.get('button:contains("Save Access")').click();
      cy.contains("Access control updated").should("be.visible");
    });
  });

  describe("Warehouse Reporting", () => {
    it("should generate warehouse inventory report", () => {
      cy.visit("/app/warehouses");
      cy.get('[data-testid="warehouse-row"]').first().click();

      cy.get('button:contains("Reports")').click();
      cy.get('button:contains("Inventory Report")').click();

      cy.get('input[placeholder*="From Date"]').type("2024-01-01");
      cy.get('input[placeholder*="To Date"]').type("2024-12-31");

      cy.get('button:contains("Generate")').click();

      cy.contains("Inventory Report").should("be.visible");
    });

    it("should export warehouse data to CSV", () => {
      cy.visit("/app/warehouses");
      cy.get('[data-testid="warehouse-row"]').first().click();

      cy.get('button:contains("Export")').click();
      cy.get('select[name="Format"]').select("CSV");

      cy.get('button:contains("Export")').click();
      cy.readFile("cypress/downloads/warehouse-*.csv").should("exist");
    });
  });

  describe("Warehouse Status", () => {
    it("should activate warehouse", () => {
      cy.visit("/app/warehouses");
      cy.get('[data-testid="warehouse-row"][data-status="INACTIVE"]')
        .first()
        .click();

      cy.get('button:contains("Activate")').click();
      cy.contains("Warehouse activated").should("be.visible");
    });

    it("should deactivate warehouse", () => {
      cy.visit("/app/warehouses");
      cy.get('[data-testid="warehouse-row"][data-status="ACTIVE"]')
        .first()
        .click();

      cy.get('button:contains("Deactivate")').click();
      cy.get('textarea[placeholder*="Reason"]').type("Relocating facility");

      cy.get('button:contains("Confirm")').click();
      cy.contains("Warehouse deactivated").should("be.visible");
    });

    it("should put warehouse temporarily offline", () => {
      cy.visit("/app/warehouses");
      cy.get('[data-testid="warehouse-row"][data-status="ACTIVE"]')
        .first()
        .click();

      cy.get('button:contains("Maintenance")').click();

      cy.get('textarea[placeholder*="Reason"]').type("System maintenance");
      cy.get('input[placeholder*="Duration Hours"]').type("4");

      cy.get('button:contains("Go Offline")').click();
      cy.contains("Warehouse offline for maintenance").should("be.visible");
    });
  });
});
