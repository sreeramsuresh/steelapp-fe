/**
 * Concurrent User Workflows E2E Tests
 *
 * Tests multi-user scenarios and concurrency:
 * - Simultaneous transactions
 * - Lock conflict handling
 * - Data consistency
 * - Collaboration workflows
 *
 */

describe("Concurrent User Workflows - E2E Tests", () => {
  describe("Simultaneous Operations", () => {
    it("should handle concurrent invoice creation", () => {
      cy.visit("/app/invoices");
      cy.get('button:contains("Create Invoice")').click();

      cy.get('input[placeholder*="Customer"]').type("ABC Corp");
      cy.get('[role="option"]').first().click();

      cy.get('button:contains("Add Item")').click();
      cy.get('input[placeholder*="Product"]').type("SS-304");
      cy.get('[role="option"]').first().click();
      cy.get('input[placeholder*="Quantity"]').type("100");

      // Simulate concurrent save
      cy.get('button:contains("Create Invoice")').click();
      cy.contains("Invoice created").should("be.visible");
    });

    it("should handle lock timeouts gracefully", () => {
      cy.visit("/app/products");
      cy.get('[data-testid="product-row"]').first().click();

      cy.get('button:contains("Edit")').click();

      cy.get('input[placeholder*="Price"]').clear().type("100");

      // Simulate timeout
      cy.wait(5000);

      cy.get('button:contains("Save")').click();
      cy.contains("Save timeout").should("be.visible");
    });

    it("should merge concurrent edits", () => {
      cy.visit("/app/products");
      cy.get('[data-testid="product-row"]').first().click();

      cy.get('button:contains("Edit")').click();

      cy.get('input[placeholder*="Name"]').clear().type("New Name");

      // Simulate concurrent change detected
      cy.contains("Item was modified").should("be.visible");

      cy.get('button:contains("Refresh & Retry")').click();
      cy.contains("Changes merged").should("be.visible");
    });
  });

  describe("Collaboration Workflows", () => {
    it("should show other users editing same record", () => {
      cy.visit("/app/invoices");
      cy.get('[data-testid="invoice-row"]').first().click();

      cy.get('button:contains("Edit")').click();

      // Simulate other user editing
      cy.contains("Currently editing").should("be.visible");
      cy.contains("user@example.com").should("be.visible");
    });

    it("should prevent write conflicts", () => {
      cy.visit("/app/customers");
      cy.get('[data-testid="customer-row"]').first().click();

      cy.get('button:contains("Edit")').click();

      cy.get('input[placeholder*="Name"]').clear().type("Updated");

      // Simulate concurrent write
      cy.get('button:contains("Save")').click();

      cy.contains("Unable to save").should("be.visible");
    });

    it("should handle approval workflows", () => {
      cy.visit("/app/invoices");
      cy.get('[data-testid="invoice-row"][data-status="PENDING"]')
        .first()
        .click();

      cy.get('button:contains("Submit for Approval")').click();

      cy.contains("Awaiting approval from").should("be.visible");
    });
  });

  describe("Data Consistency", () => {
    it("should maintain stock consistency", () => {
      cy.visit("/app/inventory");
      cy.get('[data-testid="batch-row"]').first().click();

      cy.get('button:contains("Adjust Quantity")').click();

      cy.get('input[placeholder*="Quantity"]').type("-100");

      cy.get('button:contains("Apply")').click();

      // Verify consistency
      cy.contains("Stock level synchronized").should("be.visible");
    });

    it("should validate invoice totals during concurrent access", () => {
      cy.visit("/app/invoices");
      cy.get('[data-testid="invoice-row"]').first().click();

      cy.contains("Line Items Total").should("be.visible");
      cy.contains("Subtotal").should("be.visible");
      cy.contains("VAT").should("be.visible");
      cy.contains("Grand Total").should("be.visible");
    });
  });
});
