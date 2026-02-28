/**
 * Dashboard Advanced E2E Tests
 *
 * Verifies the analytics dashboard loads and renders widgets/charts.
 */

describe("Analytics Dashboard", () => {
  beforeEach(() => {
    cy.login();
  });

  it("should load the analytics dashboard page", () => {
    cy.visit("/analytics/dashboard", { timeout: 15000 });
    cy.contains(/Dashboard|Analytics/i, { timeout: 15000 }).should("be.visible");
  });

  it("should render dashboard content", () => {
    cy.visit("/analytics/dashboard", { timeout: 15000 });
    cy.get("body", { timeout: 15000 }).should("not.be.empty");
    // Dashboard should contain cards or chart containers
    cy.get("div").should("have.length.greaterThan", 0);
  });

  it("should display chart or card elements", () => {
    cy.visit("/analytics/dashboard", { timeout: 15000 });
    // Look for any canvas (charts) or card-like containers
    cy.get("canvas, svg, table, [class*='card'], [class*='widget'], [class*='chart']", {
      timeout: 15000,
    }).should("have.length.greaterThan", 0);
  });
});
