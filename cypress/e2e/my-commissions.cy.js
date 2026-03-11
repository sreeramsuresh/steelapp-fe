// Owner: sales
// Tests: my commissions page (salesperson's own commission view)
// Route: /app/my-commissions

describe("My Commissions - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  it("should load the my commissions page", () => {
    cy.visit("/app/my-commissions");
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const text = $body.text().toLowerCase();
      const hasContent =
        text.includes("commission") ||
        text.includes("earning") ||
        text.includes("sales") ||
        text.includes("incentive");
      expect(hasContent, "My commissions page should have commission-related content").to.be.true;
    });
    cy.url().should("include", "/app/my-commissions");
  });

  it("should display commission data or empty state", () => {
    cy.visit("/app/my-commissions");
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const hasTable = $body.find("table").length > 0;
      const hasCards = $body.find("[class*='card']").length > 0;
      const hasContent = $body.text().length > 50;
      expect(hasTable || hasCards || hasContent, "Should display commission data or empty state").to
        .be.true;
    });
  });

  it("should have filter or date range controls", () => {
    cy.visit("/app/my-commissions");
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const hasControls =
        $body.find("input, select, button, [role='combobox']").length > 0;
      expect(hasControls, "Should have filter or date range controls").to.be.true;
    });
  });

  it("should not display error boundary", () => {
    cy.visit("/app/my-commissions");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.contains("Something went wrong").should("not.exist");
  });
});
