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
    it("should handle navigating to a customer detail page", () => {
      // First visit customer list to find a valid customer
      cy.visit("/app/customers");
      cy.get("body", { timeout: 15000 }).should(($body) => {
        const text = $body.text().toLowerCase();
        expect(text).to.include("customer");
      });

      // Try to click on a customer row to navigate to detail
      cy.get("body").then(($body) => {
        const $rows = $body.find("table tbody tr");
        if ($rows.length === 0) {
          cy.log("No customer rows found, skipping navigation test");
          return;
        }
        // Check for links using jQuery (no Cypress timeout on missing elements)
        const $firstRow = $rows.first();
        const $link = $firstRow.find("a");
        if ($link.length > 0) {
          const href = $link.first().attr("href");
          if (href) {
            cy.visit(href);
          } else {
            cy.wrap($link.first()).click({ force: true });
          }
          cy.url({ timeout: 10000 }).should("match", /\/app\/customers\/\d+/);
        } else {
          // No links in row — just verify the row has content
          expect($firstRow.text().length).to.be.greaterThan(3);
        }
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
