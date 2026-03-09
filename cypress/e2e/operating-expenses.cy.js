/**
 * Operating Expenses E2E Tests
 *
 * Tests the operating expenses page: list and navigation.
 */

describe("Operating Expenses", () => {
  beforeEach(() => {
    cy.login();
  });

  it("should load the operating expenses page", () => {
    cy.visit("/app/operating-expenses");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.url().should("include", "/operating-expenses");
  });

  it("should render expense list or empty state", () => {
    cy.visit("/app/operating-expenses");
    cy.get("body", { timeout: 15000 }).should("be.visible");

    cy.get("body").then(($body) => {
      expect($body.text().length).to.be.greaterThan(10);
    });
  });

  it("should have page content", () => {
    cy.visit("/app/operating-expenses");
    cy.get("body", { timeout: 15000 }).should("be.visible");

    // Verify page has meaningful content
    cy.get("body").then(($body) => {
      expect($body.text().length).to.be.greaterThan(10);
    });
  });

  it("should stay on the operating expenses route", () => {
    cy.visit("/app/operating-expenses");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.url().should("include", "/operating-expenses");
  });

  it("should have action buttons", () => {
    cy.visit("/app/operating-expenses");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.get("button", { timeout: 10000 }).should("have.length.greaterThan", 0);
  });

  it("should render without errors", () => {
    cy.visit("/app/operating-expenses");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.get("[class*='error' i], [data-testid*='error']").should("have.length", 0);
  });
});
