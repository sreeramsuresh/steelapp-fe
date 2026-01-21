/**
 * Audit Logs E2E Tests
 *
 * Tests audit logging and compliance:
 * - Change tracking
 * - Compliance reporting
 * - Data integrity verification
 * - Audit trail retention
 *
 * Run: npm run test:e2e -- --spec "**/audit-logs.cy.js"
 */

describe("Audit Logs - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  describe("Audit Log Viewing", () => {
    it("should view audit trail", () => {
      cy.visit("/audit-logs");

      cy.get('[data-testid="log-row"]').should("have.length.greaterThan", 0);
    });

    it("should filter audit logs by entity", () => {
      cy.visit("/audit-logs");

      cy.get('select[name="Entity"]').select("Invoice");

      cy.get('[data-testid="log-row"]').should("have.length.greaterThan", 0);
    });

    it("should view entity change details", () => {
      cy.visit("/audit-logs");
      cy.get('[data-testid="log-row"]').first().click();

      cy.contains("Before").should("be.visible");
      cy.contains("After").should("be.visible");
    });

    it("should export audit trail", () => {
      cy.visit("/audit-logs");

      cy.get('button:contains("Export")').click();
      cy.get('select[name="Format"]').select("CSV");

      cy.get('button:contains("Export")').click();
      cy.readFile("cypress/downloads/audit-trail-*.csv").should("exist");
    });
  });

  describe("Compliance Reporting", () => {
    it("should generate compliance report", () => {
      cy.visit("/compliance/reports");

      cy.get('button:contains("Generate Report")').click();

      cy.get('input[placeholder*="From Date"]').type("2024-01-01");
      cy.get('input[placeholder*="To Date"]').type("2024-12-31");

      cy.get('button:contains("Generate")').click();

      cy.contains("Report generated").should("be.visible");
    });

    it("should view data integrity check", () => {
      cy.visit("/compliance/integrity");

      cy.get('button:contains("Run Check")').click();

      cy.contains("Integrity Check Results").should("be.visible");
    });
  });
});
