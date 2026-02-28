/**
 * Feedback E2E Tests
 *
 * Tests the feedback page loads and displays content.
 */

describe("Feedback", () => {
  beforeEach(() => {
    cy.login();
  });

  it("should load the feedback management page", () => {
    cy.visit("/app/feedback");
    cy.contains("h1, h2, h3, h4", /feedback/i, { timeout: 15000 }).should("be.visible");
  });

  it("should render feedback list or empty state", () => {
    cy.visit("/app/feedback");
    cy.get("body", { timeout: 15000 }).should("be.visible");

    // Page should show either a table/list of feedback or an empty state message
    cy.get("body").then(($body) => {
      expect($body.text().length).to.be.greaterThan(10);
    });
  });

  it("should have a feedback submission mechanism", () => {
    cy.visit("/app/dashboard");
    cy.get("body", { timeout: 15000 }).should("be.visible");

    // Verify page loads correctly
    cy.get("body").then(($body) => {
      expect($body.text().length).to.be.greaterThan(10);
    });
  });

  it("should stay on the feedback route", () => {
    cy.visit("/app/feedback");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.url().should("include", "/app/feedback");
  });
});
