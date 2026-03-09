// Owner: finance
/**
 * Exchange Rate Management E2E Tests
 *
 * Tests exchange rate configuration:
 * - View rates list
 * - Rate display and columns
 * - Add/manage rate controls
 *
 * Route: /app/exchange-rates
 */

describe("Exchange Rate Management - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
    cy.interceptAPI("GET", "/api/exchange-rates*", "getExchangeRates");
    cy.visit("/app/exchange-rates");
  });

  describe("Page Load", () => {
    it("should load the exchange rates page with heading", () => {
      cy.verifyPageLoads("Exchange", "/app/exchange-rates");
    });

    it("should display exchange rates in a table or list", () => {
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.get("table, [data-testid*='exchange-rate'], [data-testid*='rate-list']", {
        timeout: 10000,
      }).should("exist");
    });
  });

  describe("Rate Display", () => {
    it("should show currency pair columns", () => {
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.get("body").should(($body) => {
        const text = $body.text().toUpperCase();
        const hasCurrencyInfo =
          text.includes("AED") ||
          text.includes("USD") ||
          text.includes("EUR") ||
          text.includes("CURRENCY");
        expect(hasCurrencyInfo, "Should display currency information").to.be.true;
      });
    });

    it("should display rate values", () => {
      cy.get("body", { timeout: 15000 }).should("be.visible");
      // Exchange rates should show numeric values
      cy.get("body").should(($body) => {
        const text = $body.text();
        const hasNumericRates = /\d+\.\d+/.test(text);
        expect(hasNumericRates, "Should display numeric rate values").to.be.true;
      });
    });
  });

  describe("Rate Management Controls", () => {
    it("should have a button to add new exchange rate", () => {
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.get("button").should("have.length.greaterThan", 0);
      // Look for add/create button
      cy.get("body").then(($body) => {
        const hasAddButton =
          $body.find("button:contains('Add')").length > 0 ||
          $body.find("button:contains('Create')").length > 0 ||
          $body.find("button:contains('New')").length > 0 ||
          $body.find("[data-testid*='add'], [data-testid*='create']").length > 0;
        expect(hasAddButton, "Should have an add/create button").to.be.true;
      });
    });

    it("should have effective date information for rates", () => {
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.get("body").should(($body) => {
        const text = $body.text().toLowerCase();
        const hasDateInfo =
          text.includes("date") ||
          text.includes("effective") ||
          /\d{4}-\d{2}-\d{2}/.test($body.text()) ||
          /\d{2}\/\d{2}\/\d{4}/.test($body.text());
        expect(hasDateInfo, "Should show date information for rates").to.be.true;
      });
    });
  });
});
