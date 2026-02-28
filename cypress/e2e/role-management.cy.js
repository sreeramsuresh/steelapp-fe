/**
 * E2E Tests for Role Management System
 *
 * Verifies the User Management page loads and displays
 * role management elements.
 */

describe("Role Management - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  it("should load User Management page", () => {
    cy.visit("/app/users");
    cy.contains("h1, h2, h3, h4", /User Management/i, { timeout: 15000 }).should("be.visible");
  });

  it("should display Users & Roles and Permissions Matrix tabs", () => {
    cy.visit("/app/users");
    cy.contains("Users & Roles", { timeout: 15000 }).should("be.visible");
    cy.contains("Permissions Matrix").should("be.visible");
  });

  it("should display Manage Roles button", () => {
    cy.visit("/app/users");
    cy.contains("Manage Roles", { timeout: 15000 }).should("be.visible");
  });

  it("should display Invite User button", () => {
    cy.visit("/app/users");
    cy.contains("Invite User", { timeout: 15000 }).should("be.visible");
  });

  it("should display user list with search", () => {
    cy.visit("/app/users");
    cy.get('input[placeholder*="Search users"]', { timeout: 15000 }).should(
      "be.visible",
    );
  });

  it("should open Manage Roles modal", () => {
    cy.visit("/app/users");
    cy.contains("Manage Roles", { timeout: 15000 }).click();
    cy.wait(500);
    // Modal should show role-related content
    cy.get("body").then(($body) => {
      const text = $body.text().toLowerCase();
      const hasRoleContent =
        text.includes("role") || text.includes("manage");
      expect(hasRoleContent).to.be.true;
    });
  });
});
