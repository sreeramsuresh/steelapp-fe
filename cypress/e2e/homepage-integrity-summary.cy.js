/**
 * Homepage Integrity Summary - E2E Tests
 *
 * Verifies the homepage loads and the integrity summary card is accessible.
 */
describe("Homepage — Data & Stock Integrity Summary Card", () => {
  beforeEach(() => {
    cy.login();
  });

  it("should load the homepage", () => {
    cy.visit("/app");
    cy.url({ timeout: 15000 }).should("include", "/app");
  });

  it("should display the homepage heading", () => {
    cy.visit("/app");
    // The homepage shows some heading or dashboard content
    cy.get("h1, h2, h3", { timeout: 15000 }).first().should("be.visible");
  });

  it("should render homepage content without errors", () => {
    cy.visit("/app");
    cy.wait(3000);
    // Verify no error state is shown
    cy.contains(/something went wrong|error/i).should("not.exist");
  });

  it("should display dashboard content", () => {
    cy.visit("/app");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.get("body").then(($body) => {
      expect($body.text().length).to.be.greaterThan(10);
    });
  });

  it("should display the integrity summary section", () => {
    cy.visit("/app");
    // The integrity summary might be in a scrollable area
    cy.contains(/integrity|data.*stock/i, { timeout: 15000 }).should("exist");
  });
});
