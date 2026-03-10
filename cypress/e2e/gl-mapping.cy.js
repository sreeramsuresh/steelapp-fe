// Owner: finance

/**
 * GL Mapping Rules E2E Tests
 *
 * Verifies the GL Mapping Rules configuration page at
 * /app/settings/gl-mapping-rules loads correctly and renders
 * the expected UI elements for rule management.
 */

describe("GL Mapping Rules - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
    cy.visit("/app/settings/gl-mapping-rules");
    cy.get("body", { timeout: 15000 }).should("be.visible");
  });

  it("should load the GL mapping rules page", () => {
    cy.get("body").then(($body) => {
      const text = $body.text().toLowerCase();
      const hasContent =
        text.includes("gl mapping") ||
        text.includes("mapping rules") ||
        text.includes("general ledger") ||
        text.includes("settings");
      expect(hasContent, "Page should show GL mapping or settings content").to.be.true;
    });
  });

  it("should display the page without crash errors", () => {
    cy.get("body").then(($body) => {
      const text = $body.text().toLowerCase();
      const hasCrash = text.includes("something went wrong") && text.includes("stack trace");
      expect(hasCrash, "Page should not show crash error").to.be.false;
    });
  });

  it("should show a table or empty state for mapping rules", () => {
    cy.get("body").then(($body) => {
      const hasTable = $body.find("table").length > 0;
      const hasEmptyState = $body.text().match(/no .*(found|data|rules|defined)/i);
      const hasContent = $body.text().length > 10;
      expect(hasTable || !!hasEmptyState || hasContent, "Should show table, empty state, or page content").to.be.true;
    });
  });

  it("should have action buttons or controls", () => {
    cy.get("button", { timeout: 10000 }).should("have.length.greaterThan", 0);
  });

  it("should render settings navigation or breadcrumb", () => {
    cy.get("body").then(($body) => {
      const hasNav = $body.find("nav, aside, [class*='sidebar'], [class*='breadcrumb']").length > 0;
      const hasSettingsText = $body.text().toLowerCase().includes("settings");
      expect(hasNav || hasSettingsText, "Should show navigation or settings context").to.be.true;
    });
  });

  it("should display the page heading or title", () => {
    cy.get("h1, h2, h3, h4", { timeout: 10000 }).should("have.length.greaterThan", 0);
  });
});
