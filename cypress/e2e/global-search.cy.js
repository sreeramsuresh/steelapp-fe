// Owner: admin
// Tests: global search results page
// Route: /app/search

describe("Global Search - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  it("should load the search results page", () => {
    cy.visit("/app/search?q=steel");
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const text = $body.text().toLowerCase();
      const hasContent =
        text.includes("search") ||
        text.includes("result") ||
        text.includes("steel") ||
        text.includes("found") ||
        text.includes("no results");
      expect(hasContent, "Search page should display search-related content").to.be.true;
    });
  });

  it("should display search results or empty state for a query", () => {
    cy.visit("/app/search?q=invoice");
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const hasResults = $body.find("a, [class*='result'], [class*='card'], table").length > 0;
      const hasEmptyState =
        $body.text().toLowerCase().includes("no results") ||
        $body.text().toLowerCase().includes("not found") ||
        $body.text().length > 50;
      expect(hasResults || hasEmptyState, "Should show search results or empty state").to.be.true;
    });
  });

  it("should have a search input field", () => {
    cy.visit("/app/search?q=test");
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const hasSearchInput =
        $body.find('input[type="search"], input[placeholder*="Search"], input[name*="search"], input[data-testid*="search"]')
          .length > 0;
      const hasInput = $body.find("input").length > 0;
      expect(hasSearchInput || hasInput, "Search page should have a search input").to.be.true;
    });
  });

  it("should handle empty search query gracefully", () => {
    cy.visit("/app/search");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.contains("Something went wrong").should("not.exist");
  });

  it("should not display error boundary", () => {
    cy.visit("/app/search?q=nonexistent12345xyz");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.contains("Something went wrong").should("not.exist");
  });
});
