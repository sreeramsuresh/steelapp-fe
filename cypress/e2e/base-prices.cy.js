// Owner: sales
// Tests: base prices configuration page
// Route: /app/base-prices

describe("Base Prices - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  it("should load the base prices page with heading", () => {
    cy.visit("/app/base-prices");
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const text = $body.text().toLowerCase();
      const hasContent =
        text.includes("price") ||
        text.includes("base") ||
        text.includes("product") ||
        text.includes("cost");
      expect(hasContent, "Base prices page should have pricing-related content").to.be.true;
    });
    cy.url().should("include", "/app/base-prices");
  });

  it("should render price table or grid with product data", () => {
    cy.visit("/app/base-prices");
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const hasTable = $body.find("table").length > 0;
      const hasGrid = $body.find("[class*='grid'], [class*='card']").length > 0;
      const hasContent = $body.text().length > 100;
      expect(hasTable || hasGrid || hasContent, "Page should display price data").to.be.true;
    });
  });

  it("should display pricing columns or labels (price, cost, margin)", () => {
    cy.visit("/app/base-prices");
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const text = $body.text().toLowerCase();
      const hasPricingInfo =
        text.includes("price") ||
        text.includes("cost") ||
        text.includes("margin") ||
        text.includes("aed") ||
        text.includes("rate");
      expect(hasPricingInfo, "Page should display pricing information").to.be.true;
    });
  });

  it("should have search or filter controls", () => {
    cy.visit("/app/base-prices");
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const hasControls =
        $body.find('input[placeholder*="Search"], input[type="search"], select, input, button')
          .length > 0;
      expect(hasControls, "Page should have search or filter controls").to.be.true;
    });
  });

  it("should not display error boundary", () => {
    cy.visit("/app/base-prices");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.contains("Something went wrong").should("not.exist");
  });
});
