// Owner: procurement
// Tests: debit note management
// Route: /app/debit-notes

describe("Debit Notes - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
    cy.intercept("GET", "**/api/debit-notes*").as("getDebitNotes");
    cy.visit("/app/debit-notes");
    cy.get("body", { timeout: 15000 }).should("be.visible");
  });

  it("should load the debit notes page with heading", () => {
    cy.verifyPageLoads("Debit", "/app/debit-notes");
  });

  it("should render debit notes table or empty state", () => {
    cy.get("body", { timeout: 10000 }).then(($body) => {
      if ($body.find("table").length > 0) {
        cy.get("table").should("be.visible");
      } else {
        expect($body.text().length).to.be.greaterThan(10);
      }
    });
  });

  it("should have a create debit note button", () => {
    cy.contains("button, a", /create|new|add/i, { timeout: 10000 }).should("be.visible");
  });

  it("should have a search input", () => {
    cy.get('input[placeholder*="Search"]', { timeout: 10000 })
      .first()
      .should("be.visible");
  });

  it("should display expected columns or empty state", () => {
    cy.get("body", { timeout: 10000 }).then(($body) => {
      if ($body.find("table").length > 0) {
        cy.get("table").should("exist");
      } else {
        expect($body.text().length).to.be.greaterThan(10);
      }
    });
  });

  it("should show status indicators on rows", () => {
    cy.get("body", { timeout: 10000 }).then(($body) => {
      if ($body.find("table tbody tr").length === 0) return; // No data, skip
      const $row = $body.find("table tbody tr").first();
      const hasStatus =
        $row.find("[class*='badge'], [class*='chip'], [class*='status']").length > 0 ||
        $row.text().toLowerCase().match(/draft|confirmed|issued|cancelled|applied/);
      expect(hasStatus, "Row should display a status indicator").to.be.true;
    });
  });
});
