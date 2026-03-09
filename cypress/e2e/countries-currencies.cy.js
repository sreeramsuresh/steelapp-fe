/**
 * Countries & Currencies E2E Tests
 *
 * Verifies the settings page loads for countries and currencies management.
 */

describe("Countries & Currencies", () => {
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

  it("should have page content beyond the heading", () => {
    cy.visit("/app/settings", { timeout: 15000 });
    cy.get("body").then(($body) => {
      expect($body.text().length).to.be.greaterThan(50);
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

  it("should not display an error state", () => {
    cy.visit("/app/settings", { timeout: 15000 });
    cy.get("body", { timeout: 10000 }).should("be.visible");
    cy.contains("Something went wrong").should("not.exist");
  });
});
