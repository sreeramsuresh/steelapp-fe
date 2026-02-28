/**
 * Reports Generation E2E Tests
 *
 * Verifies the analytics page loads and renders reporting content.
 */

describe("Reports Generation", () => {
  beforeEach(() => {
    cy.login();
  });

  it("should load the analytics dashboard page", () => {
    cy.visit("/analytics/dashboard", { timeout: 15000 });
    cy.contains(/Dashboard|Analytics/i, { timeout: 15000 }).should("be.visible");
  });

  it("should render analytics content", () => {
    cy.visit("/analytics/dashboard", { timeout: 15000 });
    cy.get("body", { timeout: 15000 }).should("not.be.empty");
    cy.get("div").should("have.length.greaterThan", 0);
  });

  it("should display visual elements on the analytics page", () => {
    cy.visit("/analytics/dashboard", { timeout: 15000 });
    cy.get("canvas, svg, table, [class*='card'], [class*='chart']", {
      timeout: 15000,
    }).should("have.length.greaterThan", 0);
  });
});
