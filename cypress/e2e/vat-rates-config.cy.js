// Owner: finance
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

  it("should have action buttons", () => {
    cy.visit("/app/settings", { timeout: 15000 });
    cy.get("button", { timeout: 10000 }).should("have.length.greaterThan", 0);
  });

  it("should have clickable navigation or tab elements", () => {
    cy.visit("/app/settings", { timeout: 15000 });
    cy.get("a, button, [role='tab']", { timeout: 10000 }).should("have.length.greaterThan", 1);
  });

  it("should display a heading element", () => {
    cy.visit("/app/settings", { timeout: 15000 });
    cy.get("h1, h2, h3, h4", { timeout: 10000 }).should("exist");
  });

  it("should not display an error state", () => {
    cy.visit("/app/settings", { timeout: 15000 });
    cy.get("body", { timeout: 10000 }).should("be.visible");
    cy.contains("Something went wrong").should("not.exist");
  });
});
