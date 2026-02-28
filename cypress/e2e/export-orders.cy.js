/**
 * Export Orders E2E Tests
 *
 * Verifies the import/export page loads for export order workflows.
 */

describe("Export Orders - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  it("should load the import/export page", () => {
    cy.visit("/app/import-export");
    cy.contains("h1, h2, h3, h4", /import|export/i, { timeout: 15000 }).should("be.visible");
  });

  it("should render page without errors", () => {
    cy.visit("/app/import-export");
    cy.contains("h1, h2, h3, h4", /import|export/i, { timeout: 15000 }).should("be.visible");
    cy.contains("Something went wrong").should("not.exist");
  });

  it("should display heading and content area", () => {
    cy.visit("/app/import-export");
    cy.get("h1, h2, h3", { timeout: 15000 })
      .should("exist")
      .and("be.visible");
  });
});
