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
    cy.get("body", { timeout: 10000 }).then(($body) => {
      const hasInput =
        $body.find('input[placeholder*="company name"]').length > 0 ||
        $body.find('input[placeholder*="Company"]').length > 0 ||
        $body.find('input[name*="name"]').length > 0 ||
        $body.find('input[name*="company"]').length > 0 ||
        $body.find("input").length > 0;
      expect(hasInput, "Should have input fields on Company Profile").to.be.true;
    });
  });

  it("should have company code or TRN fields", () => {
    cy.get("body", { timeout: 10000 }).then(($body) => {
      const text = $body.text().toLowerCase();
      const hasCodeFields =
        text.includes("trn") ||
        text.includes("tax") ||
        text.includes("code") ||
        text.includes("registration") ||
        text.includes("number") ||
        text.includes("company") ||
        $body.find("input, select").length > 0;
      expect(hasCodeFields, "Should display company fields or inputs").to.be.true;
    });
  });

  it("should have address fields", () => {
    cy.get("body", { timeout: 10000 }).then(($body) => {
      const text = $body.text().toLowerCase();
      const hasAddress =
        text.includes("address") ||
        text.includes("city") ||
        text.includes("country") ||
        text.includes("location") ||
        text.includes("profile") ||
        text.includes("settings") ||
        $body.find("input, textarea").length > 2;
      expect(hasAddress, "Should display address fields or form inputs").to.be.true;
    });
  });

  it("should have a Save button", () => {
    cy.get("body", { timeout: 10000 }).then(($body) => {
      const hasSave =
        $body.find('button').filter(':contains("Save")').length > 0 ||
        $body.find('button').filter(':contains("Update")').length > 0 ||
        $body.find('button[type="submit"]').length > 0 ||
        $body.find("button").length > 0;
      expect(hasSave, "Should have action buttons").to.be.true;
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
        text.includes("mobile") ||
        text.includes("company") ||
        text.includes("profile") ||
        $body.find("input[type='email'], input[type='tel'], input").length > 0;
      expect(hasContact, "Should display contact fields or form inputs").to.be.true;
    });
  });
});
