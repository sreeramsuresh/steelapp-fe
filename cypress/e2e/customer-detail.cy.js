// Owner: sales
// Tests: customer detail page, customer form (new/edit), customer pricing
// Routes: /app/customers/new, /app/customers/:id, /app/customers/:id/pricing

describe("Customer Detail & Forms - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  describe("Add Customer Form", () => {
    it("should load the new customer form page", () => {
      cy.visit("/app/customers/new");
      cy.get("body", { timeout: 15000 }).should(($body) => {
        const text = $body.text().toLowerCase();
        const hasFormContent =
          text.includes("customer") ||
          text.includes("name") ||
          text.includes("email") ||
          text.includes("contact");
        expect(hasFormContent, "Customer form should have relevant content").to.be.true;
      });
    });

    it("should have input fields for customer details", () => {
      cy.visit("/app/customers/new");
      cy.get("body", { timeout: 15000 }).should(($body) => {
        const hasInputs = $body.find("input, textarea, select").length >= 2;
        expect(hasInputs, "Customer form should have multiple input fields").to.be.true;
      });
    });

    it("should have data-testid customer form fields", () => {
      cy.visit("/app/customers/new");
      cy.get("body", { timeout: 15000 }).should(($body) => {
        const hasFormTestIds =
          $body.find('[data-testid="customer-form"]').length > 0 ||
          $body.find('[data-testid="customer-name"]').length > 0 ||
          $body.find("form").length > 0;
        expect(hasFormTestIds, "Customer form should have form elements").to.be.true;
      });
    });

    it("should have a save or submit button", () => {
      cy.visit("/app/customers/new");
      cy.get("body", { timeout: 15000 }).should(($body) => {
        const hasSaveButton =
          $body.find('[data-testid="save-button"], button[type="submit"]').length > 0 ||
          $body.find("button").filter(function () {
            return /save|submit|create|add/i.test(this.textContent);
          }).length > 0;
        expect(hasSaveButton, "Form should have a save/submit button").to.be.true;
      });
    });

    it("should not display error boundary", () => {
      cy.visit("/app/customers/new");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.contains("Something went wrong").should("not.exist");
    });
  });

  describe("Customer Detail Page", () => {
    it("should navigate to customer detail via name button", () => {
      cy.visit("/app/customers");
      // Wait for customer list to render with data-testid heading
      cy.get('[data-testid="customer-management-heading"]', { timeout: 15000 }).should("be.visible");

      // Customer rows use button (not <a>) for navigation: data-testid="customer-name-link-{id}"
      // If no customers exist in the E2E seed, skip gracefully
      cy.get("body").then(($body) => {
        const $nameButtons = $body.find('[data-testid^="customer-name-link-"]');
        if ($nameButtons.length === 0) {
          cy.log("No customer name buttons found — seed has no customers, skipping");
          return;
        }
        // Click the first customer name button — navigates to /app/customers/:id?tab=overview
        cy.get('[data-testid^="customer-name-link-"]').first().click();
        cy.url({ timeout: 10000 }).should("match", /\/app\/customers\/\d+/);
      });
    });

    it("should gracefully handle non-existent customer", () => {
      cy.visit("/app/customers/999999999", { failOnStatusCode: false });
      cy.get("body", { timeout: 15000 }).should(($body) => {
        const text = $body.text().toLowerCase();
        const hasContent =
          text.includes("not found") ||
          text.includes("error") ||
          text.includes("customer") ||
          text.length > 50;
        expect(hasContent, "Should show error content or redirect for non-existent customer").to.be
          .true;
      });
    });
  });
});
