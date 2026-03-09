// Owner: finance

/**
 * GL Mapping Rules E2E Tests
 *
 * Verifies the GL Mapping Rules configuration page at
 * /app/settings/gl-mapping-rules loads correctly and renders
 * the expected UI elements for rule management.
 */

describe("GL Mapping Rules - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
    cy.intercept("GET", "**/api/gl-mappings/rules*").as("getGLMappings");
    cy.intercept("GET", "**/api/financial-reports/chart-of-accounts*").as("getChartOfAccounts");
    cy.visit("/app/settings/gl-mapping-rules");
  });

  it("should load the page with GL Mapping Rules heading", () => {
    cy.wait("@getGLMappings");
    cy.contains("h1", "GL Mapping Rules", { timeout: 15000 }).should("be.visible");
  });

  it("should display the mapping rules table with column headers", () => {
    cy.wait("@getGLMappings");
    cy.get("table", { timeout: 15000 }).should("exist");
    cy.contains("th", "Rule Code").should("be.visible");
    cy.contains("th", "Event Type").should("be.visible");
    cy.contains("th", "Priority").should("be.visible");
    cy.contains("th", "Entries").should("be.visible");
    cy.contains("th", "Active").should("be.visible");
    cy.contains("th", "Actions").should("be.visible");
  });

  it("should display the New Rule button", () => {
    cy.wait("@getGLMappings");
    cy.contains("button", "New Rule", { timeout: 15000 }).should("be.visible");
  });

  it("should show event type and status for each mapping rule row", () => {
    cy.wait("@getGLMappings").then((interception) => {
      const rules = interception.response?.body?.data || interception.response?.body || [];
      if (Array.isArray(rules) && rules.length > 0) {
        // At least one row exists — verify it shows event type badge and active status
        cy.get("table tbody tr").first().within(() => {
          cy.get("td").should("have.length.at.least", 5);
          // Event type column renders a badge
          cy.get("td").eq(1).find("span").should("exist");
          // Active column renders a badge
          cy.get("td").eq(4).find("span").should("exist");
        });
      } else {
        // Empty state message
        cy.contains("No GL mapping rules defined").should("be.visible");
      }
    });
  });

  it("should have edit and delete action buttons on existing rules", () => {
    cy.wait("@getGLMappings").then((interception) => {
      const rules = interception.response?.body?.data || interception.response?.body || [];
      if (Array.isArray(rules) && rules.length > 0) {
        cy.get("table tbody tr").first().within(() => {
          // Edit button (Pencil icon) with title
          cy.get('button[title="Edit"]').should("exist");
          // Delete button (Trash icon) with title
          cy.get('button[title="Delete"]').should("exist");
          // Preview button (Play icon) with title
          cy.get('button[title="Preview journal lines"]').should("exist");
        });
      } else {
        // No rows — skip action button assertion
        cy.contains("No GL mapping rules defined").should("be.visible");
      }
    });
  });

  it("should open the create form modal with required fields when New Rule is clicked", () => {
    cy.wait("@getGLMappings");
    cy.contains("button", "New Rule", { timeout: 15000 }).click();

    // Modal should be visible
    cy.contains("h2", "New Rule", { timeout: 10000 }).should("be.visible");

    // Rule Code field
    cy.get("#gl-rule-code").should("be.visible").and("have.value", "");

    // Event Type dropdown with default value
    cy.get("#gl-event-type").should("be.visible").and("have.value", "GRN_POSTED");

    // Priority field with default value
    cy.get("#gl-priority").should("be.visible").and("have.value", "100");

    // Posting Entries section with at least a Debit and Credit line
    cy.contains("Posting Entries").should("be.visible");
    cy.contains("option", "Debit").should("exist");
    cy.contains("option", "Credit").should("exist");

    // Create button should be present (disabled until rule code is filled)
    cy.contains("button", "Create").should("be.visible");

    // Cancel button to close modal
    cy.contains("button", "Cancel").should("be.visible");
  });
});
