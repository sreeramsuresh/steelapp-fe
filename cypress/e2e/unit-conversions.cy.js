/**
 * Unit Conversions E2E Tests
 *
 * Tests unit conversion and measurement management:
 * - Define unit conversions
 * - Convert between units
 * - Unit hierarchies
 * - Default unit settings
 * - Quantity validation
 *
 * Run: npm run test:e2e -- --spec '**/unit-conversions.cy.js'
 */

describe("Unit Conversions - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  describe("Unit Setup", () => {
    it("should view available units", () => {
      cy.visit("/settings/units");

      cy.get('[data-testid="unit-row"]').should("have.length.greaterThan", 0);

      cy.get('[data-testid="unit-row"]')
        .first()
        .within(() => {
          cy.contains("KG").should("be.visible");
        });
    });

    it("should create new unit", () => {
      cy.visit("/settings/units");
      cy.get('button:contains("New Unit")').click();

      cy.get('input[placeholder*="Unit Name"]').type("Kilogram");
      cy.get('input[placeholder*="Code"]').type("KG");
      cy.get('input[placeholder*="Symbol"]').type("kg");

      cy.get('select[name="Unit Type"]').select("WEIGHT");

      cy.get('button:contains("Create Unit")').click();
      cy.contains("Unit created").should("be.visible");
    });

    it("should create unit with category", () => {
      cy.visit("/settings/units");
      cy.get('button:contains("New Unit")').click();

      cy.get('input[placeholder*="Unit Name"]').type("Meter");
      cy.get('input[placeholder*="Code"]').type("M");

      cy.get('select[name="Category"]').select("LENGTH");
      cy.get('select[name="Unit Type"]').select("MEASUREMENT");

      cy.get('button:contains("Create Unit")').click();
      cy.contains("Unit created").should("be.visible");
    });
  });

  describe("Unit Conversions", () => {
    it("should create unit conversion", () => {
      cy.visit("/settings/conversions");
      cy.get('button:contains("New Conversion")').click();

      cy.get('select[name="From Unit"]').select("KG");
      cy.get('select[name="To Unit"]').select("TON");

      cy.get('input[placeholder*="Factor"]').type("1000");

      cy.get('button:contains("Create Conversion")').click();
      cy.contains("Conversion created").should("be.visible");
    });

    it("should create bidirectional conversion", () => {
      cy.visit("/settings/conversions");
      cy.get('button:contains("New Conversion")').click();

      cy.get('select[name="From Unit"]').select("M");
      cy.get('select[name="To Unit"]').select("CM");

      cy.get('input[placeholder*="Factor"]').type("100");

      cy.get('checkbox[name="bidirectional"]').check();

      cy.get('button:contains("Create Conversion")').click();
      cy.contains("Conversion created").should("be.visible");
    });

    it("should create complex conversion", () => {
      cy.visit("/settings/conversions");
      cy.get('button:contains("New Conversion")').click();

      cy.get('select[name="From Unit"]').select("KG");
      cy.get('select[name="To Unit"]').select("LB");

      cy.get('input[placeholder*="Factor"]').type("2.20462");

      cy.get('input[placeholder*="Precision"]').type("4");

      cy.get('button:contains("Create Conversion")').click();
      cy.contains("Conversion created").should("be.visible");
    });

    it("should view conversion chain", () => {
      cy.visit("/settings/conversions");

      cy.get('button:contains("Conversion Chain")').click();

      cy.get('[data-testid="chain-row"]').should("have.length.greaterThan", 0);
    });

    it("should edit conversion factor", () => {
      cy.visit("/settings/conversions");
      cy.get('[data-testid="conversion-row"]').first().click();

      cy.get('button:contains("Edit")').click();

      cy.get('input[placeholder*="Factor"]').clear().type("1100");

      cy.get('button:contains("Save Changes")').click();
      cy.contains("Conversion updated").should("be.visible");
    });

    it("should delete conversion", () => {
      cy.visit("/settings/conversions");
      cy.get('[data-testid="conversion-row"]').first().click();

      cy.get('button[aria-label="More"]').click();
      cy.get('button:contains("Delete")').click();

      cy.get('button:contains("Confirm")').click();
      cy.contains("Conversion deleted").should("be.visible");
    });
  });

  describe("Unit Conversion Application", () => {
    it("should convert quantity on product entry", () => {
      cy.visit("/products");
      cy.get('[data-testid="product-row"]').first().click();

      cy.get('button:contains("Units")').click();

      // Select alternate unit
      cy.get('select[name="Unit"]').select("TON");

      cy.get('input[placeholder*="Quantity"]').type("1");

      // Verify auto-conversion
      cy.contains("1000").should("be.visible"); // KG equivalent
    });

    it("should convert quantity on invoice line", () => {
      cy.visit("/invoices");
      cy.get('button:contains("Create Invoice")').click();

      cy.get('input[placeholder*="Customer"]').type("Customer");
      cy.get('[role="option"]').first().click();

      cy.get('button:contains("Add Item")').click();

      cy.get('input[placeholder*="Product"]').type("SS-304");
      cy.get('[role="option"]').first().click();

      // Set quantity in alternate unit
      cy.get('select[name="Unit"]').select("TON");
      cy.get('input[placeholder*="Quantity"]').type("1");

      // Verify conversion and calculation
      cy.contains("1000").should("be.visible");
    });

    it("should convert quantity on delivery note", () => {
      cy.visit("/delivery-notes");
      cy.get('button:contains("Create Delivery Note")').click();

      cy.get('input[placeholder*="Customer"]').type("Customer");
      cy.get('[role="option"]').first().click();

      cy.get('button:contains("Add Item")').click();

      cy.get('input[placeholder*="Product"]').type("SS-304");
      cy.get('[role="option"]').first().click();

      // Convert unit
      cy.get('select[name="Unit"]').select("TON");
      cy.get('input[placeholder*="Quantity"]').type("2");

      // Verify display
      cy.contains("2 TON").should("be.visible");
    });

    it("should validate quantity conversion", () => {
      cy.visit("/invoices");
      cy.get('button:contains("Create Invoice")').click();

      cy.get('input[placeholder*="Customer"]').type("Customer");
      cy.get('[role="option"]').first().click();

      cy.get('button:contains("Add Item")').click();

      cy.get('input[placeholder*="Product"]').type("SS-304");
      cy.get('[role="option"]').first().click();

      cy.get('input[placeholder*="Quantity"]').type("0");

      // Verify validation
      cy.contains("Quantity must be greater than 0").should("be.visible");
    });
  });

  describe("Default Units", () => {
    it("should set default unit for product", () => {
      cy.visit("/products");
      cy.get('[data-testid="product-row"]').first().click();

      cy.get('button:contains("Edit")').click();

      cy.get('select[name="Default Unit"]').select("KG");

      cy.get('button:contains("Save Changes")').click();
      cy.contains("Product updated").should("be.visible");
    });

    it("should set company default unit", () => {
      cy.visit("/settings/company");

      cy.get('button:contains("Edit")').click();

      cy.get('select[name="Default Weight Unit"]').select("KG");
      cy.get('select[name="Default Length Unit"]').select("M");

      cy.get('button:contains("Save Changes")').click();
      cy.contains("Company settings updated").should("be.visible");
    });

    it("should use company default in transactions", () => {
      cy.visit("/invoices");
      cy.get('button:contains("Create Invoice")').click();

      cy.get('input[placeholder*="Customer"]').type("Customer");
      cy.get('[role="option"]').first().click();

      cy.get('button:contains("Add Item")').click();

      cy.get('input[placeholder*="Product"]').type("SS-304");
      cy.get('[role="option"]').first().click();

      // Verify default unit is pre-selected
      cy.get('select[name="Unit"]').should("have.value", "KG");
    });
  });

  describe("Unit Calculator", () => {
    it("should use unit converter tool", () => {
      cy.visit("/settings/converter");

      cy.get('input[placeholder*="From Quantity"]').type("1");

      cy.get('select[name="From Unit"]').select("TON");
      cy.get('select[name="To Unit"]').select("KG");

      // Verify conversion
      cy.contains("1000").should("be.visible");
    });

    it("should perform reverse conversion", () => {
      cy.visit("/settings/converter");

      cy.get('input[placeholder*="From Quantity"]').type("1000");

      cy.get('select[name="From Unit"]').select("KG");
      cy.get('select[name="To Unit"]').select("TON");

      // Verify conversion
      cy.contains("1").should("be.visible");
    });

    it("should save conversion history", () => {
      cy.visit("/settings/converter");

      cy.get('input[placeholder*="From Quantity"]').type("100");

      cy.get('select[name="From Unit"]').select("M");
      cy.get('select[name="To Unit"]').select("CM");

      cy.get('button:contains("History")').click();

      cy.get('[data-testid="history-row"]').should("have.length.greaterThan", 0);
    });
  });

  describe("Stock Quantity Tracking with Units", () => {
    it("should track stock in multiple units", () => {
      cy.visit("/stock-batches");
      cy.get('[data-testid="batch-row"]').first().click();

      cy.get('button:contains("Quantity")').click();

      // View quantity in base unit
      cy.contains("KG").should("be.visible");

      // View in alternate units
      cy.get('button:contains("Convert")').click();

      cy.get('select[name="Unit"]').select("TON");

      cy.contains("TON").should("be.visible");
    });
  });

  describe("Unit Conversion Search & Filter", () => {
    it("should search units", () => {
      cy.visit("/settings/units");

      cy.get('input[placeholder*="Search"]').type("Kilogram");

      cy.wait(500);
      cy.get('[data-testid="unit-row"]').should("have.length.greaterThan", 0);
    });

    it("should filter units by category", () => {
      cy.visit("/settings/units");

      cy.get('select[name="Category"]').select("WEIGHT");

      cy.get('[data-testid="unit-row"]').should("have.length.greaterThan", 0);
    });

    it("should filter conversions by unit", () => {
      cy.visit("/settings/conversions");

      cy.get('select[name="From Unit"]').select("KG");

      cy.get('[data-testid="conversion-row"]').should("have.length.greaterThan", 0);
    });
  });

  describe("Unit Analytics", () => {
    it("should view unit metrics", () => {
      cy.visit("/settings/units");

      cy.get('button:contains("Analytics")').click();

      cy.contains("Total Units").should("be.visible");
      cy.contains("Active Units").should("be.visible");
      cy.contains("Categories").should("be.visible");
    });

    it("should export unit configuration", () => {
      cy.visit("/settings/units");

      cy.get('button:contains("Export")').click();
      cy.get('select[name="Format"]').select("CSV");

      cy.get('button:contains("Export")').click();
      cy.readFile("cypress/downloads/units-*.csv").should("exist");
    });

    it("should export conversion mappings", () => {
      cy.visit("/settings/conversions");

      cy.get('button:contains("Export")').click();
      cy.get('select[name="Format"]').select("CSV");

      cy.get('button:contains("Export")').click();
      cy.readFile("cypress/downloads/conversions-*.csv").should("exist");
    });
  });
});
