/**
 * Material Certificates E2E Tests
 *
 * Verifies the inventory page loads for material certificate review.
 */

describe("Material Certificates - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  it("should load the inventory page", () => {
    cy.visit("/app/inventory");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.url().should("include", "/app/inventory");
  });

  it("should display inventory heading", () => {
    cy.visit("/app/inventory");
    cy.get("h1, h2, h3", { timeout: 15000 }).should("exist");
  });

  it("should render page without crashing", () => {
    cy.visit("/app/inventory");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.get("body").then(($body) => {
      const text = $body.text();
      expect(text.length).to.be.greaterThan(10);
    });
  });
});
