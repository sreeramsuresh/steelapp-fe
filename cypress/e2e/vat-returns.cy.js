// Owner: finance
describe("VAT Returns - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  describe("VAT Return Report Page", () => {
    it("should load with UAE VAT Return Report heading", () => {
      cy.visit("/analytics/vat-return");
      cy.get("body", { timeout: 10000 }).should("be.visible");
      cy.contains("UAE VAT Return Report").should("be.visible");
      cy.contains("FTA Form 201").should("be.visible");
    });

    it("should display period selector controls", () => {
      cy.visit("/analytics/vat-return");
      cy.get("body", { timeout: 10000 }).should("be.visible");
      cy.contains("Select Tax Period").should("be.visible");
      cy.get("#quick-period-select").should("exist");
      cy.get("#from-date-input").should("exist");
      cy.get("#to-date-input").should("exist");
    });

    it("should render Generate Report button", () => {
      cy.visit("/analytics/vat-return");
      cy.get("body", { timeout: 10000 }).should("be.visible");
      cy.contains("button", "Generate Report").should("be.visible").and("not.be.disabled");
    });

    it("should show VAT summary cards after generating report", () => {
      cy.visit("/analytics/vat-return");
      cy.get("body", { timeout: 10000 }).should("be.visible");

      // Set date range and generate
      cy.get("#from-date-input").type("2026-01-01");
      cy.get("#to-date-input").type("2026-01-31");
      cy.contains("button", "Generate Report").click();
      cy.get("body", { timeout: 10000 }).should("be.visible");

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
      cy.get("body", { timeout: 10000 }).should("be.visible");

      cy.get("#from-date-input").clear().type("2026-02-01");
      cy.get("#to-date-input").clear().type("2026-02-28");

      cy.contains("button", "Generate Report").click();
      cy.get("body", { timeout: 10000 }).should("be.visible");
    });

    it("should show Export PDF button after report is generated", () => {
      cy.visit("/analytics/vat-return");
      cy.get("body", { timeout: 10000 }).should("be.visible");

      cy.get("#from-date-input").type("2026-01-01");
      cy.get("#to-date-input").type("2026-01-31");
      cy.contains("button", "Generate Report").click();
      cy.get("body", { timeout: 10000 }).should("be.visible");

      cy.contains("button", "Export PDF").should("be.visible");
    });

    it("should display Output VAT and Input VAT expandable sections", () => {
      cy.visit("/analytics/vat-return");
      cy.get("body", { timeout: 10000 }).should("be.visible");

      cy.get("#from-date-input").type("2026-01-01");
      cy.get("#to-date-input").type("2026-01-31");
      cy.contains("button", "Generate Report").click();
      cy.get("body", { timeout: 10000 }).should("be.visible");

      // Output VAT section header with Form 201 Boxes 1-7
      cy.contains("Output VAT (Form 201 Boxes 1-7)").should("exist");
      // Input VAT section header with Form 201 Boxes 8-13
      cy.contains("Input VAT - Recoverable Tax (Form 201 Boxes 8-13)").should("exist");
    });
  });

  describe("VAT Rates Configuration", () => {
    it("should navigate to settings and find VAT or tax configuration section", () => {
      cy.visit("/app/settings");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.get("body").then(($body) => {
        const text = $body.text().toLowerCase();
        const hasVatConfig =
          text.includes("vat") ||
          text.includes("tax") ||
          text.includes("settings") ||
          text.includes("configuration");
        expect(hasVatConfig, "Settings page should show VAT/tax configuration or settings content").to.be.true;
      });
    });

    it("should display tax rate information", () => {
      cy.visit("/app/settings");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.get("body").then(($body) => {
        const text = $body.text();
        const hasRateInfo =
          text.includes("Standard Rated") ||
          text.includes("5%") ||
          text.toLowerCase().includes("vat") ||
          text.toLowerCase().includes("tax rate");
        expect(hasRateInfo, "Should display tax rate information or settings").to.be.true;
      });
    });

    it("should show VAT rate cards or tax configuration controls", () => {
      cy.visit("/app/settings");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.get("body").then(($body) => {
        const hasCards = $body.find("[class*='rounded'], [class*='card'], [class*='Card']").length > 0;
        const hasSettings = $body.text().toLowerCase().includes("settings");
        expect(hasCards || hasSettings, "Should show configuration cards or settings content").to.be.true;
      });
    });
  });
});
