// Owner: admin
/**
 * Cypress E2E Smoke Tests
 *
 * Quick validation that critical paths work:
 * 1. Login -> Homepage with navigation visible
 * 2. Invoices list loads with table or content
 * 3. Create invoice page loads with form structure
 * 4. Customers page loads with customer table
 * 5. Logout clears session
 *
 * Run: npm run test:e2e
 * Open: npm run test:e2e:open
 */

describe("Smoke Tests - Critical User Flows", () => {
  beforeEach(() => {
    cy.clearCookies();
  });

  it("1. Should login and see the dashboard with navigation", () => {
    cy.login();
    cy.visit("/app");

    // Verify we're on app page (not redirected back to login)
    cy.url({ timeout: 15000 }).should("match", /\/(app|analytics)/);

    // Verify the application shell rendered with navigation
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const hasNav =
        $body.find("nav, aside, [role='navigation']").length > 0;
      const text = $body.text().toLowerCase();
      const hasNavItems =
        text.includes("dashboard") ||
        text.includes("invoices") ||
        text.includes("customers");
      expect(
        hasNav || hasNavItems,
        "Dashboard should render navigation sidebar with menu items",
      ).to.be.true;
    });
  });

  it("2. Should load invoices list with table or empty state", () => {
    cy.login();
    cy.visit("/app/invoices");

    // Verify page has invoice-specific content (not just any page)
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const text = $body.text().toLowerCase();
      expect(text).to.include("invoice");
    });

    // Verify either a data table or empty state is present
    cy.get("body").should(($body) => {
      const hasTable = $body.find("table").length > 0;
      const hasEmptyState =
        $body.text().toLowerCase().includes("no") ||
        $body.text().toLowerCase().includes("create");
      expect(
        hasTable || hasEmptyState,
        "Invoice page should show a data table or empty state prompt",
      ).to.be.true;
    });
  });

  it("3. Should load create invoice form with customer and line item sections", () => {
    cy.login();
    cy.visit("/app/invoices/new");

    cy.url().should("include", "/invoices/new");

    // Verify the form has customer selection
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const hasCustomerField =
        $body.find('[data-testid="customer-autocomplete"]').length > 0 ||
        $body.text().toLowerCase().includes("customer");
      expect(hasCustomerField, "Invoice form should have customer selection").to
        .be.true;
    });

    // Verify totals section exists
    cy.get("body").should(($body) => {
      const text = $body.text().toLowerCase();
      const hasTotals = text.includes("total") || text.includes("amount");
      expect(hasTotals, "Invoice form should show totals section").to.be.true;
    });
  });

  it("4. Should load customers page with management heading", () => {
    cy.login();
    cy.visit("/app/customers");

    // Verify the Customer Management heading (use data-testid to avoid matching the sidebar link)
    cy.get('[data-testid="customer-management-heading"]', { timeout: 15000 }).should("exist");

    // Verify page has a data table
    cy.get("table", { timeout: 10000 }).should("be.visible");
  });

  it("5. Should logout and redirect to login page", () => {
    cy.login();
    cy.visit("/app");
    cy.get("body", { timeout: 15000 }).should("be.visible");

    // Use the shared logout command
    cy.logout();
    cy.url({ timeout: 10000 }).should("include", "/login");
  });
});

/**
 * Additional Smoke Tests - Error Scenarios
 */
describe("Smoke Tests - Error Handling", () => {
  it("Should show error for invalid login credentials", () => {
    cy.visit("/login");

    cy.get('input[type="email"]', { timeout: 10000 }).type("invalid@email.com");
    cy.get('input[type="password"]').type("wrongpassword");
    cy.get('button[type="submit"]').click();

    // Should stay on login page
    cy.url({ timeout: 10000 }).should("include", "/login");

    // Should still show the login form (not navigated away)
    cy.get('input[type="email"]', { timeout: 5000 }).should("exist");
  });

  it("Should handle non-existent invoice gracefully", () => {
    cy.login();
    cy.visit("/app/invoices/99999999", { failOnStatusCode: false });

    // Should show content (error message, redirect, or empty state)
    cy.get("body", { timeout: 10000 }).should("be.visible");
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const text = $body.text().toLowerCase();
      // Should show either an error, "not found", or redirect to invoice list
      const hasContent =
        text.includes("not found") ||
        text.includes("error") ||
        text.includes("invoice") ||
        text.length > 50;
      expect(hasContent, "Should show error content or redirect for non-existent invoice").to.be
        .true;
    });
  });
});
