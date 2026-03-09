// Owner: procurement
// Tests: debit note management
// Route: /app/debit-notes

describe("Debit Notes - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
    cy.interceptAPI("GET", "/api/debit-notes*", "getDebitNotes");
    cy.visit("/app/debit-notes");
    cy.wait("@getDebitNotes");
  });

  it("should load the debit notes page with heading", () => {
    cy.verifyPageLoads("Debit", "/app/debit-notes");
  });

  it("should render debit notes table", () => {
    cy.get("table", { timeout: 10000 }).should("be.visible");
    cy.get("table tbody tr").should("have.length.greaterThan", 0);
  });

  it("should have a create debit note button", () => {
    cy.contains("button, a", /create|new|add/i, { timeout: 10000 }).should("be.visible");
  });

  it("should have a search input", () => {
    cy.get('input[placeholder*="Search" i]', { timeout: 10000 })
      .first()
      .should("be.visible");
  });

  it("should display expected columns in the table", () => {
    cy.get("table thead th, table thead td").should("have.length.greaterThan", 2);
  });

  it("should show status indicators on rows", () => {
    cy.get("table tbody tr", { timeout: 10000 }).first().then(($row) => {
      const hasStatus =
        $row.find("[class*='badge'], [class*='chip'], [class*='status']").length > 0 ||
        $row.text().toLowerCase().match(/draft|confirmed|issued|cancelled|applied/);
      expect(hasStatus, "Row should display a status indicator").to.be.true;
    });
  });
});
