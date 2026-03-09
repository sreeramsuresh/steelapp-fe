/**
 * Export Shipping E2E Tests
 *
 * Verifies the import/export page loads for shipping workflows.
 */

describe("Export Shipping - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  it("should load the import/export page", () => {
    cy.visit("/app/import-export");
    cy.contains("h1, h2, h3, h4", /import|export/i, { timeout: 15000 }).should("be.visible");
  });

  it("should render content on the page", () => {
    cy.visit("/app/import-export");
    cy.contains("h1, h2, h3, h4", /import|export/i, { timeout: 15000 }).should("be.visible");
    cy.get("body").then(($body) => {
      expect($body.text().length).to.be.greaterThan(100);
    });
  });

  it("should remain on import-export route", () => {
    cy.visit("/app/import-export");
    cy.contains("h1, h2, h3, h4", /import|export/i, { timeout: 15000 }).should("be.visible");
    cy.url().should("include", "/app/import-export");
  });

  it("should have action buttons", () => {
    cy.visit("/app/import-export");
    cy.contains("h1, h2, h3, h4", /import|export/i, { timeout: 15000 });
    cy.get("button", { timeout: 10000 }).should("have.length.greaterThan", 0);
  });

  it("should have search or filter controls", () => {
    cy.visit("/app/import-export");
    cy.contains("h1, h2, h3, h4", /import|export/i, { timeout: 15000 });
    cy.get('input[placeholder*="Search" i], input[type="search"], select, [role="combobox"], [data-testid*="search"], [data-testid*="filter"]', { timeout: 10000 })
      .should("have.length.greaterThan", 0);
  });

  it("should not display an error state", () => {
    cy.visit("/app/import-export");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.contains("Something went wrong").should("not.exist");
  });
});
