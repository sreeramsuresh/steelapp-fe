/**
 * Commissions Dashboard E2E Tests
 *
 * Verifies the commission dashboard page loads and renders content.
 */

describe("Commissions Dashboard", () => {
  beforeEach(() => {
    cy.login();
  });

  it("should load the commission dashboard page", () => {
    cy.visit("/app/commission-dashboard", { timeout: 15000 });
    cy.contains("Commission", { timeout: 15000 }).should("be.visible");
  });

  it("should render page content after load", () => {
    cy.visit("/app/commission-dashboard", { timeout: 15000 });
    cy.get("body").should("not.be.empty");
    cy.url().should("include", "/app/commission-dashboard");
  });

  it("should display page content", () => {
    cy.visit("/app/commission-dashboard", { timeout: 15000 });
    cy.contains("Commission", { timeout: 15000 }).should("be.visible");
    cy.get("h1, h2, h3").should("exist");
  });
});
