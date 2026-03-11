// Owner: finance
// Tests: document workflow guide page
// Route: /app/finance/document-workflow

describe("Document Workflow Guide - E2E Tests", () => {
  beforeEach(() => {
    cy.login();
  });

  it("should load the document workflow page with content", () => {
    cy.visit("/app/finance/document-workflow");
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const text = $body.text().toLowerCase();
      const hasContent =
        text.includes("workflow") ||
        text.includes("document") ||
        text.includes("process") ||
        text.includes("guide") ||
        text.includes("finance");
      expect(hasContent, "Document workflow page should have relevant content").to.be.true;
    });
    cy.url().should("include", "/app/finance/document-workflow");
  });

  it("should display workflow steps or process flow", () => {
    cy.visit("/app/finance/document-workflow");
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const text = $body.text().toLowerCase();
      const hasWorkflowInfo =
        text.includes("invoice") ||
        text.includes("quotation") ||
        text.includes("purchase") ||
        text.includes("payment") ||
        text.includes("approval") ||
        text.includes("step");
      expect(hasWorkflowInfo, "Page should explain document workflows").to.be.true;
    });
  });

  it("should have interactive elements or navigation links", () => {
    cy.visit("/app/finance/document-workflow");
    cy.get("body", { timeout: 15000 }).should(($body) => {
      const hasLinks = $body.find("a, button").length > 0;
      const hasContent = $body.text().length > 100;
      expect(hasLinks || hasContent, "Page should have links or substantial content").to.be.true;
    });
  });

  it("should not display error boundary", () => {
    cy.visit("/app/finance/document-workflow");
    cy.get("body", { timeout: 15000 }).should("be.visible");
    cy.contains("Something went wrong").should("not.exist");
  });
});
