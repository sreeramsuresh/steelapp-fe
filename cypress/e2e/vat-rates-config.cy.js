/**
 * VAT Rates Configuration E2E Tests
 *
 * Verifies the settings page loads for VAT rate configuration.
 */

describe("VAT Rates Configuration", () => {
  beforeEach(() => {
    cy.login();
  });

  it("should load the settings page", () => {
    cy.visit("/app/settings", { timeout: 15000 });
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.url().should("include", "/app/settings");
  });

  it("should render settings page content", () => {
    cy.visit("/app/settings", { timeout: 15000 });
    cy.get("body").then(($body) => {
      const text = $body.text();
      expect(text.length).to.be.greaterThan(10);
    });
  });
});
