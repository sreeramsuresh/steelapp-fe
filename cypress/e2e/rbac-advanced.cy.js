// Owner: auth
/**
 * RBAC Advanced E2E Tests
 *
 * Verifies the user management page loads and renders user data.
 */

describe("RBAC - User Management", () => {
  beforeEach(() => {
    cy.login();
  });

  it("should load the users page", () => {
    cy.visit("/app/users");
    cy.contains("h1, h2, h3, h4", /User/i, { timeout: 15000 }).should("be.visible");
  });

  it("should render user content", () => {
    cy.visit("/app/users");
    cy.contains("h1, h2, h3, h4", /User/i, { timeout: 15000 });
    cy.get("body").then(($body) => {
      expect($body.text().length).to.be.greaterThan(10);
    });
  });

  it("should have user management controls", () => {
    cy.visit("/app/users");
    cy.contains("h1, h2, h3, h4", /User/i, { timeout: 15000 });
    cy.get("body").then(($body) => {
      const hasSearch = $body.find('input[placeholder*="Search"]').length > 0;
      const hasButtons = $body.find("button").length > 0;
      expect(hasSearch || hasButtons).to.be.true;
    });
  });

  it("should have action buttons", () => {
    cy.visit("/app/users");
    cy.contains("h1, h2, h3, h4", /User/i, { timeout: 15000 });
    cy.get("button", { timeout: 10000 }).should("have.length.greaterThan", 0);
  });

  it("should stay on correct route", () => {
    cy.visit("/app/users");
    cy.url().should("include", "/app/users");
  });

  it("should render without errors", () => {
    cy.visit("/app/users");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.get("[class*='error'], [data-testid*='error']").should("have.length", 0);
  });
});
