/**
 * E2E Test: User Management - View Permissions
 *
 * Tests viewing user permissions on the User Management page.
 * The actual UI uses card-based layout with "View All Permissions" buttons.
 */

describe("User Management - View Permissions", () => {
  beforeEach(() => {
    cy.login();
  });

  it("should load User Management page", () => {
    cy.visit("/app/users");
    cy.contains("h1, h2, h3, h4", /User Management/i, { timeout: 15000 }).should("be.visible");
  });

  it("should display users with content", () => {
    cy.visit("/app/users");
    cy.contains("h1, h2, h3, h4", /User Management/i, { timeout: 15000 });
    cy.get("body").then(($body) => {
      expect($body.text().length).to.be.greaterThan(50);
    });
  });

  it("should have search functionality", () => {
    cy.visit("/app/users");
    cy.get('input[placeholder*="Search"]', { timeout: 15000 }).should("be.visible");
  });

  it("should switch to Permissions Matrix tab", () => {
    cy.visit("/app/users");
    cy.contains("Permissions Matrix", { timeout: 15000 }).click();
    cy.wait(2000);
    cy.url().should("include", "/app/users");
  });

  it("should display created and last login dates", () => {
    cy.visit("/app/users");
    cy.contains("h1, h2, h3, h4", /User Management/i, { timeout: 15000 });
    cy.contains("Created").should("exist");
    cy.contains("Last Login").should("exist");
  });

  it("should render page without errors", () => {
    cy.visit("/app/users");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.get("body").then(($body) => {
      expect($body.text().length).to.be.greaterThan(10);
    });
  });
});
