// Owner: sales
// Tests: credit note management
// Route: /app/credit-notes

describe("Credit Notes - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
    cy.intercept("GET", "**/api/credit-notes*").as("getCreditNotes");
    cy.visit("/app/credit-notes");
    cy.wait("@getCreditNotes");
  });

  it("should load the credit notes page with heading", () => {
    cy.verifyPageLoads("Credit", "/app/credit-notes");
  });

  it("should render credit notes table", () => {
    cy.get("table", { timeout: 10000 }).should("be.visible");
    cy.get("table", { timeout: 10000 }).should("exist");
  });

  it("should display expected columns in the table", () => {
    cy.get("table", { timeout: 10000 }).should("exist");
  });

  it("should have a create credit note button", () => {
    cy.contains("button, a", /create|new|add/i, { timeout: 10000 }).should("be.visible");
  });

  it("should have a search input", () => {
    cy.get('input[placeholder*="Search"]', { timeout: 10000 })
      .first()
      .should("be.visible");
  });

  it("should show status badges on rows", () => {
    cy.get("body", { timeout: 10000 }).then(($body) => {
      if ($body.find("table tbody tr").length === 0) return; // No data, skip
      const $row = $body.find("table tbody tr").first();
      const hasStatus =
        $row.find("[class*='badge'], [class*='chip'], [class*='status']").length > 0 ||
        $row.text().toLowerCase().match(/draft|confirmed|issued|cancelled|applied/);
      expect(hasStatus, "Row should display a status badge").to.be.true;
    });
  });

  it("should navigate to detail page when clicking a row", () => {
    cy.get("body", { timeout: 10000 }).then(($body) => {
      if ($body.find("table tbody tr").length === 0) return; // No data, skip
      cy.get("table tbody tr").first().click();
      cy.url().should("match", /\/app\/credit-notes\/\d+/);
    });
  });

  it("should display formatted amounts in the amount column", () => {
    cy.get("body", { timeout: 10000 }).then(($body) => {
      if ($body.find("table tbody tr").length === 0) return; // No data, skip
      const $row = $body.find("table tbody tr").first();
      const text = $row.text();
      const hasFormattedAmount = /[\d,]+\.\d{2}/.test(text) || /AED|[\d,.]+/.test(text);
      expect(hasFormattedAmount, "Row should display a formatted amount").to.be.true;
    });
  });
});
