// Owner: sales
// Tests: delivery note management
// Route: /app/delivery-notes

describe("Delivery Notes - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
    cy.interceptAPI("GET", "/api/delivery-notes*", "getDeliveryNotes");
    cy.visit("/app/delivery-notes");
    cy.wait("@getDeliveryNotes");
  });

  it("should load the delivery notes page with heading", () => {
    cy.verifyPageLoads("Delivery", "/app/delivery-notes");
  });

  it("should render delivery notes table", () => {
    cy.get("table", { timeout: 10000 }).should("be.visible");
    cy.get("table tbody tr").should("have.length.greaterThan", 0);
  });

  it("should display expected columns in the table", () => {
    cy.verifyTableColumns(["DN", "Customer", "Date", "Status"]);
  });

  it("should have a search input", () => {
    cy.get('input[placeholder*="Search" i]', { timeout: 10000 })
      .first()
      .should("be.visible");
  });

  it("should have a create delivery note button", () => {
    cy.contains("button, a", /create|new|add/i, { timeout: 10000 }).should("be.visible");
  });

  it("should show status badges on rows", () => {
    cy.get("table tbody tr", { timeout: 10000 }).first().then(($row) => {
      const hasStatus =
        $row.find("[class*='badge'], [class*='chip'], [class*='status']").length > 0 ||
        $row.text().toLowerCase().match(/draft|confirmed|delivered|dispatched|pending|cancelled/);
      expect(hasStatus, "Row should display a status badge").to.be.true;
    });
  });

  it("should navigate to detail page when clicking a row", () => {
    cy.get("table tbody tr", { timeout: 10000 }).first().click();
    cy.url().should("match", /\/app\/delivery-notes\/\d+/);
  });

  it("should have filter controls", () => {
    cy.get("body").then(($body) => {
      const hasFilters =
        $body.find("button, [role='tab']").filter(function () {
          const t = this.textContent.toLowerCase();
          return t.includes("all") || t.includes("draft") || t.includes("delivered") || t.includes("dispatched");
        }).length > 0 ||
        $body.find("select, [role='combobox'], input[placeholder*='filter' i]").length > 0;
      expect(hasFilters, "Filter controls should exist").to.be.true;
    });
  });
});
