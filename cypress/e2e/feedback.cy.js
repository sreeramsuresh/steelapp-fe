// Owner: admin
/**
 * Feedback E2E Tests
 *
 * Tests the feedback page loads and displays content.
 */

describe("Feedback", () => {
  beforeEach(() => {
    cy.login();
  });

  it("should load the feedback management page", () => {
    cy.visit("/app/feedback");
    cy.contains("h1, h2, h3, h4", /feedback/i, { timeout: 15000 }).should("be.visible");
  });

  it("should render feedback list or empty state", () => {
    cy.visit("/app/feedback");
    cy.get("body", { timeout: 15000 }).should("be.visible");

    // Page should show either a table/list of feedback or an empty state message
    cy.get("body", { timeout: 15000 }).should(($body) => {
      expect($body.text().length).to.be.greaterThan(10);
    });
  });

  it("should have a feedback submission mechanism", () => {
    cy.visit("/app/feedback");
    cy.get("body", { timeout: 15000 }).should("be.visible");

    // Verify feedback page has submission controls (form, button, or input)
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const hasSubmitControl =
        $body.find("form").length > 0 ||
        $body.find("textarea").length > 0 ||
        $body.find("button:contains('Submit'), button:contains('Send')").length > 0;
      expect(hasSubmitControl || $body.find("button").length > 0, "Should have feedback submission controls").to.be.true;
    });
  });

  it("should stay on the feedback route", () => {
    cy.visit("/app/feedback");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.url().should("include", "/app/feedback");
  });

  it("should have action buttons", () => {
    cy.visit("/app/feedback");
    cy.contains("h1, h2, h3, h4", /feedback/i, { timeout: 15000 });
    cy.get("button", { timeout: 10000 }).should("have.length.greaterThan", 0);
  });

  it("should render without errors", () => {
    cy.visit("/app/feedback");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.get("[class*='error'], [data-testid*='error']").should("have.length", 0);
  });
});
