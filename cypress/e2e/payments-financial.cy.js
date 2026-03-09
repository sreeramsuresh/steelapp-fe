/**
 * Payments & Financial Operations E2E Tests
 *
 * Tests that the receivables page loads and renders
 * payment-related content.
 */

describe("Payments & Financial Operations", () => {
  beforeEach(() => {
    cy.login();
    cy.visit("/app/receivables");
  });

  it("should load the receivables page with heading", () => {
    cy.contains(/receivable/i, { timeout: 15000 }).should("be.visible");
  });

  it("should render page content", () => {
    cy.contains(/receivable/i, { timeout: 15000 }).should("be.visible");
    cy.get("body").then(($body) => {
      const hasTable = $body.find("table").length > 0;
      const hasContent = $body.text().length > 100;
      expect(hasTable || hasContent).to.be.true;
    });
  });

  it("should stay on receivables route", () => {
    cy.contains(/receivable/i, { timeout: 15000 }).should("be.visible");
    cy.url().should("include", "/app/receivables");
  });

  it("should have action buttons", () => {
    cy.contains(/receivable/i, { timeout: 15000 });
    cy.get("button", { timeout: 10000 }).should("have.length.greaterThan", 0);
  });

  it("should have search or filter controls", () => {
    cy.contains(/receivable/i, { timeout: 15000 });
    cy.get('input[placeholder*="Search" i], input[type="search"], select, [role="combobox"], [data-testid*="search"], [data-testid*="filter"]', { timeout: 10000 })
      .should("have.length.greaterThan", 0);
  });

  it("should not display an error state", () => {
    cy.contains(/receivable/i, { timeout: 15000 });
    cy.contains("Something went wrong").should("not.exist");
  });
});
