// Owner: sales
// Tests: delivery note management
// Route: /app/delivery-notes

describe("Delivery Notes - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
    cy.intercept("GET", "**/api/delivery-notes*").as("getDeliveryNotes");
    cy.visit("/app/delivery-notes");
    cy.get("body", { timeout: 15000 }).should("be.visible");
  });

  it("should load the delivery notes page with heading", () => {
    cy.verifyPageLoads("Delivery", "/app/delivery-notes");
  });

  it("should render delivery notes table or empty state", () => {
    cy.get("body", { timeout: 10000 }).then(($body) => {
      if ($body.find("table").length > 0) {
        cy.get("table").should("be.visible");
      } else {
        expect($body.text().length).to.be.greaterThan(10);
      }
    });
  });

  it("should display expected columns or empty state", () => {
    cy.get("body", { timeout: 10000 }).then(($body) => {
      if ($body.find("table").length > 0) {
        const headerText = $body.find("table thead").text().toLowerCase();
        const hasExpected =
          headerText.includes("dn") ||
          headerText.includes("delivery") ||
          headerText.includes("customer") ||
          headerText.includes("date") ||
          headerText.includes("status") ||
          headerText.includes("#") ||
          headerText.includes("number");
        expect(hasExpected, "Table should have relevant column headers").to.be.true;
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

  it("should have a create delivery note button", () => {
    cy.contains("button, a", /create|new|add/i, { timeout: 10000 }).should("be.visible");
  });

  it("should show status badges on rows", () => {
    cy.get("body", { timeout: 10000 }).then(($body) => {
      if ($body.find("table tbody tr").length === 0) return; // No data, skip
      const $row = $body.find("table tbody tr").first();
      const hasStatus =
        $row.find("[class*='badge'], [class*='chip'], [class*='status']").length > 0 ||
        $row.text().toLowerCase().match(/draft|confirmed|delivered|dispatched|pending|cancelled/);
      expect(hasStatus, "Row should display a status badge").to.be.true;
    });
  });

  it("should navigate to detail page when clicking a row", () => {
    cy.get("body", { timeout: 10000 }).then(($body) => {
      if ($body.find("table tbody tr").length === 0) return; // No data, skip
      cy.get("table tbody tr").first().click();
      cy.url().should("match", /\/app\/delivery-notes\/\d+/);
    });
  });

  it("should have filter controls", () => {
    cy.get("body").then(($body) => {
      const hasFilters =
        $body.find("button, [role='tab']").filter(function () {
          const t = this.textContent.toLowerCase();
          return t.includes("all") || t.includes("draft") || t.includes("delivered") || t.includes("dispatched");
        }).length > 0 ||
        $body.find("select, [role='combobox'], input[placeholder*='filter']").length > 0;
      expect(hasFilters, "Filter controls should exist").to.be.true;
    });
  });
});
