// Owner: finance
describe("VAT Returns - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
    cy.interceptAPI("GET", "/api/vat-return/periods*", "getVATPeriods");
    cy.interceptAPI("GET", "/api/vat-return/generate*", "getVATGenerate");
    cy.interceptAPI("GET", "/api/vat-return/**", "getVATData");
    cy.interceptAPI("GET", "/api/financial-reports/vat*", "getVATReport");
  });

  describe("VAT Return Report Page", () => {
    it("should load with UAE VAT Return Report heading", () => {
      cy.visit("/analytics/vat-return");
      cy.wait("@getVATPeriods");
      cy.contains("UAE VAT Return Report").should("be.visible");
      cy.contains("FTA Form 201").should("be.visible");
    });

    it("should display period selector controls", () => {
      cy.visit("/analytics/vat-return");
      cy.wait("@getVATPeriods");
      cy.contains("Select Tax Period").should("be.visible");
      cy.get("#quick-period-select").should("exist");
      cy.get("#from-date-input").should("exist");
      cy.get("#to-date-input").should("exist");
    });

    it("should render Generate Report button", () => {
      cy.visit("/analytics/vat-return");
      cy.wait("@getVATPeriods");
      cy.contains("button", "Generate Report").should("be.visible").and("not.be.disabled");
    });

    it("should show VAT summary cards after generating report", () => {
      cy.visit("/analytics/vat-return");
      cy.wait("@getVATPeriods");

      // Set date range and generate
      cy.get("#from-date-input").type("2026-01-01");
      cy.get("#to-date-input").type("2026-01-31");
      cy.contains("button", "Generate Report").click();
      cy.wait("@getVATGenerate");

      // Summary cards should appear (Output VAT, Input VAT, Net VAT, Blocked VAT)
      cy.contains("Total Output VAT").should("exist");
      cy.contains("Total Input VAT").should("exist");
      cy.contains("Blocked VAT").should("exist");
      // Net VAT card shows either "Net VAT Due" or "VAT Refundable"
      cy.get("body").then(($body) => {
        const hasNetDue = $body.text().includes("Net VAT Due");
        const hasRefundable = $body.text().includes("VAT Refundable");
        expect(hasNetDue || hasRefundable).to.be.true;
      });
    });
  });

  describe("VAT Report Interactions", () => {
    it("should generate report when period dates are changed", () => {
      cy.visit("/analytics/vat-return");
      cy.wait("@getVATPeriods");

      cy.get("#from-date-input").clear().type("2026-02-01");
      cy.get("#to-date-input").clear().type("2026-02-28");

      cy.interceptAPI("GET", "/api/vat-return/generate*", "getVATGenerateNew");
      cy.contains("button", "Generate Report").click();
      cy.wait("@getVATGenerateNew");
    });

    it("should show Export PDF button after report is generated", () => {
      cy.visit("/analytics/vat-return");
      cy.wait("@getVATPeriods");

      cy.get("#from-date-input").type("2026-01-01");
      cy.get("#to-date-input").type("2026-01-31");
      cy.contains("button", "Generate Report").click();
      cy.wait("@getVATGenerate");

      cy.contains("button", "Export PDF").should("be.visible");
    });

    it("should display Output VAT and Input VAT expandable sections", () => {
      cy.visit("/analytics/vat-return");
      cy.wait("@getVATPeriods");

      cy.get("#from-date-input").type("2026-01-01");
      cy.get("#to-date-input").type("2026-01-31");
      cy.contains("button", "Generate Report").click();
      cy.wait("@getVATGenerate");

      // Output VAT section header with Form 201 Boxes 1-7
      cy.contains("Output VAT (Form 201 Boxes 1-7)").should("exist");
      // Input VAT section header with Form 201 Boxes 8-13
      cy.contains("Input VAT - Recoverable Tax (Form 201 Boxes 8-13)").should("exist");
    });
  });

  describe("VAT Rates Configuration", () => {
    beforeEach(() => {
      cy.interceptAPI("GET", "/api/vat-rates*", "getVATRates");
      cy.interceptAPI("GET", "/api/company*", "getCompany");
    });

    it("should navigate to settings and find VAT Rates Configuration section", () => {
      cy.visit("/app/settings");
      cy.wait("@getCompany");
      cy.wait("@getVATRates");
      cy.contains("VAT Rates Configuration").should("exist");
    });

    it("should display Standard Rated 5% information", () => {
      cy.visit("/app/settings");
      cy.wait("@getCompany");
      cy.wait("@getVATRates");
      cy.contains("Standard Rated (5%)").should("exist");
    });

    it("should show VAT rate cards with name, rate percentage, and type", () => {
      cy.visit("/app/settings");
      cy.wait("@getCompany");
      cy.wait("@getVATRates");

      // Each VAT rate card displays: name, rate %, type, description, and active toggle
      cy.contains("VAT Rates Configuration")
        .closest("div")
        .within(() => {
          // Check that at least one rate card exists with expected structure
          cy.get("[class*='rounded-2xl']").should("have.length.at.least", 1);
        });
    });
  });
});
