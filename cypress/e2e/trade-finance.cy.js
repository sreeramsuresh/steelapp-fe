// Owner: trade
/**
 * Trade Finance E2E Tests
 *
 * Verifies the finance page loads and renders content.
 */

describe("Trade Finance", () => {
  beforeEach(() => {
    cy.login();
  });

  it("should load the finance page", () => {
    cy.visit("/app/finance", { timeout: 15000 });
    cy.contains("Finance", { timeout: 15000 }).should("be.visible");
  });

  it("should render page content after load", () => {
    cy.visit("/app/finance", { timeout: 15000 });
    cy.get("body").should("not.be.empty");
    cy.url().should("include", "/app/finance");
  });

  it("should have page content beyond the heading", () => {
    cy.visit("/app/finance", { timeout: 15000 });
    cy.get("body").then(($body) => {
      expect($body.text().length).to.be.greaterThan(10);
    });
  });

  it("should have action buttons", () => {
    cy.visit("/app/finance", { timeout: 15000 });
    cy.get("button", { timeout: 10000 }).should("have.length.greaterThan", 0);
  });

  it("should have clickable navigation or tab elements", () => {
    cy.visit("/app/finance", { timeout: 15000 });
    cy.get("a, button, [role='tab']", { timeout: 10000 }).should("have.length.greaterThan", 1);
  });

  it("should not display an error state", () => {
    cy.visit("/app/finance", { timeout: 15000 });
    cy.get("body", { timeout: 10000 }).should("be.visible");
    cy.get("body").then(($body) => {
      const text = $body.text().toLowerCase();
      const hasError = text.includes("something went wrong") || text.includes("error occurred");
      expect(hasError, "Page should not display an error state").to.be.false;
    });
  });
});
