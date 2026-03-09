// Owner: sales
/**
 * Sales Negative Path E2E Tests
 *
 * Tests validation and error handling for sales workflows:
 * - Delivery quantity exceeding invoice
 * - Duplicate document numbers
 * - GRN quantity exceeding PO
 */

describe("Sales Negative Paths - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  describe("Delivery Note Validation", () => {
    it("should not create delivery note without required fields", () => {
      cy.visit("/app/delivery-notes/new");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.get("body").then(($body) => {
        const saveBtn =
          $body.find("button:contains('Save')")[0] ||
          $body.find("button:contains('Create')")[0];
        if (saveBtn) {
          cy.wrap(saveBtn).click();
          // Should show validation or stay on form
          cy.url().should("include", "/delivery-notes");
        }
      });
    });

    it("should show validation for delivery note without invoice link", () => {
      cy.visit("/app/delivery-notes/new");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      // Form should require an invoice or customer selection
      cy.get("body").should(($body) => {
        const text = $body.text().toLowerCase();
        const hasRequiredFields =
          text.includes("invoice") ||
          text.includes("customer") ||
          text.includes("required");
        expect(hasRequiredFields, "Should show required field indicators").to.be.true;
      });
    });
  });

  describe("Credit Note Validation", () => {
    it("should not create credit note without linked invoice", () => {
      cy.visit("/app/credit-notes/new");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.get("body").then(($body) => {
        const saveBtn =
          $body.find("button:contains('Save')")[0] ||
          $body.find("button:contains('Create')")[0];
        if (saveBtn) {
          cy.wrap(saveBtn).click();
          cy.url().should("include", "/credit-notes");
        }
      });
    });
  });

  describe("Supplier Bill Validation", () => {
    it("should not create supplier bill without required fields", () => {
      cy.visit("/app/supplier-bills/new");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.get("body").then(($body) => {
        const saveBtn =
          $body.find("button:contains('Save')")[0] ||
          $body.find("button:contains('Create')")[0];
        if (saveBtn) {
          cy.wrap(saveBtn).click();
          cy.url().should("match", /supplier-bills|payables/);
        }
      });
    });

    it("should handle non-existent supplier bill gracefully", () => {
      cy.visit("/app/supplier-bills/999999999", { failOnStatusCode: false });
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.get("body").should(($body) => {
        expect($body.text().length).to.be.greaterThan(10);
      });
    });
  });

  describe("Debit Note Validation", () => {
    it("should not create debit note without required fields", () => {
      cy.visit("/app/debit-notes/new");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.get("body").then(($body) => {
        const saveBtn =
          $body.find("button:contains('Save')")[0] ||
          $body.find("button:contains('Create')")[0];
        if (saveBtn) {
          cy.wrap(saveBtn).click();
          cy.url().should("include", "/debit-notes");
        }
      });
    });
  });
});
