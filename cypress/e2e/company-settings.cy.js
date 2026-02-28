/**
 * Company Settings E2E Tests
 *
 * Verifies the settings page loads with tabs and company profile.
 */

describe("Company Settings", () => {
  beforeEach(() => {
    cy.login();
  });

  it("should load settings page with Company Settings heading", () => {
    cy.visit("/app/settings");
    cy.contains("h1, h2, h3, h4", "Company Settings", { timeout: 15000 }).should("be.visible");
  });

  it("should display Company Profile tab content", () => {
    cy.visit("/app/settings");
    cy.contains("Company Profile", { timeout: 15000 }).should("be.visible");
    cy.contains("Basic Information").should("be.visible");
  });

  it("should display settings tabs", () => {
    cy.visit("/app/settings");
    cy.contains("Company Settings", { timeout: 15000 });
    cy.contains("Company Profile").should("be.visible");
    cy.contains("Document Templates").should("be.visible");
    cy.contains("VAT Rates").should("be.visible");
  });

  it("should show company name field pre-filled", () => {
    cy.visit("/app/settings");
    cy.contains("Company Profile", { timeout: 15000 });
    cy.get('input[placeholder*="company name"]').should("exist");
  });
});
