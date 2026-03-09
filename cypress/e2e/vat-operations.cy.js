/**
 * VAT Operations E2E Tests
 *
 * Verifies the finance page loads for VAT operations.
 */

describe("VAT Operations", () => {
  beforeEach(() => {
    cy.login();
  });

  it("should load the finance page", () => {
    cy.visit("/app/finance", { timeout: 15000 });
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.url().should("include", "/app/finance");
  });

  it("should render finance page content", () => {
    cy.visit("/app/finance", { timeout: 15000 });
    cy.get("body").then(($body) => {
      const text = $body.text();
      expect(text.length).to.be.greaterThan(10);
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

  it("should display a heading element", () => {
    cy.visit("/app/finance", { timeout: 15000 });
    cy.get("h1, h2, h3, h4", { timeout: 10000 }).should("exist");
  });

  it("should not display an error state", () => {
    cy.visit("/app/finance", { timeout: 15000 });
    cy.get("body", { timeout: 10000 }).should("be.visible");
    cy.contains("Something went wrong").should("not.exist");
  });
});
