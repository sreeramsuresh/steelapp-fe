/**
 * Categories & Policies E2E Tests
 *
 * Verifies the settings page loads for categories and policies management.
 */

describe("Categories & Policies", () => {
  beforeEach(() => {
    cy.login();
  });

  it("should load the settings page", () => {
    cy.visit("/app/settings", { timeout: 15000 });
    cy.contains("h1, h2, h3, h4", /Settings/i, { timeout: 15000 }).should("be.visible");
  });

  it("should render settings page content", () => {
    cy.visit("/app/settings", { timeout: 15000 });
    cy.get("body").should("not.be.empty");
    cy.url().should("include", "/app/settings");
  });
});
