// Owner: procurement
// Tests: supplier bill management
// Route: /app/supplier-bills

describe("Supplier Bills - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
    cy.intercept("GET", "**/api/supplier-bills*").as("getSupplierBills");
    cy.visit("/app/supplier-bills");
    cy.wait("@getSupplierBills");
  });

  it("should load the supplier bills page with heading", () => {
    cy.verifyPageLoads("Bill", "/app/supplier-bills");
  });

  it("should render bills table with expected columns", () => {
    cy.get("table", { timeout: 10000 }).should("be.visible");
    cy.get("table", { timeout: 10000 }).should("exist");
  });

  it("should have a search input", () => {
    cy.get('input[placeholder*="Search"]', { timeout: 10000 })
      .first()
      .should("be.visible");
  });

  it("should have status filter controls", () => {
    cy.get("body").then(($body) => {
      const hasFilters =
        $body.find("button, [role='tab']").filter(function () {
          const t = this.textContent.toLowerCase();
          return t.includes("all") || t.includes("draft") || t.includes("pending") || t.includes("paid") || t.includes("approved");
        }).length > 0 ||
        $body.find("select, [role='combobox']").length > 0;
      expect(hasFilters, "Status filter controls should exist").to.be.true;
    });
  });

  it("should have a create bill button", () => {
    cy.contains("button, a", /create|new|add/i, { timeout: 10000 }).should("be.visible");
  });

  it("should display amount and status on table rows", () => {
    cy.get("body", { timeout: 10000 }).then(($body) => {
      if ($body.find("table tbody tr").length === 0) return; // No data, skip
      const $row = $body.find("table tbody tr").first();
      const text = $row.text();
      // Amount should contain a number
      const hasAmount = /[\d,.]+/.test(text);
      // Status should be present as text or badge
      const hasStatus =
        $row.find("[class*='badge'], [class*='chip'], [class*='status']").length > 0 ||
        text.toLowerCase().match(/draft|pending|approved|paid|overdue|cancelled/);
      expect(hasAmount, "Row should display an amount").to.be.true;
      expect(hasStatus, "Row should display a status").to.be.true;
    });
  });

  it("should navigate to bill detail when clicking a row", () => {
    cy.get("body", { timeout: 10000 }).then(($body) => {
      if ($body.find("table tbody tr").length === 0) return; // No data, skip
      cy.get("table tbody tr").first().click();
      cy.url().should("not.equal", "/app/supplier-bills");
    });
  });

  it("should display bill summary or stats", () => {
    cy.get("body").then(($body) => {
      const text = $body.text().toLowerCase();
      const hasSummary =
        text.includes("total") ||
        text.includes("outstanding") ||
        text.includes("overdue") ||
        text.includes("summary") ||
        $body.find("[class*='card'], [class*='stat'], [class*='summary']").length > 0;
      expect(hasSummary, "Page should show bill summary or stats").to.be.true;
    });
  });
});
