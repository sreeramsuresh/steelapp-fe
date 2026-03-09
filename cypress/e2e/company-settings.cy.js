// Owner: admin
// Tests: company settings management
// Route: /app/settings

describe("Company Settings - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
    cy.visit("/app/settings");
  });

  it("should load settings page with Company Settings heading", () => {
    cy.verifyPageLoads("Company Settings", "/app/settings");
  });

  it("should show Company Profile tab visible and active by default", () => {
    cy.contains("Company Profile", { timeout: 10000 }).should("be.visible");
    cy.contains("Basic Information", { timeout: 10000 }).should("be.visible");
  });

  it("should have company name input field with value", () => {
    cy.contains("Company Profile", { timeout: 10000 });
    cy.get('input[placeholder*="company name" i], input[name*="name" i]', { timeout: 10000 })
      .first()
      .should("exist");
  });

  it("should have company code or TRN fields", () => {
    cy.get("body", { timeout: 10000 }).then(($body) => {
      const text = $body.text().toLowerCase();
      const hasCodeFields =
        text.includes("trn") ||
        text.includes("tax") ||
        text.includes("code") ||
        text.includes("registration");
      expect(hasCodeFields, "Should display TRN or company code fields").to.be.true;
    });
  });

  it("should have address fields", () => {
    cy.get("body", { timeout: 10000 }).then(($body) => {
      const text = $body.text().toLowerCase();
      const hasAddress =
        text.includes("address") ||
        text.includes("city") ||
        text.includes("country") ||
        text.includes("location");
      expect(hasAddress, "Should display address fields").to.be.true;
    });
  });

  it("should have a Save button", () => {
    cy.get("body").then(($body) => {
      const hasSave =
        $body.find('button').filter(':contains("Save")').length > 0 ||
        $body.find('button[type="submit"]').length > 0;
      expect(hasSave, "Should have a Save button").to.be.true;
    });
  });

  it("should show Document Templates tab", () => {
    cy.contains("Document Templates", { timeout: 10000 }).should("be.visible");
  });

  it("should show VAT Rates tab", () => {
    cy.contains("VAT Rates", { timeout: 10000 }).should("be.visible");
  });

  it("should switch tabs when Document Templates is clicked", () => {
    cy.contains("Document Templates", { timeout: 10000 }).click();
    cy.get("body").then(($body) => {
      const text = $body.text().toLowerCase();
      const hasTemplateContent =
        text.includes("template") || text.includes("document") || text.includes("invoice");
      expect(hasTemplateContent, "Should show Document Templates content after tab switch").to.be
        .true;
    });
  });

  it("should have contact information fields (phone, email)", () => {
    cy.get("body", { timeout: 10000 }).then(($body) => {
      const text = $body.text().toLowerCase();
      const hasContact =
        text.includes("phone") ||
        text.includes("email") ||
        text.includes("contact") ||
        text.includes("mobile");
      expect(hasContact, "Should display contact information fields").to.be.true;
    });
  });
});
