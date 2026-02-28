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
      cy.contains("Customer Management", { timeout: 15000 }).should(
        "be.visible",
      );
    });

    it("should display the customer table with expected columns", () => {
      cy.visit("/app/customers");
      cy.contains("Customer Management", { timeout: 15000 });
      cy.get("table", { timeout: 10000 }).should("be.visible");
      cy.contains("Customer Name").should("be.visible");
      cy.contains("Email").should("be.visible");
      cy.contains("Phone").should("be.visible");
      cy.contains("Credit Limit").should("be.visible");
    });

    it("should display Add Customer and Upload Customers buttons", () => {
      cy.visit("/app/customers");
      cy.contains("Customer Management", { timeout: 15000 });
      cy.contains("Add Customer").should("be.visible");
      cy.contains("Upload Customers").should("be.visible");
    });
  });

  describe("Tabs and Filters", () => {
    it("should have Customer Profiles, Suppliers, and Analytics tabs", () => {
      cy.visit("/app/customers");
      cy.contains("Customer Management", { timeout: 15000 });
      cy.contains("Customer Profiles").should("be.visible");
      cy.contains("Suppliers").should("be.visible");
      cy.contains("Analytics").should("be.visible");
    });

    it("should switch to Suppliers tab", () => {
      cy.visit("/app/customers");
      cy.contains("Customer Management", { timeout: 15000 });
      cy.contains("Suppliers").click();
      // After clicking Suppliers tab, the page should update
      cy.get("table", { timeout: 10000 }).should("be.visible");
    });
  });

  describe("Search and Filter", () => {
    it("should have a search box for customers", () => {
      cy.visit("/app/customers");
      cy.contains("Customer Management", { timeout: 15000 });
      cy.get('input[placeholder*="Search customers"]').should("be.visible");
    });

    it("should filter results when typing in search", () => {
      cy.visit("/app/customers");
      cy.contains("Customer Management", { timeout: 15000 });
      cy.get('input[placeholder*="Search customers"]').type("test");
      // Wait for debounce and verify table still renders
      cy.wait(500);
      cy.get("table").should("be.visible");
    });
  });
});
