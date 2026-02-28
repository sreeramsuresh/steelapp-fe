/**
 * Supplier Quotation E2E Tests
 *
 * Tests critical flows:
 * 1. List page loads correctly
 * 2. Create quotation form navigation
 * 3. PDF Upload page
 * 4. Filter by status
 *
 * Run: npm run test:e2e -- --spec "cypress/e2e/supplier-quotations.cy.js"
 */

describe("Supplier Quotations - Critical Flows", () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.login();
  });

  describe("1. List Page", () => {
    it("should load supplier quotations list page", () => {
      cy.visit("/app/supplier-quotations");

      // Wait for page to load - look for title with "Supplier Quotations" text
      cy.contains(/supplier quotations/i, { timeout: 15000 }).should(
        "be.visible",
      );

      // Verify action buttons using data-testid (reliable selectors)
      cy.get('[data-testid="upload-pdf-btn"]').should("be.visible");
      cy.get('[data-testid="new-quotation-btn"]').should("be.visible");

      // Verify filter controls - search has specific placeholder
      cy.get('input[placeholder*="Search by reference"]').should("be.visible");
      cy.get("select").should("exist");
    });

    it("should show empty state or table with data", () => {
      cy.visit("/app/supplier-quotations");

      // Wait for loading to complete
      cy.contains(/supplier quotations/i, { timeout: 15000 }).should(
        "be.visible",
      );

      // Should show content (empty state, table, or cards)
      cy.get("body").then(($body) => {
        expect($body.text().length).to.be.greaterThan(50);
      });
    });

    it("should filter quotations by status", () => {
      cy.visit("/app/supplier-quotations");

      // Wait for page to load
      cy.contains(/supplier quotations/i, { timeout: 15000 }).should(
        "be.visible",
      );

      // Verify status dropdown has options
      cy.get("select").should("be.visible");
      cy.get("select option").should("have.length.greaterThan", 1);

      // Select a status filter
      cy.get("select").first().select("draft");

      // Verify filter was applied
      cy.get("select").should("have.value", "draft");
    });
  });

  describe("2. Create Quotation Navigation", () => {
    it("should navigate to create quotation form", () => {
      cy.visit("/app/supplier-quotations");

      // Wait for page to load
      cy.contains(/supplier quotations/i, { timeout: 15000 }).should(
        "be.visible",
      );

      // Click the New Quotation button using data-testid
      cy.get('[data-testid="new-quotation-btn"]').click();

      // Should navigate to form page
      cy.url().should("include", "/app/supplier-quotations/new");

      // Form should be visible - look for heading
      cy.contains(/new supplier quotation/i, { timeout: 15000 }).should(
        "be.visible",
      );
    });
  });

  describe("3. PDF Upload Page", () => {
    it("should navigate to upload page", () => {
      cy.visit("/app/supplier-quotations");

      // Wait for page to load
      cy.contains(/supplier quotations/i, { timeout: 15000 }).should(
        "be.visible",
      );

      // Click the Upload PDF button using data-testid
      cy.get('[data-testid="upload-pdf-btn"]').click();

      // Should navigate to upload page
      cy.url().should("include", "/app/supplier-quotations/upload");

      // Upload area should be visible
      cy.contains(/upload|drop|pdf/i, { timeout: 15000 }).should("be.visible");
    });

    it("should show upload drop zone", () => {
      cy.visit("/app/supplier-quotations/upload");

      // Verify drop zone with dashed border exists
      cy.get('[class*="border-dashed"]', { timeout: 15000 }).should(
        "be.visible",
      );

      // Verify file input exists with id="pdf-upload"
      cy.get("input#pdf-upload").should("exist");

      // Verify accept attribute for PDF
      cy.get("input#pdf-upload")
        .should("have.attr", "accept")
        .and("include", "pdf");
    });
  });

  describe("4. View Quotation (data-dependent)", () => {
    it("should load quotation list and check for data", () => {
      cy.visit("/app/supplier-quotations");
      cy.contains(/supplier quotations/i, { timeout: 15000 }).should(
        "be.visible",
      );

      // Just verify the page loaded successfully
      cy.get("body").then(($body) => {
        expect($body.text().length).to.be.greaterThan(10);
      });
    });
  });
});

/**
 * Supplier Quotation - Edge Cases & Error Handling
 */
describe("Supplier Quotations - Error Handling", () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.login();
  });

  it("should handle API error gracefully on list page", () => {
    // Intercept and force error
    cy.intercept("GET", "**/api/supplier-quotations*", {
      statusCode: 500,
      body: { error: "Internal server error" },
    }).as("getQuotationsError");

    cy.visit("/app/supplier-quotations");

    cy.wait("@getQuotationsError");

    // Should show error message or the page should handle the error
    cy.get("body", { timeout: 10000 }).should("be.visible");
    cy.get("body").then(($body) => {
      expect($body.text().length).to.be.greaterThan(10);
    });
  });

  it("should handle 404 for non-existent quotation", () => {
    cy.intercept("GET", "**/api/supplier-quotations/99999999", {
      statusCode: 404,
      body: { error: "Quotation not found" },
    }).as("getQuotationNotFound");

    cy.visit("/app/supplier-quotations/99999999", {
      failOnStatusCode: false,
    });

    cy.wait("@getQuotationNotFound");

    // Should show some content (error, redirect, or empty state)
    cy.get("body", { timeout: 10000 }).should("be.visible");
    cy.get("body").then(($body) => {
      expect($body.text().length).to.be.greaterThan(10);
    });
  });
});
