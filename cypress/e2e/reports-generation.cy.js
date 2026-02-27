/**
 * Reports Generation E2E Tests
 *
 * Tests report creation and distribution:
 * - Report templates and customization
 * - Report scheduling
 * - Multi-format export
 * - Report distribution
 *
 * Run: npm run test:e2e -- --spec '**/reports-generation.cy.js'
 */

describe("Reports Generation - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  describe("Report Creation", () => {
    it("should create custom report", () => {
      cy.visit("/reports");
      cy.get('button:contains("New Report")').click();

      cy.get('input[placeholder*="Report Name"]').type("Monthly Sales Report");

      cy.get('select[name="Report Type"]').select("SALES");

      cy.get('button:contains("Create")').click();
      cy.contains("Report created").should("be.visible");
    });

    it("should add columns to report", () => {
      cy.visit("/reports");
      cy.get('[data-testid="report-row"]').first().click();

      cy.get('button:contains("Edit Columns")').click();

      cy.get('checkbox[name="invoice_number"]').check();
      cy.get('checkbox[name="customer_name"]').check();
      cy.get('checkbox[name="total_amount"]').check();
      cy.get('checkbox[name="vat_amount"]').check();

      cy.get('button:contains("Apply")').click();
      cy.contains("Columns updated").should("be.visible");
    });

    it("should add filters to report", () => {
      cy.visit("/reports");
      cy.get('[data-testid="report-row"]').first().click();

      cy.get('button:contains("Add Filter")').click();

      cy.get('select[name="Field"]').select("Status");
      cy.get('select[name="Operator"]').select("EQUALS");
      cy.get('input[placeholder*="Value"]').type("CONFIRMED");

      cy.get('button:contains("Add Filter")').click();
      cy.contains("Filter added").should("be.visible");
    });

    it("should add grouping to report", () => {
      cy.visit("/reports");
      cy.get('[data-testid="report-row"]').first().click();

      cy.get('button:contains("Grouping")').click();

      cy.get('select[name="Group By"]').select("Customer");

      cy.get('button:contains("Apply")').click();
      cy.contains("Grouping applied").should("be.visible");
    });

    it("should add sorting to report", () => {
      cy.visit("/reports");
      cy.get('[data-testid="report-row"]').first().click();

      cy.get('button:contains("Sorting")').click();

      cy.get('select[name="Sort By"]').select("Total Amount");
      cy.get('select[name="Direction"]').select("DESC");

      cy.get('button:contains("Apply")').click();
      cy.contains("Sorting applied").should("be.visible");
    });
  });

  describe("Report Generation", () => {
    it("should generate report on demand", () => {
      cy.visit("/reports");
      cy.get('[data-testid="report-row"]').first().click();

      cy.get('button:contains("Generate")').click();

      cy.contains("Report generated").should("be.visible");

      cy.get('[data-testid="report-data"]').should("exist");
    });

    it("should apply date filter to report", () => {
      cy.visit("/reports");
      cy.get('[data-testid="report-row"]').first().click();

      cy.get('input[placeholder*="From Date"]').type("2024-01-01");
      cy.get('input[placeholder*="To Date"]').type("2024-12-31");

      cy.get('button:contains("Generate")').click();

      cy.contains("Report generated").should("be.visible");
    });

    it("should apply customer filter to report", () => {
      cy.visit("/reports");
      cy.get('[data-testid="report-row"]').first().click();

      cy.get('input[placeholder*="Customer"]').type("ABC");

      cy.get('button:contains("Generate")').click();

      cy.contains("Report generated").should("be.visible");
    });
  });

  describe("Report Export", () => {
    it("should export report as CSV", () => {
      cy.visit("/reports");
      cy.get('[data-testid="report-row"]').first().click();

      cy.get('button:contains("Generate")').click();

      cy.get('button:contains("Export")').click();
      cy.get('select[name="Format"]').select("CSV");

      cy.get('button:contains("Download")').click();
      cy.readFile("cypress/downloads/report-*.csv").should("exist");
    });

    it("should export report as Excel", () => {
      cy.visit("/reports");
      cy.get('[data-testid="report-row"]').first().click();

      cy.get('button:contains("Generate")').click();

      cy.get('button:contains("Export")').click();
      cy.get('select[name="Format"]').select("EXCEL");

      cy.get('button:contains("Download")').click();
      cy.readFile("cypress/downloads/report-*.xlsx").should("exist");
    });

    it("should export report as PDF", () => {
      cy.visit("/reports");
      cy.get('[data-testid="report-row"]').first().click();

      cy.get('button:contains("Generate")').click();

      cy.get('button:contains("Export")').click();
      cy.get('select[name="Format"]').select("PDF");

      cy.get('button:contains("Download")').click();
      cy.readFile("cypress/downloads/report-*.pdf").should("exist");
    });
  });

  describe("Report Scheduling", () => {
    it("should schedule report generation", () => {
      cy.visit("/reports");
      cy.get('[data-testid="report-row"]').first().click();

      cy.get('button:contains("Schedule")').click();

      cy.get('select[name="Frequency"]').select("WEEKLY");
      cy.get('select[name="Day"]').select("Monday");
      cy.get('input[placeholder*="Time"]').type("09:00");

      cy.get('button:contains("Schedule")').click();
      cy.contains("Report scheduled").should("be.visible");
    });

    it("should schedule report email distribution", () => {
      cy.visit("/reports");
      cy.get('[data-testid="report-row"]').first().click();

      cy.get('button:contains("Schedule")').click();

      cy.get('input[placeholder*="Recipients"]').type("manager@example.com");

      cy.get('select[name="Frequency"]').select("MONTHLY");

      cy.get('button:contains("Schedule")').click();
      cy.contains("Report scheduled").should("be.visible");
    });

    it("should view scheduled reports", () => {
      cy.visit("/reports/scheduled");

      cy.get('[data-testid="schedule-row"]').should("have.length.greaterThan", 0);
    });

    it("should cancel scheduled report", () => {
      cy.visit("/reports/scheduled");
      cy.get('[data-testid="schedule-row"]').first().click();

      cy.get('button:contains("Cancel")').click();

      cy.get('button:contains("Confirm")').click();
      cy.contains("Schedule cancelled").should("be.visible");
    });
  });

  describe("Pre-built Reports", () => {
    it("should access sales report template", () => {
      cy.visit("/reports/templates");

      cy.get('[data-testid="template"]').contains("Sales Report").click();

      cy.get('button:contains("Generate")').click();

      cy.contains("Report generated").should("be.visible");
    });

    it("should access inventory report template", () => {
      cy.visit("/reports/templates");

      cy.get('[data-testid="template"]').contains("Inventory Report").click();

      cy.get('button:contains("Generate")').click();

      cy.contains("Report generated").should("be.visible");
    });

    it("should access financial report template", () => {
      cy.visit("/reports/templates");

      cy.get('[data-testid="template"]').contains("Financial Report").click();

      cy.get('button:contains("Generate")').click();

      cy.contains("Report generated").should("be.visible");
    });
  });

  describe("Report Analytics", () => {
    it("should view report generation metrics", () => {
      cy.visit("/reports");

      cy.get('button:contains("Analytics")').click();

      cy.contains("Total Reports").should("be.visible");
      cy.contains("Reports Generated").should("be.visible");
    });

    it("should view most used reports", () => {
      cy.visit("/reports");

      cy.get('button:contains("Most Used")').click();

      cy.get('[data-testid="report-row"]').should("have.length.greaterThan", 0);
    });
  });
});
