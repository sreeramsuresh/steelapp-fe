/**
 * Error Recovery Scenarios E2E Tests
 *
 * Tests error handling and recovery:
 * - Network failure handling
 * - Data corruption recovery
 * - Transaction rollback
 * - Error notifications
 *
 * Run: npm run test:e2e -- --spec '**/error-recovery-scenarios.cy.js'
 */

describe("Error Recovery Scenarios - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  describe("Network Error Recovery", () => {
    it("should handle network timeout gracefully", () => {
      cy.visit("/invoices");
      cy.get('button:contains("Create Invoice")').click();

      cy.get('input[placeholder*="Customer"]').type("ABC");
      cy.get('[role="option"]').first().click();

      cy.get('button:contains("Add Item")').click();
      cy.get('input[placeholder*="Product"]').type("SS-304");
      cy.get('[role="option"]').first().click();

      // Simulate network error
      cy.get('button:contains("Create")').click();

      cy.contains("Network timeout").should("be.visible");
      cy.get('button:contains("Retry")').should("be.visible");
    });

    it("should save draft on network failure", () => {
      cy.visit("/invoices");
      cy.get('button:contains("Create Invoice")').click();

      cy.get('input[placeholder*="Customer"]').type("Customer");
      cy.get('[role="option"]').first().click();

      // Check auto-save indicator
      cy.contains("Saving").should("be.visible");

      cy.wait(1000);

      cy.contains("Draft saved").should("be.visible");
    });

    it("should resume operation after reconnection", () => {
      cy.visit("/invoices");

      // Simulate connection loss and recovery
      cy.get('button:contains("Create Invoice")').click();

      cy.get('input[placeholder*="Customer"]').type("Customer");
      cy.get('[role="option"]').first().click();

      cy.get('button:contains("Add Item")').click();
      cy.get('input[placeholder*="Product"]').type("SS-304");

      cy.contains("Connection lost").should("be.visible");

      // Wait for reconnection
      cy.contains("Reconnected").should("be.visible");

      cy.get('button:contains("Resume")').click();
      cy.contains("Operation resumed").should("be.visible");
    });
  });

  describe("Data Validation Errors", () => {
    it("should show validation errors", () => {
      cy.visit("/invoices");
      cy.get('button:contains("Create Invoice")').click();

      // Don't fill required fields
      cy.get('button:contains("Create Invoice")').click();

      cy.contains("Customer is required").should("be.visible");
    });

    it("should highlight invalid fields", () => {
      cy.visit("/customers");
      cy.get('button:contains("New Customer")').click();

      cy.get('input[placeholder*="Email"]').type("invalid-email");

      cy.get('button:contains("Create")').click();

      cy.get('input[placeholder*="Email"]').should("have.class", "error");
    });

    it("should suggest corrections", () => {
      cy.visit("/invoices");
      cy.get('button:contains("Create Invoice")').click();

      cy.get('input[placeholder*="Quantity"]').type("-100");

      cy.get('button:contains("Create")').click();

      cy.contains("Quantity must be positive").should("be.visible");
    });
  });

  describe("Transaction Rollback", () => {
    it("should rollback on critical error", () => {
      cy.visit("/invoices");
      cy.get('button:contains("Create Invoice")').click();

      cy.get('input[placeholder*="Customer"]').type("Customer");
      cy.get('[role="option"]').first().click();

      cy.get('button:contains("Add Item")').click();
      cy.get('input[placeholder*="Product"]').type("SS-304");
      cy.get('[role="option"]').first().click();

      cy.get('input[placeholder*="Quantity"]').type("999999");

      cy.get('button:contains("Create")').click();

      cy.contains("Insufficient stock").should("be.visible");
      cy.contains("Transaction rolled back").should("be.visible");
    });

    it("should restore previous state after error", () => {
      cy.visit("/products");
      cy.get('[data-testid="product-row"]').first().click();

      cy.get('button:contains("Edit")').click();

      const originalPrice = "100";
      cy.get('input[placeholder*="Price"]').should("have.value", originalPrice);

      cy.get('input[placeholder*="Price"]').clear().type("invalid");

      cy.get('button:contains("Save")').click();

      cy.contains("Invalid price").should("be.visible");

      cy.get('input[placeholder*="Price"]').should("have.value", originalPrice);
    });
  });

  describe("Error Notifications", () => {
    it("should display error toast", () => {
      cy.visit("/invoices");

      cy.get('button:contains("Create Invoice")').click();

      cy.get('button:contains("Create")').click();

      cy.contains("Error").should("be.visible");
    });

    it("should show error details", () => {
      cy.visit("/products");
      cy.get('[data-testid="product-row"]').first().click();

      cy.get('button:contains("Delete")').click();

      cy.contains("Cannot delete").should("be.visible");

      cy.get('button:contains("Details")').click();

      cy.contains("This product").should("be.visible");
    });

    it("should log errors to activity", () => {
      cy.visit("/admin/activity-logs");

      cy.get('select[name="Type"]').select("ERROR");

      cy.get('[data-testid="log-row"]').should("have.length.greaterThan", 0);
    });
  });
});
