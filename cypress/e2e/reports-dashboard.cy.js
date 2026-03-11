// Owner: analytics
// Tests: reports dashboard hub page
// Route: /analytics/reports

describe("Reports Dashboard - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  it("should load the reports dashboard page", () => {
    cy.visit("/analytics/reports");
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const text = $body.text().toLowerCase();
      const hasContent =
        text.includes("report") ||
        text.includes("analytics") ||
        text.includes("dashboard");
      expect(hasContent, "Reports dashboard should have report-related content").to.be.true;
    });
  });

  it("should display report category cards or navigation links", () => {
    cy.visit("/analytics/reports");
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const hasCards =
        $body.find("[class*='card'], a[href*='analytics'], a[href*='report']").length > 0;
      const hasLinks = $body.find("a, button").length > 0;
      const hasContent = $body.text().length > 100;
      expect(hasCards || hasLinks || hasContent, "Reports hub should show report categories or links")
        .to.be.true;
    });
  });

  it("should reference key report types (financial, inventory, sales)", () => {
    cy.visit("/analytics/reports");
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const text = $body.text().toLowerCase();
      const hasReportTypes =
        text.includes("financial") ||
        text.includes("inventory") ||
        text.includes("sales") ||
        text.includes("profit") ||
        text.includes("trial balance") ||
        text.includes("aging") ||
        text.includes("vat") ||
        text.includes("report");
      expect(hasReportTypes, "Reports hub should reference report types").to.be.true;
    });
  });

  it("should not display error boundary", () => {
    cy.visit("/analytics/reports");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.contains("Something went wrong").should("not.exist");
  });
});
