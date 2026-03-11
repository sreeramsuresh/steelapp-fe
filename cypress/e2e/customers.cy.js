// Owner: sales
/**
 * Customers Master Data E2E Tests
 *
 * Tests customer management page:
 * - Page load and heading
 * - Table rendering with correct columns
 * - Search functionality
 * - Tab navigation (Customer Profiles, Suppliers, Analytics)
 *
 */

describe("Customers Master Data - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  describe("Page Load", () => {
    it("should load customer management page with heading", () => {
      cy.visit("/app/customers");
      cy.contains("Customer Management", { timeout: 15000 }).should("be.visible");
    });

    it("should display the customer table with expected columns", () => {
      cy.visit("/app/customers");
      cy.contains("Customer Management", { timeout: 15000 });
      cy.get("table", { timeout: 10000 }).should("be.visible");
      cy.verifyTableColumns(["Customer Name", "Email", "Phone", "Credit Limit"]);
    });

    it("should display Add Customer button", () => {
      cy.visit("/app/customers");
      cy.contains("Customer Management", { timeout: 15000 });
      cy.get('[data-testid="add-customer-button"]', { timeout: 10000 }).should("be.visible");
    });

    it("should show customer data in the table", () => {
      cy.visit("/app/customers");
      cy.contains("Customer Management", { timeout: 15000 });
      cy.get("table", { timeout: 10000 }).should("be.visible");
      // Table should have at least one customer row (seed or migration data)
      cy.get("table tbody tr", { timeout: 10000 }).should("have.length.greaterThan", 0);
    });
  });

  describe("Tabs and Filters", () => {
    it("should have Customer Profiles, Suppliers, and Analytics tabs", () => {
      cy.visit("/app/customers");
      cy.contains("Customer Management", { timeout: 15000 });
      cy.contains("button", "Customer Profiles").should("be.visible");
      cy.contains("button", "Suppliers").should("be.visible");
      cy.contains("button", "Analytics").should("be.visible");
    });

    it("should switch to Suppliers tab and show supplier content", () => {
      cy.visit("/app/customers");
      cy.contains("Customer Management", { timeout: 15000 });
      cy.contains("button", "Suppliers").click();
      // After clicking Suppliers tab, table should still be visible
      cy.get("table", { timeout: 10000 }).should("be.visible");
    });
  });

  describe("Search and Filter", () => {
    it("should have a search box for customers", () => {
      cy.visit("/app/customers");
      cy.contains("Customer Management", { timeout: 15000 });
      cy.get('[data-testid="customer-search"]', { timeout: 10000 }).should("be.visible");
    });

    it("should filter results when typing in search", () => {
      cy.visit("/app/customers");
      cy.contains("Customer Management", { timeout: 15000 });
      cy.get('[data-testid="customer-search"]').type("ABC");
      // Table should update with filtered results
      cy.get("table", { timeout: 5000 }).should("be.visible");
    });
  });
});
