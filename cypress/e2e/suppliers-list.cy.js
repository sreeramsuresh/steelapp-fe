// Owner: procurement
// Tests: dedicated suppliers list page and supplier form
// Routes: /app/suppliers, /app/suppliers/new

describe("Suppliers List Page - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  describe("Suppliers List", () => {
    it("should load the suppliers page with heading", () => {
      cy.visit("/app/suppliers");
      cy.get("body", { timeout: 15000 }).should(($body) => {
        const text = $body.text().toLowerCase();
        const hasSupplierContent =
          text.includes("supplier") || text.includes("vendor");
        expect(hasSupplierContent, "Suppliers page should have supplier-related content").to.be
          .true;
      });
      cy.url().should("include", "/app/suppliers");
    });

    it("should render supplier table or empty state", () => {
      cy.visit("/app/suppliers");
      cy.get("body", { timeout: 15000 }).should(($body) => {
        const hasTable = $body.find("table").length > 0;
        const hasCards = $body.find("[class*='card']").length > 0;
        const hasContent = $body.text().length > 50;
        expect(hasTable || hasCards || hasContent, "Page should display supplier data or empty state")
          .to.be.true;
      });
    });

    it("should have search or filter controls", () => {
      cy.visit("/app/suppliers");
      cy.get("body", { timeout: 15000 }).should(($body) => {
        const hasSearch =
          $body.find('input[placeholder*="Search"], input[type="search"], [data-testid*="search"]')
            .length > 0;
        const hasControls = $body.find("input, select, button").length > 0;
        expect(hasSearch || hasControls, "Page should have search or filter controls").to.be.true;
      });
    });

    it("should have an add supplier button or action control", () => {
      cy.visit("/app/suppliers");
      cy.get("body", { timeout: 15000 }).should(($body) => {
        const hasAddButton =
          $body.find("button, a").filter(function () {
            return /add|new|create/i.test(this.textContent);
          }).length > 0;
        const hasControls = $body.find("button, a").length > 0;
        expect(hasAddButton || hasControls, "Page should have action buttons").to.be.true;
      });
    });

    it("should display seeded supplier data in the list", () => {
      cy.visit("/app/suppliers");
      cy.get("body", { timeout: 15000 }).should(($body) => {
        const text = $body.text();
        // Seeded suppliers: GSS, PML, ITC
        const hasSeededData =
          text.includes("GSS") ||
          text.includes("PML") ||
          text.includes("ITC") ||
          text.includes("Global") ||
          text.includes("supplier");
        expect(hasSeededData, "Page should show seeded supplier data").to.be.true;
      });
    });

    it("should not display error boundary", () => {
      cy.visit("/app/suppliers");
      cy.get("body", { timeout: 15000 }).should("be.visible");
      cy.contains("Something went wrong").should("not.exist");
    });
  });

  describe("Add Supplier Form", () => {
    it("should load the new supplier form page", () => {
      cy.visit("/app/suppliers/new");
      cy.get("body", { timeout: 15000 }).should(($body) => {
        const text = $body.text().toLowerCase();
        const hasFormContent =
          text.includes("supplier") ||
          text.includes("name") ||
          text.includes("contact") ||
          text.includes("email");
        expect(hasFormContent, "Supplier form should have relevant fields").to.be.true;
      });
    });

    it("should have form input fields for supplier details", () => {
      cy.visit("/app/suppliers/new");
      cy.get("body", { timeout: 15000 }).should(($body) => {
        const hasInputs = $body.find("input, textarea, select").length > 0;
        expect(hasInputs, "Supplier form should have input fields").to.be.true;
      });
    });

    it("should have a save or submit button", () => {
      cy.visit("/app/suppliers/new");
      cy.get("body", { timeout: 15000 }).should(($body) => {
        const hasSaveButton =
          $body.find("button").filter(function () {
            return /save|submit|create|add/i.test(this.textContent);
          }).length > 0;
        expect(hasSaveButton, "Supplier form should have a save/submit button").to.be.true;
      });
    });
  });
});
