/**
 * Advanced Error Recovery E2E Tests
 *
 * Tests error handling and recovery for invalid routes and bad login.
 */

describe("Advanced Error Recovery", () => {
  it("should handle visiting a non-existent app route", () => {
    cy.login();
    cy.visit("/app/does-not-exist-12345", { timeout: 15000, failOnStatusCode: false });
    // Should redirect or show the app shell
    cy.url({ timeout: 15000 }).should("include", "/app");
    cy.get("body").should("be.visible");
  });

  it("should reject login with wrong credentials", () => {
    cy.visit("/login", { timeout: 15000 });
    cy.get("input[type='email'], input[name='email'], input[type='text']", { timeout: 15000 })
      .first()
      .type("bad@user.com");
    cy.get("input[type='password']", { timeout: 15000 }).type("badpass123");
    cy.contains("button", /sign in|log in|login/i).click();
    cy.url({ timeout: 15000 }).should("include", "/login");
  });

  it("should recover and load a valid page after an error", () => {
    cy.login();
    cy.visit("/app/no-such-page", { timeout: 15000, failOnStatusCode: false });
    cy.visit("/app/customers", { timeout: 15000 });
    cy.get("table", { timeout: 15000 }).should("exist");
    cy.get("tbody tr").should("have.length.greaterThan", 0);
  });
});
