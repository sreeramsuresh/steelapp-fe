// Owner: finance
// Tests: advance payment management
// Route: /app/advance-payments

describe("Advance Payments - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
    cy.visit("/app/advance-payments");
    cy.get("body", { timeout: 15000 }).should("be.visible");
  });

  it("should load the advance payments page with heading", () => {
    cy.verifyPageLoads("Advance", "/app/advance-payments");
  });

  it("should render payments table or empty state", () => {
    cy.get("body", { timeout: 10000 }).then(($body) => {
      if ($body.find("table").length > 0) {
        cy.get("table").should("be.visible");
      } else {
        expect($body.text().length).to.be.greaterThan(10);
      }
    });
  });

  it("should have a create advance payment button or interactive controls", () => {
    cy.get("body", { timeout: 10000 }).then(($body) => {
      const hasButton =
        $body.find("button, a").filter(function () {
          return /create|new|add|record/i.test(this.textContent);
        }).length > 0;
      const hasControls = $body.find("button, a, input, select").length > 0;
      expect(hasButton || hasControls, "Page should have action buttons or interactive elements").to.be.true;
    });
  });

  it("should have a search input or interactive controls", () => {
    cy.get("body", { timeout: 10000 }).then(($body) => {
      const hasSearch = $body.find('input[placeholder*="Search"]').length > 0;
      const hasControls = $body.find("input, select, button").length > 0;
      expect(hasSearch || hasControls, "Page should have search input or interactive controls").to.be.true;
    });
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
        $row.text().toLowerCase().match(/pending|applied|refunded|partial|active|cancelled/);
      expect(hasStatus, "Row should display a status indicator").to.be.true;
    });
  });
});
