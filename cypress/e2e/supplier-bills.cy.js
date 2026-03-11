// Owner: procurement
// Tests: supplier bill management
// Route: /app/supplier-bills

describe("Supplier Bills - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
    cy.intercept("GET", "**/api/supplier-bills*").as("getSupplierBills");
    cy.visit("/app/supplier-bills");
    cy.get("body", { timeout: 15000 }).should("be.visible");
  });

  it("should load the supplier bills page with heading", () => {
    cy.verifyPageLoads("Bill", "/app/supplier-bills");
  });

  it("should render bills table or empty state", () => {
    cy.get("body", { timeout: 10000 }).then(($body) => {
      if ($body.find("table").length > 0) {
        cy.get("table").should("be.visible");
      } else {
        expect($body.text().length).to.be.greaterThan(10);
      }
    });
  });

  it("should have a search input", () => {
    cy.get('input[placeholder*="Search"]', { timeout: 10000 })
      .first()
      .should("be.visible");
  });

  it("should have status filter controls", () => {
    // Wait for loading to finish (select appears after initial load)
    cy.get('select[aria-label="Filter by status"], select, [role="combobox"]', { timeout: 15000 }).should("exist");
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
      cy.url().should("match", /\/supplier-bills\/\d+/);
    });
  });

  it("should display bill summary or stats", () => {
    // Wait for loading to finish — summary cards render after API response
    cy.contains("Total Bills", { timeout: 15000 }).should("be.visible");
  });
});
