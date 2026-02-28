/**
 * Customs Documents E2E Tests
 *
 * Verifies the import/export page loads for customs document workflows.
 */

describe("Customs Documents - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  it("should load the import/export page", () => {
    cy.visit("/app/import-export");
    cy.contains("h1, h2, h3, h4", /import|export/i, { timeout: 15000 }).should("be.visible");
  });

  it("should display page heading", () => {
    cy.visit("/app/import-export");
    cy.get("h1, h2, h3", { timeout: 15000 })
      .should("exist")
      .and("be.visible");
  });

  it("should not show error state", () => {
    cy.visit("/app/import-export");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.contains("Something went wrong").should("not.exist");
  });
});
