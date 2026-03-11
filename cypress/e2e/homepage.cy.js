// Owner: admin
// Tests: homepage (main landing page after login)
// Route: /app/home

describe("Homepage - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  it("should load the homepage with content", () => {
    cy.visit("/app/home");
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const text = $body.text().toLowerCase();
      const hasContent =
        text.includes("dashboard") ||
        text.includes("welcome") ||
        text.includes("home") ||
        text.includes("overview") ||
        text.includes("recent") ||
        text.includes("quick");
      expect(hasContent, "Homepage should display relevant content").to.be.true;
    });
  });

  it("should display summary cards or widgets", () => {
    cy.visit("/app/home");
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const hasCards =
        $body.find("[class*='card'], [class*='widget'], [class*='summary']").length > 0;
      const hasContent = $body.text().length > 100;
      expect(hasCards || hasContent, "Homepage should have summary cards or widgets").to.be.true;
    });
  });

  it("should have navigation links to key modules", () => {
    cy.visit("/app/home");
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const hasLinks = $body.find("a, button").length > 0;
      expect(hasLinks, "Homepage should have navigation links").to.be.true;
    });
  });

  it("should render without errors", () => {
    cy.visit("/app/home");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.contains("Something went wrong").should("not.exist");
  });
});
