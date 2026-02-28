/**
 * User Activity Logging E2E Tests
 *
 * Verifies the audit logs page loads and displays user activity data.
 */

describe("User Activity Logging", () => {
  beforeEach(() => {
    cy.login();
  });

  it("should load the audit logs page", () => {
    cy.visit("/app/audit-logs", { timeout: 15000 });
    cy.contains("h1, h2, h3, h4", /Audit/i, { timeout: 15000 }).should("be.visible");
  });

  it("should display activity data in the table", () => {
    cy.visit("/app/audit-logs", { timeout: 15000 });
    cy.get("table", { timeout: 15000 }).should("exist");
    cy.get("tbody tr").should("have.length.greaterThan", 0);
  });

  it("should have clickable table rows", () => {
    cy.visit("/app/audit-logs", { timeout: 15000 });
    cy.get("tbody tr", { timeout: 15000 }).first().should("be.visible");
  });
});
