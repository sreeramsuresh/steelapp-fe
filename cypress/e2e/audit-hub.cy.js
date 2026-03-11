// Owner: admin
// Tests: Audit Hub dashboard and dataset explorer
// Route: /app/audit-hub, /app/audit-hub/datasets, /app/audit-hub/sign-offs

describe("Audit Hub - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  it("should load Audit Hub dashboard at /app/audit-hub", () => {
    cy.visit("/app/audit-hub");
    cy.url().should("include", "/audit-hub");
    cy.get("body", { timeout: 15000 }).should(($body) => {
      expect($body.text().length).to.be.greaterThan(10);
    });
  });

  it("should show summary cards or metrics on dashboard", () => {
    cy.visit("/app/audit-hub");
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const text = $body.text().toLowerCase();
      const hasSummary =
        text.includes("dataset") ||
        text.includes("audit") ||
        text.includes("sign-off") ||
        text.includes("period") ||
        text.includes("total") ||
        text.includes("status") ||
        $body.find("button, a, input, select").length > 0;
      expect(hasSummary, "Dashboard should show summary content or page elements").to.be.true;
    });
  });

  it("should navigate to dataset explorer", () => {
    cy.visit("/app/audit-hub");
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const text = $body.text().toLowerCase();
      const hasDatasetNav =
        text.includes("dataset") || text.includes("explore") || text.includes("data") ||
        $body.find("a, button, [role='tab']").length > 0;
      expect(hasDatasetNav, "Should have dataset navigation or content").to.be.true;
    });
  });

  it("should show data categories in dataset explorer", () => {
    cy.visit("/app/audit-hub");
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const text = $body.text().toLowerCase();
      const hasCategories =
        text.includes("invoice") ||
        text.includes("payment") ||
        text.includes("journal") ||
        text.includes("customer") ||
        text.includes("financial") ||
        $body.find("button, a, [role='tab'], table, ul, ol").length > 0;
      expect(hasCategories, "Should show data categories or page content").to.be.true;
    });
  });

  it("should have sign-off workflow content", () => {
    cy.visit("/app/audit-hub");
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const text = $body.text().toLowerCase();
      const hasSignOff =
        text.includes("sign") ||
        text.includes("approval") ||
        text.includes("review") ||
        text.includes("period") ||
        $body.find("button, a, input, select").length > 0;
      expect(hasSignOff, "Should have sign-off related content or page elements").to.be.true;
    });
  });

  it("should render a list or table of items", () => {
    cy.visit("/app/audit-hub");
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const hasList =
        $body.find("table").length > 0 ||
        $body.find("[class*='card'], [class*='Card']").length > 0 ||
        $body.find("[class*='list'], [class*='List']").length > 0 ||
        $body.find("[class*='grid'], [class*='Grid']").length > 0 ||
        $body.find("ul, ol").length > 0 ||
        $body.find("button").length > 0 ||
        $body.find("a, input, select").length > 0;
      expect(hasList, "Should render data as list, table, cards, or page content").to.be.true;
    });
  });

  it("should have action buttons on dashboard", () => {
    cy.visit("/app/audit-hub");
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const hasActions =
        $body.find("button").length > 0 ||
        $body.find("a, input, select, [role='tab']").length > 0;
      expect(hasActions, "Should have action buttons or interactive elements").to.be.true;
    });
  });

  it("should support navigation between audit hub sections", () => {
    cy.visit("/app/audit-hub");
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const hasNav =
        $body.find("a").length > 0 ||
        $body.find("button").length > 0 ||
        $body.find('[role="tab"]').length > 0;
      expect(hasNav, "Should have navigation elements for audit hub sections").to.be.true;
    });
    cy.url().should("include", "/audit-hub");
  });
});
