// Owner: procurement
/**
 * Purchase Orders E2E Tests
 *
 * Tests the purchase orders page loads and renders content.
 */

describe("Purchase Orders", () => {
  beforeEach(() => {
    cy.login();
    cy.visit("/app/purchases");
  });

  it("should load the purchases page with heading", () => {
    cy.contains(/purchase/i, { timeout: 15000 }).should("be.visible");
  });

  it("should render page content", () => {
    cy.contains(/purchase/i, { timeout: 15000 }).should("be.visible");
    cy.get("body").then(($body) => {
      const hasTable = $body.find("table").length > 0;
      const hasContent = $body.text().length > 100;
      expect(hasTable || hasContent).to.be.true;
    });
  });

  it("should stay on purchases route", () => {
    cy.contains(/purchase/i, { timeout: 15000 }).should("be.visible");
    cy.url().should("include", "/app/purchases");
  });

  it("should have action buttons", () => {
    cy.contains(/purchase/i, { timeout: 15000 });
    cy.get("button", { timeout: 10000 }).should("have.length.greaterThan", 0);
  });

  it("should have search or filter controls", () => {
    cy.contains(/purchase/i, { timeout: 15000 });
    cy.get('input[placeholder*="Search"], input[type="search"], select, [role="combobox"], [data-testid*="search"], [data-testid*="filter"]', { timeout: 10000 })
      .should("have.length.greaterThan", 0);
  });

  it("should not display an error state", () => {
    cy.contains(/purchase/i, { timeout: 15000 });
    cy.contains("Something went wrong").should("not.exist");
  });
});
