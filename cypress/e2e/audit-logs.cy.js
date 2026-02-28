/**
 * Audit Logs E2E Tests
 *
 * Verifies the audit logs page loads and renders content.
 */

describe("Audit Logs", () => {
  beforeEach(() => {
    cy.login();
  });

  it("should load the audit logs page", () => {
    cy.visit("/app/audit-logs", { timeout: 15000 });
    cy.contains("h1, h2, h3, h4", /Audit/i, { timeout: 15000 }).should("be.visible");
  });

  it("should render a table with log entries", () => {
    cy.visit("/app/audit-logs", { timeout: 15000 });
    cy.get("table", { timeout: 15000 }).should("exist");
    cy.get("tbody tr").should("have.length.greaterThan", 0);
  });

  it("should display column headers", () => {
    cy.visit("/app/audit-logs", { timeout: 15000 });
    cy.get("table thead", { timeout: 15000 }).should("exist");
    cy.get("table thead th").should("have.length.greaterThan", 0);
  });
});
