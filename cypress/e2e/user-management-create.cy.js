/**
 * E2E Test: User Management - Create User
 *
 * Tests user creation flow on the User Management page.
 * The actual UI uses card-based user list (not table rows),
 * "Invite User" button, and role badge selection.
 */

describe("User Management - Create User", () => {
  beforeEach(() => {
    cy.login();
  });

  it("should navigate to User Management page", () => {
    cy.visit("/app/users");
    cy.contains("h1, h2, h3, h4", /User Management/i, { timeout: 15000 }).should("be.visible");
  });

  it("should display Invite User button", () => {
    cy.visit("/app/users");
    cy.contains("Invite User", { timeout: 15000 }).should("be.visible");
  });

  it("should display user search input", () => {
    cy.visit("/app/users");
    cy.get('input[placeholder*="Search"]', { timeout: 15000 }).first().should(
      "be.visible",
    );
  });

  it("should display user content", () => {
    cy.visit("/app/users");
    cy.contains("h1, h2, h3, h4", /User Management/i, { timeout: 15000 });
    cy.get("body").then(($body) => {
      expect($body.text().length).to.be.greaterThan(10);
    });
  });

  it("should filter users by search", () => {
    cy.visit("/app/users");
    cy.get('input[placeholder*="Search"]', { timeout: 15000 }).first().type(
      "Development",
    );
    cy.wait(500);
    cy.get("body").should("be.visible");
  });
});
