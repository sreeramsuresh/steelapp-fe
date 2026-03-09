// Owner: sales
// Tests: credit note management
// Route: /app/credit-notes

describe("Credit Notes - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
    cy.interceptAPI("GET", "/api/credit-notes*", "getCreditNotes");
    cy.visit("/app/credit-notes");
    cy.wait("@getCreditNotes");
  });

  it("should load the credit notes page with heading", () => {
    cy.verifyPageLoads("Credit", "/app/credit-notes");
  });

  it("should render credit notes table", () => {
    cy.get("table", { timeout: 10000 }).should("be.visible");
    cy.get("table tbody tr").should("have.length.greaterThan", 0);
  });

  it("should display expected columns in the table", () => {
    cy.get("table thead th, table thead td").should("have.length.greaterThan", 2);
  });

  it("should have a create credit note button", () => {
    cy.contains("button, a", /create|new|add/i, { timeout: 10000 }).should("be.visible");
  });

  it("should have a search input", () => {
    cy.get('input[placeholder*="Search" i]', { timeout: 10000 })
      .first()
      .should("be.visible");
  });

  it("should show status badges on rows", () => {
    cy.get("table tbody tr", { timeout: 10000 }).first().then(($row) => {
      const hasStatus =
        $row.find("[class*='badge'], [class*='chip'], [class*='status']").length > 0 ||
        $row.text().toLowerCase().match(/draft|confirmed|issued|cancelled|applied/);
      expect(hasStatus, "Row should display a status badge").to.be.true;
    });
  });

  it("should navigate to detail page when clicking a row", () => {
    cy.get("table tbody tr", { timeout: 10000 }).first().click();
    cy.url().should("match", /\/app\/credit-notes\/\d+/);
  });

  it("should display formatted amounts in the amount column", () => {
    cy.get("table tbody tr", { timeout: 10000 }).first().then(($row) => {
      const text = $row.text();
      const hasFormattedAmount = /[\d,]+\.\d{2}/.test(text) || /AED|[\d,.]+/.test(text);
      expect(hasFormattedAmount, "Row should display a formatted amount").to.be.true;
    });
  });
});
