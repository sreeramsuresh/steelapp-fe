/**
 * Countries & Currencies E2E Tests
 *
 * Tests country and currency configuration:
 * - Country setup and management
 * - Currency configuration
 * - Exchange rates
 * - Regional settings
 * - Currency conversion
 *
 * Run: npm run test:e2e -- --spec "**/countries-currencies.cy.js"
 */

describe("Countries & Currencies - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  describe("Country Management", () => {
    it("should view available countries", () => {
      cy.visit("/settings/countries");

      cy.get('[data-testid="country-row"]').should("have.length.greaterThan", 0);

      cy.get('[data-testid="country-row"]')
        .first()
        .within(() => {
          cy.contains("UAE").should("be.visible");
        });
    });

    it("should search for country", () => {
      cy.visit("/settings/countries");

      cy.get('input[placeholder*="Search"]').type("Saudi");

      cy.wait(500);
      cy.get('[data-testid="country-row"]').should("have.length.greaterThan", 0);
    });

    it("should view country details", () => {
      cy.visit("/settings/countries");
      cy.get('[data-testid="country-row"]').first().click();

      cy.contains("Country Code").should("be.visible");
      cy.contains("Country Name").should("be.visible");
      cy.contains("Currency").should("be.visible");
      cy.contains("Tax Rate").should("be.visible");
    });

    it("should filter countries by region", () => {
      cy.visit("/settings/countries");

      cy.get('select[name="Region"]').select("GCC");

      cy.get('[data-testid="country-row"]').should("have.length.greaterThan", 0);
    });

    it("should update country settings", () => {
      cy.visit("/settings/countries");
      cy.get('[data-testid="country-row"]').first().click();

      cy.get('button:contains("Edit")').click();

      cy.get('input[placeholder*="Tax Rate"]').clear().type("5");

      cy.get('button:contains("Save Changes")').click();
      cy.contains("Country settings updated").should("be.visible");
    });
  });

  describe("Currency Configuration", () => {
    it("should view active currencies", () => {
      cy.visit("/settings/currencies");

      cy.get('[data-testid="currency-row"]').should("have.length.greaterThan", 0);

      cy.get('[data-testid="currency-row"]')
        .first()
        .within(() => {
          cy.contains("AED").should("be.visible");
        });
    });

    it("should enable currency for transactions", () => {
      cy.visit("/settings/currencies");
      cy.get('[data-testid="currency-row"]').first().click();

      cy.get('button:contains("Edit")').click();

      cy.get('checkbox[name="is-active"]').check();

      cy.get('button:contains("Save Changes")').click();
      cy.contains("Currency updated").should("be.visible");
    });

    it("should set base currency", () => {
      cy.visit("/settings/currencies");

      cy.get('button:contains("Set Base Currency")').click();

      cy.get('input[placeholder*="Currency"]').type("AED");
      cy.get('[role="option"]').first().click();

      cy.get('button:contains("Set")').click();
      cy.contains("Base currency set").should("be.visible");
    });

    it("should view currency symbols", () => {
      cy.visit("/settings/currencies");
      cy.get('[data-testid="currency-row"]').first().click();

      cy.contains("Symbol").should("be.visible");
      cy.contains("Code").should("be.visible");
      cy.contains("Decimal Places").should("be.visible");
    });

    it("should configure currency decimal places", () => {
      cy.visit("/settings/currencies");
      cy.get('[data-testid="currency-row"]').first().click();

      cy.get('button:contains("Edit")').click();

      cy.get('input[placeholder*="Decimal Places"]').clear().type("2");

      cy.get('button:contains("Save Changes")').click();
      cy.contains("Currency updated").should("be.visible");
    });
  });

  describe("Exchange Rates", () => {
    it("should view current exchange rates", () => {
      cy.visit("/settings/exchange-rates");

      cy.get('[data-testid="rate-row"]').should("have.length.greaterThan", 0);

      cy.get('[data-testid="rate-row"]')
        .first()
        .within(() => {
          cy.contains("AED").should("be.visible");
          cy.contains(/\\d+/).should("be.visible"); // Rate value
        });
    });

    it("should add manual exchange rate", () => {
      cy.visit("/settings/exchange-rates");

      cy.get('button:contains("Add Rate")').click();

      cy.get('select[name="From Currency"]').select("AED");
      cy.get('select[name="To Currency"]').select("USD");

      cy.get('input[placeholder*="Rate"]').type("0.27");
      cy.get('input[placeholder*="Effective Date"]').type("2024-01-01");

      cy.get('button:contains("Add Rate")').click();
      cy.contains("Exchange rate added").should("be.visible");
    });

    it("should update exchange rate", () => {
      cy.visit("/settings/exchange-rates");
      cy.get('[data-testid="rate-row"]').first().click();

      cy.get('button:contains("Edit")').click();

      cy.get('input[placeholder*="Rate"]').clear().type("0.28");

      cy.get('button:contains("Save Changes")').click();
      cy.contains("Exchange rate updated").should("be.visible");
    });

    it("should set rate effective date", () => {
      cy.visit("/settings/exchange-rates");
      cy.get('[data-testid="rate-row"]').first().click();

      cy.get('button:contains("Edit")').click();

      cy.get('input[placeholder*="Effective Date"]').clear().type("2024-02-01");

      cy.get('button:contains("Save Changes")').click();
      cy.contains("Exchange rate updated").should("be.visible");
    });

    it("should import exchange rates from API", () => {
      cy.visit("/settings/exchange-rates");

      cy.get('button:contains("Import Rates")').click();

      cy.get('button:contains("Fetch from API")').click();

      cy.contains("Rates imported").should("be.visible");
    });

    it("should view rate history", () => {
      cy.visit("/settings/exchange-rates");
      cy.get('[data-testid="rate-row"]').first().click();

      cy.get('button:contains("History")').click();

      cy.get('[data-testid="history-row"]').should("have.length.greaterThan", 0);
    });
  });

  describe("Regional Settings", () => {
    it("should configure VAT by country", () => {
      cy.visit("/settings/regional");

      cy.get('[data-testid="region-row"]').first().click();

      cy.get('button:contains("Edit")').click();

      cy.get('input[placeholder*="VAT Rate"]').clear().type("5");

      cy.get('button:contains("Save Changes")').click();
      cy.contains("Regional settings updated").should("be.visible");
    });

    it("should set default payment terms by region", () => {
      cy.visit("/settings/regional");

      cy.get('[data-testid="region-row"]').first().click();

      cy.get('button:contains("Edit")').click();

      cy.get('select[name="Payment Terms"]').select("NET30");

      cy.get('button:contains("Save Changes")').click();
      cy.contains("Regional settings updated").should("be.visible");
    });

    it("should configure shipping restrictions", () => {
      cy.visit("/settings/regional");

      cy.get('[data-testid="region-row"]').first().click();

      cy.get('button:contains("Edit")').click();

      cy.get('checkbox[name="allow-shipping"]').check();

      cy.get('button:contains("Save Changes")').click();
      cy.contains("Regional settings updated").should("be.visible");
    });

    it("should view regional tax configurations", () => {
      cy.visit("/settings/regional");

      cy.get('button:contains("Tax Settings")').click();

      cy.contains("Standard Tax Rate").should("be.visible");
      cy.contains("Reduced Tax Rate").should("be.visible");
      cy.contains("Zero-Rated").should("be.visible");
    });
  });

  describe("Currency Conversion", () => {
    it("should convert amount between currencies", () => {
      cy.visit("/settings/converter");

      cy.get('input[placeholder*="Amount"]').type("1000");

      cy.get('select[name="From"]').select("AED");
      cy.get('select[name="To"]').select("USD");

      // Verify conversion displayed
      cy.contains("USD").should("be.visible");
      cy.contains(/\\d+/).should("be.visible"); // Converted amount
    });

    it("should apply exchange rate to invoice", () => {
      cy.visit("/invoices");
      cy.get('button:contains("Create Invoice")').click();

      cy.get('input[placeholder*="Select customer"]').type("Customer");
      cy.get('[role="option"]').first().click();

      // Set currency
      cy.get('select[name="Currency"]').select("USD");

      cy.get('button:contains("Add Line Item")').click();
      cy.get('input[placeholder*="Product"]').type("SS-304");
      cy.get('[role="option"]').first().click();

      cy.get('input[placeholder*="Quantity"]').type("100");
      cy.get('input[placeholder*="Unit Price"]').type("50");

      // Verify total shows in selected currency
      cy.contains("USD").should("be.visible");

      cy.get('button:contains("Create Invoice")').click();
      cy.contains("Invoice created").should("be.visible");
    });
  });

  describe("Country & Currency Search & Filter", () => {
    it("should filter countries by status", () => {
      cy.visit("/settings/countries");

      cy.get('select[name="Status"]').select("ACTIVE");

      cy.get('[data-testid="country-row"]').should("have.length.greaterThan", 0);
    });

    it("should filter currencies by status", () => {
      cy.visit("/settings/currencies");

      cy.get('select[name="Status"]').select("ACTIVE");

      cy.get('[data-testid="currency-row"]').should("have.length.greaterThan", 0);
    });

    it("should search exchange rates by currency pair", () => {
      cy.visit("/settings/exchange-rates");

      cy.get('input[placeholder*="Search"]').type("AED/USD");

      cy.wait(500);
      cy.get('[data-testid="rate-row"]').should("have.length.greaterThan", 0);
    });
  });

  describe("Country & Currency Analytics", () => {
    it("should view country/currency metrics", () => {
      cy.visit("/settings/countries");

      cy.get('button:contains("Analytics")').click();

      cy.contains("Total Countries").should("be.visible");
      cy.contains("Active Currencies").should("be.visible");
      cy.contains("Exchange Rates").should("be.visible");
    });

    it("should export country configuration", () => {
      cy.visit("/settings/countries");

      cy.get('button:contains("Export")').click();
      cy.get('select[name="Format"]').select("CSV");

      cy.get('button:contains("Export")').click();
      cy.readFile("cypress/downloads/countries-*.csv").should("exist");
    });

    it("should export exchange rates", () => {
      cy.visit("/settings/exchange-rates");

      cy.get('button:contains("Export")').click();
      cy.get('select[name="Format"]').select("CSV");

      cy.get('button:contains("Export")').click();
      cy.readFile("cypress/downloads/exchange-rates-*.csv").should("exist");
    });
  });
});
