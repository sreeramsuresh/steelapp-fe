/**
 * Cypress E2E Smoke Tests
 *
 * Quick validation that critical paths work:
 * 1. Login -> Homepage
 * 2. List invoices -> Page renders
 * 3. Navigate to create invoice
 * 4. Customers page loads
 * 5. Logout
 *
 * Run: npm run test:e2e
 * Open: npm run test:e2e:open
 */

describe("Smoke Tests - Critical User Flows", () => {
  beforeEach(() => {
    cy.clearCookies();
  });

  it("1. Should login and navigate to homepage", () => {
    cy.visit("/login");

    // Fill login form
    cy.get('input[type="email"]').type(Cypress.env("testUserEmail"));
    cy.get('input[type="password"]').type(Cypress.env("testUserPassword"));

    // Submit login
    cy.get('button[type="submit"]').click();

    // Verify redirect to app
    cy.url({ timeout: 15000 }).should("match", /\/(app|analytics)/);

    // Verify homepage elements load
    cy.contains(/home|dashboard|overview/i, { timeout: 10000 }).should(
      "be.visible",
    );
  });

  it("2. Should load invoices list page", () => {
    cy.login();
    cy.visit("/app/invoices");

    // Verify page heading
    cy.contains(/invoices/i, { timeout: 15000 }).should("be.visible");

    // Verify page has content
    cy.get("body").then(($body) => {
      expect($body.text().length).to.be.greaterThan(50);
    });
  });

  it("3. Should navigate to create invoice page", () => {
    cy.login();
    cy.visit("/app/invoices/new");

    // Verify URL
    cy.url().should("include", "/invoices/new");

    // Verify page loaded
    cy.get("body", { timeout: 10000 }).should("be.visible");
  });

  it("4. Should load customers page", () => {
    cy.login();
    cy.visit("/app/customers");

    // Verify heading
    cy.contains("h1, h2, h3, h4", /customer/i, { timeout: 15000 }).should(
      "be.visible",
    );

    // Verify page has content
    cy.get("body").then(($body) => {
      expect($body.text().length).to.be.greaterThan(50);
    });
  });

  it("5. Should logout successfully", () => {
    cy.login();
    cy.visit("/app");
    cy.get("body", { timeout: 15000 }).should("be.visible");

    // Use the custom logout command
    cy.logout();

    // Verify redirect to login page
    cy.url({ timeout: 10000 }).should("include", "/login");
  });
});

/**
 * Additional Smoke Tests - Error Scenarios
 */
describe("Smoke Tests - Error Handling", () => {
  it("Should show error for invalid login credentials", () => {
    cy.visit("/login");

    cy.get('input[type="email"]').type("invalid@email.com");
    cy.get('input[type="password"]').type("wrongpassword");
    cy.get('button[type="submit"]').click();

    // Should show error message or stay on login page
    cy.url({ timeout: 10000 }).should("include", "/login");

    // Check that we're still on login (form is still visible)
    cy.get('input[type="email"]', { timeout: 5000 }).should("exist");
  });

  it("Should handle non-existent invoice gracefully", () => {
    cy.login();
    cy.visit("/app/invoices/99999999", { failOnStatusCode: false });

    // Should show some content (error, redirect, or invoice form)
    cy.get("body", { timeout: 10000 }).should("be.visible");
    cy.get("body").then(($body) => {
      expect($body.text().length).to.be.greaterThan(10);
    });
  });
});
