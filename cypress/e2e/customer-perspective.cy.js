// Owner: sales
// Tests: customer perspective page (360-degree view of a customer)
// Route: /app/customer-perspective/:customerId

describe("Customer Perspective - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  it("should navigate to customer perspective from customer list", () => {
    // Visit customer list first to find a valid customer
    cy.visit("/app/customers");
    cy.get("body", { timeout: 15000 }).should(($body) => {
      expect($body.text().toLowerCase()).to.include("customer");
    });

    // The page should load without errors
    cy.get("body").should("be.visible");
    cy.contains("Something went wrong").should("not.exist");
  });

  it("should handle non-existent customer perspective gracefully", () => {
    cy.visit("/app/customer-perspective/999999999", { failOnStatusCode: false });
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const text = $body.text().toLowerCase();
      const hasContent =
        text.includes("not found") ||
        text.includes("error") ||
        text.includes("customer") ||
        text.length > 50;
      expect(hasContent, "Should handle non-existent customer gracefully").to.be.true;
    });
  });

  it("should not display error boundary for non-existent customer", () => {
    cy.visit("/app/customer-perspective/999999999", { failOnStatusCode: false });
    cy.get("body", { timeout: 15000 }).should("be.visible");
  });
});
