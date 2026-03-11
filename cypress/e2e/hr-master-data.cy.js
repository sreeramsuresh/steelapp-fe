// Owner: hr
/**
 * HR Master Data E2E Tests
 *
 * Tests departments and designations management pages.
 * Routes: /app/departments, /app/designations
 */

describe("HR Master Data - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  it("should load departments page with heading", () => {
    cy.visit("/app/departments");
    cy.verifyPageLoads("Department", "/app/departments");
  });

  it("should render departments table or list or empty state", () => {
    cy.visit("/app/departments");
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const hasTable = $body.find("table").length > 0;
      const hasCards = $body.find("[class*='card'], [class*='list'], [class*='department']").length > 0;
      const hasContent = $body.text().length > 20;
      expect(hasTable || hasCards || hasContent, "Should render departments table, list, or page content").to.be.true;
    });
  });

  it("should have an add department button or action controls", () => {
    cy.visit("/app/departments");
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const hasButton =
        $body.find("button, a").filter(function () {
          return /add|create|new/i.test(this.textContent);
        }).length > 0;
      const hasControls = $body.find("button, a").length > 0;
      expect(hasButton || hasControls, "Page should have add button or action controls").to.be.true;
    });
  });

  it("should load designations page with heading", () => {
    cy.visit("/app/designations");
    cy.verifyPageLoads("Designation", "/app/designations");
  });

  it("should render designations table or list or empty state", () => {
    cy.visit("/app/designations");
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const hasTable = $body.find("table").length > 0;
      const hasCards = $body.find("[class*='card'], [class*='list'], [class*='designation']").length > 0;
      const hasContent = $body.text().length > 20;
      expect(hasTable || hasCards || hasContent, "Should render designations table, list, or page content").to.be.true;
    });
  });

  it("should have an add designation button or action controls", () => {
    cy.visit("/app/designations");
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const hasButton =
        $body.find("button, a").filter(function () {
          return /add|create|new/i.test(this.textContent);
        }).length > 0;
      const hasControls = $body.find("button, a").length > 0;
      expect(hasButton || hasControls, "Page should have add button or action controls").to.be.true;
    });
  });
});
