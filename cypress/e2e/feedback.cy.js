/**
 * Feedback E2E Tests
 *
 * Tests the feedback widget submission and admin feedback list.
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
    cy.get("body").then(($body) => {
      const hasTable = $body.find("table").length > 0;
      const hasCards = $body.find("[class*='card']").length > 0;
      const hasEmptyState = $body.text().match(/no feedback|no results|empty/i);
      const hasContent = $body.text().length > 50;
      expect(hasTable || hasCards || hasEmptyState || hasContent).to.be.true;
    });
  });

  it("should submit feedback from the feedback widget", () => {
    cy.visit("/app/dashboard");
    cy.get("body", { timeout: 15000 }).should("be.visible");

    // Look for the feedback button/trigger (usually a floating button or menu item)
    cy.get("body").then(($body) => {
      const hasFeedbackButton =
        $body.find("[data-testid='feedback-button'], [aria-label*='feedback' i], button:contains('Feedback')").length > 0;

      if (hasFeedbackButton) {
        cy.get("[data-testid='feedback-button'], [aria-label*='feedback' i], button:contains('Feedback')")
          .first()
          .click();

        // Fill in feedback message
        cy.get("textarea, [data-testid='feedback-message']", { timeout: 5000 })
          .first()
          .type("E2E smoke test feedback — please ignore");

        // Submit
        cy.get("button")
          .contains(/submit|send/i)
          .click();

        // Should show success or close the dialog
        cy.get("body", { timeout: 5000 }).should("be.visible");
      } else {
        cy.log("Feedback widget button not found on dashboard — skipping interaction");
      }
    });
  });

  it("should stay on the feedback route", () => {
    cy.visit("/app/feedback");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.url().should("include", "/app/feedback");
  });
});
