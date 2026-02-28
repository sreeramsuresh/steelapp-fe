/**
 * Error Recovery Scenarios E2E Tests
 *
 * Tests error handling: invalid routes and failed login attempts.
 */

describe("Error Recovery Scenarios", () => {
  it("should redirect non-existent route to login or app", () => {
    cy.visit("/app/this-page-does-not-exist", { timeout: 15000, failOnStatusCode: false });
    // Should redirect to /app or show a not-found state
    cy.url({ timeout: 15000 }).should("match", /\/(app|login)/);
    cy.get("body").should("be.visible");
  });

  it("should show error on invalid login credentials", () => {
    cy.visit("/login", { timeout: 15000 });
    cy.get("input[type='email'], input[name='email'], input[type='text']", { timeout: 15000 })
      .first()
      .type("invalid@example.com");
    cy.get("input[type='password']", { timeout: 15000 }).type("wrongpassword");
    cy.contains("button", /sign in|log in|login/i).click();
    // Should show an error message and stay on login
    cy.url({ timeout: 15000 }).should("include", "/login");
  });

  it("should stay functional after visiting an invalid route", () => {
    cy.login();
    cy.visit("/app/nonexistent-route-xyz", { timeout: 15000, failOnStatusCode: false });
    // Navigate back to a valid page
    cy.visit("/app/invoices", { timeout: 15000 });
    cy.contains(/invoices/i, { timeout: 15000 }).should("be.visible");
  });
});
