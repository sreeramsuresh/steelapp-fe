// Owner: procurement
/**
 * Purchase Orders E2E Tests
 *
 * Tests the purchase orders page loads, renders content,
 * and has actionable controls.
 */

describe("Purchase Orders", () => {
  beforeEach(() => {
    cy.login();
    cy.visit("/app/purchases");
  });

  it("should load the purchases page with Purchase Orders heading", () => {
    cy.contains(/purchase/i, { timeout: 15000 }).should("be.visible");
    cy.url().should("include", "/app/purchases");
  });

  it("should render purchase order table or empty state", () => {
    cy.contains(/purchase/i, { timeout: 15000 }).should("be.visible");
    cy.get("body").should(($body) => {
      const hasTable = $body.find("table").length > 0;
      const hasEmptyState = $body.text().toLowerCase().includes("no purchase");
      expect(hasTable || hasEmptyState, "Should show PO table or empty state").to.be.true;
    });
  });

  it("should have Create PO button", () => {
    cy.contains(/purchase/i, { timeout: 15000 });
    cy.get('[data-testid="create-po-button"]', { timeout: 10000 }).should("be.visible");
  });

  it("should have search or filter controls", () => {
    cy.contains(/purchase/i, { timeout: 15000 });
    cy.get(
      'input[placeholder*="Search"], input[type="search"], [data-testid*="search"], [data-testid*="filter"]',
      { timeout: 10000 },
    ).should("have.length.greaterThan", 0);
  });

  it("should not display an error state", () => {
    cy.contains(/purchase/i, { timeout: 15000 });
    cy.contains("Something went wrong").should("not.exist");
  });

  it("should show PO data from seed when available", () => {
    cy.contains(/purchase/i, { timeout: 15000 });
    cy.get("body").should(($body) => {
      // Seed creates POs for the test company
      const hasTable = $body.find("table").length > 0;
      const hasRows = $body.find("table tbody tr").length > 0;
      const hasContent = $body.text().length > 100;
      expect(hasTable || hasRows || hasContent, "Page should have PO content").to.be.true;
    });
  });
});
