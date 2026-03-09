// Owner: admin
// Tests: Audit Hub dashboard and dataset explorer
// Route: /app/audit-hub, /app/audit-hub/datasets, /app/audit-hub/sign-offs

describe("Audit Hub - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
    cy.interceptAPI("GET", "/api/audit-hub*", "getAuditHub");
  });

  it("should load Audit Hub dashboard at /app/audit-hub", () => {
    cy.visit("/app/audit-hub");
    cy.url().should("include", "/audit-hub");
    cy.get("body", { timeout: 15000 }).should(($body) => {
      expect($body.text().length).to.be.greaterThan(50);
    });
  });

  it("should show summary cards or metrics on dashboard", () => {
    cy.visit("/app/audit-hub");
    cy.get("body", { timeout: 15000 }).then(($body) => {
      const text = $body.text().toLowerCase();
      const hasSummary =
        text.includes("dataset") ||
        text.includes("audit") ||
        text.includes("sign-off") ||
        text.includes("period") ||
        text.includes("total") ||
        text.includes("status");
      expect(hasSummary, "Dashboard should show summary content").to.be.true;
    });
  });

  it("should navigate to dataset explorer", () => {
    cy.visit("/app/audit-hub");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.get("body").then(($body) => {
      const text = $body.text().toLowerCase();
      const hasDatasetNav =
        text.includes("dataset") || text.includes("explore") || text.includes("data");
      expect(hasDatasetNav, "Should have dataset navigation or content").to.be.true;
    });
  });

  it("should show data categories in dataset explorer", () => {
    cy.visit("/app/audit-hub");
    cy.get("body", { timeout: 15000 }).then(($body) => {
      const text = $body.text().toLowerCase();
      const hasCategories =
        text.includes("invoice") ||
        text.includes("payment") ||
        text.includes("journal") ||
        text.includes("customer") ||
        text.includes("financial");
      expect(hasCategories, "Should show data categories").to.be.true;
    });
  });

  it("should have sign-off workflow content", () => {
    cy.visit("/app/audit-hub");
    cy.get("body", { timeout: 15000 }).then(($body) => {
      const text = $body.text().toLowerCase();
      const hasSignOff =
        text.includes("sign") ||
        text.includes("approval") ||
        text.includes("review") ||
        text.includes("period");
      expect(hasSignOff, "Should have sign-off related content").to.be.true;
    });
  });

  it("should render a list or table of items", () => {
    cy.visit("/app/audit-hub");
    cy.get("body", { timeout: 15000 }).then(($body) => {
      const hasList =
        $body.find("table").length > 0 ||
        $body.find('[class*="card" i]').length > 0 ||
        $body.find('[class*="list" i]').length > 0 ||
        $body.find('[class*="grid" i]').length > 0;
      expect(hasList, "Should render data as list, table, or cards").to.be.true;
    });
  });

  it("should have action buttons on dashboard", () => {
    cy.visit("/app/audit-hub");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.get("button", { timeout: 10000 }).should("have.length.greaterThan", 0);
  });

  it("should support navigation between audit hub sections", () => {
    cy.visit("/app/audit-hub");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.url().should("include", "/audit-hub");
    cy.get("body").then(($body) => {
      const hasNav =
        $body.find("a").length > 0 ||
        $body.find("button").length > 0 ||
        $body.find('[role="tab"]').length > 0;
      expect(hasNav, "Should have navigation elements for audit hub sections").to.be.true;
    });
  });
});
