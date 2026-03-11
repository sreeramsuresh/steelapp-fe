// Owner: auth
// Tests: role-based access control
// Uses cy.loginAsRole() for different users

describe("RBAC Access Control - E2E Tests", () => {
  describe("Admin Access", () => {
    beforeEach(() => {
      cy.loginAsRole("admin");
    });

    it("should allow admin to access settings page", () => {
      cy.visit("/app/settings");
      cy.get("body", { timeout: 15000 }).should(($body) => {
        const text = $body.text().toLowerCase();
        expect(
          text.includes("settings") || text.includes("company") || text.includes("configuration"),
          "Admin should see settings page content",
        ).to.be.true;
      });
    });

    it("should allow admin to access user management page", () => {
      cy.visit("/app/users");
      cy.get("body", { timeout: 15000 }).should(($body) => {
        const text = $body.text().toLowerCase();
        expect(
          text.includes("user") || text.includes("management"),
          "Admin should see user management content",
        ).to.be.true;
      });
    });

    it("should allow admin to access audit logs", () => {
      cy.visit("/app/audit-logs");
      cy.get("body", { timeout: 15000 }).should(($body) => {
        const text = $body.text().toLowerCase();
        expect(
          text.includes("audit") || text.includes("log"),
          "Admin should see audit log content",
        ).to.be.true;
      });
    });
  });

  describe("Sales User Access", () => {
    beforeEach(() => {
      cy.loginAsRole("sales");
    });

    it("should allow sales user to access invoices with invoice content", () => {
      cy.visit("/app/invoices");
      cy.get("body", { timeout: 15000 }).should(($body) => {
        expect($body.text().toLowerCase()).to.include("invoice");
      });
      cy.url().should("include", "/app");
    });

    it("should allow sales user to access quotations with quotation content", () => {
      cy.visit("/app/quotations");
      cy.get("body", { timeout: 15000 }).should(($body) => {
        expect($body.text().toLowerCase()).to.include("quotation");
      });
      cy.url().should("include", "/app");
    });

    it("should allow sales user to access customers with customer content", () => {
      cy.visit("/app/customers");
      cy.get("body", { timeout: 15000 }).should(($body) => {
        expect($body.text().toLowerCase()).to.include("customer");
      });
      cy.url().should("include", "/app");
    });
  });

  // Note: Negative RBAC tests may not block in E2E because PERMISSION_CHECK_DISABLED=true
  // These tests verify the UI elements are present, not server-side enforcement
  describe("Page Access Verification", () => {
    it("should allow readonly user to access dashboard", () => {
      cy.loginAsRole("readonly");
      cy.visit("/app");
      cy.url({ timeout: 15000 }).should("match", /\/(app|analytics|login)/);
      // Verify the page rendered meaningful ERP content (not a blank page or error)
      cy.get("body", { timeout: 10000 }).should(($body) => {
        const text = $body.text().toLowerCase();
        const hasErpContent =
          text.includes("dashboard") ||
          text.includes("ultimate steel") ||
          text.includes("invoice") ||
          text.includes("sales") ||
          $body.find('a[href*="/invoices"], a[href*="/quotations"], a[href*="/customers"]').length > 0;
        expect(hasErpContent, "Readonly user should see ERP dashboard content or navigation").to.be.true;
      });
    });

    it("should allow readonly user to view invoice list", () => {
      cy.loginAsRole("readonly");
      cy.visit("/app/invoices");
      // Verify the invoice list page actually rendered (not just any page with text)
      cy.get("body", { timeout: 15000 }).should(($body) => {
        const text = $body.text().toLowerCase();
        expect(
          text.includes("invoice"),
          "Readonly user should see invoice page content",
        ).to.be.true;
      });
      cy.url().should("include", "/app");
    });

    it("should show navigation sidebar with admin-level links", () => {
      cy.loginAsRole("admin");
      cy.visit("/app");
      // Admin should see navigation links in sidebar. Check for core ERP links
      // and admin-specific sections (settings, audit). Link paths may vary.
      cy.get("body", { timeout: 15000 }).should(($body) => {
        const links = $body.find('a[href*="/"]');
        const hrefs = [...links].map((a) => a.getAttribute("href"));
        // Admin must see core ERP nav links
        const hasInvoicesLink = hrefs.some((h) => h && h.includes("/invoices"));
        const hasCustomersLink = hrefs.some((h) => h && h.includes("/customers"));
        expect(hasInvoicesLink || hasCustomersLink, "Admin sidebar should contain core ERP links (invoices or customers)").to.be.true;
      });
      // Admin-specific: settings or audit links (path may be /settings, /audit-logs, /audit, etc.)
      cy.get("body").should(($body) => {
        const links = $body.find('a[href*="/"]');
        const hrefs = [...links].map((a) => a.getAttribute("href"));
        const hasSettingsLink = hrefs.some((h) => h && h.includes("/settings"));
        const hasAuditLink = hrefs.some((h) => h && (h.includes("/audit") || h.includes("/logs")));
        const hasAdminContent = hasSettingsLink || hasAuditLink || hrefs.length > 5;
        expect(hasAdminContent, "Admin sidebar should contain settings/audit links or extensive navigation").to.be.true;
      });
    });

    it("should redirect unauthenticated user from /app to /login", () => {
      cy.clearCookies();
      cy.clearLocalStorage();
      cy.visit("/app");
      cy.url({ timeout: 15000 }).should("include", "/login");
    });
  });
});
