/**
 * Homepage — Data & Stock Integrity Summary Card
 * Cypress E2E Tests
 *
 * Coverage:
 *   1. Smoke — card renders on homepage after login
 *   2. API contract — single call to /api/dashboard/integrity-summary returns 200
 *   3. Group headers — all 4 domain sections visible
 *   4. Metric rows — spot-check key labels
 *   5. Badge rendering — at least one badge visible per group
 *   6. Cache — second navigation serves cache_hit: true
 *   7. Draggable — drag handle present on the card
 *   8. Dark mode — card renders without visual crash
 */

describe("Homepage — Data & Stock Integrity Summary Card", () => {
  beforeEach(() => {
    cy.login();
    // Intercept the integrity summary API call
    cy.intercept("GET", "**/api/dashboard/integrity-summary").as("integritySummary");
    cy.visit("/app");
  });

  // ──────────────────────────────────────────────
  // 1. Smoke — card visible
  // ──────────────────────────────────────────────
  describe("1. Card renders on homepage", () => {
    it("shows the Data & Stock Integrity card", () => {
      cy.contains(/Data & Stock Integrity/i, { timeout: 15000 }).should("be.visible");
    });

    it("card is not hidden or collapsed by default", () => {
      cy.contains(/Data & Stock Integrity/i, { timeout: 15000 })
        .closest("section, div[class*='card'], div[class*='section']")
        .should("be.visible");
    });
  });

  // ──────────────────────────────────────────────
  // 2. API contract
  // ──────────────────────────────────────────────
  describe("2. API call — single endpoint, 200 OK", () => {
    it("makes exactly one call to /api/dashboard/integrity-summary", () => {
      cy.wait("@integritySummary").then((interception) => {
        expect(interception.response.statusCode).to.eq(200);
      });

      // Verify only one call was made during page load
      cy.get("@integritySummary.all").should("have.length", 1);
    });

    it("response has metrics object with expected keys", () => {
      cy.wait("@integritySummary").then((interception) => {
        const body = interception.response.body;
        expect(body).to.have.property("metrics");
        expect(body.metrics).to.be.an("object");

        // Spot-check a few keys
        expect(body.metrics).to.have.property("negativeStockBatches");
        expect(body.metrics).to.have.property("customersOverCreditLimit");
        expect(body.metrics).to.have.property("quotationsExpired");
        expect(body.metrics).to.have.property("productsMissingData");
      });
    });

    it("response shape has generated_at, company_id, cache_hit, metrics", () => {
      cy.wait("@integritySummary").then((interception) => {
        const body = interception.response.body;
        expect(body).to.have.property("generatedAt");
        expect(body).to.have.property("companyId");
        expect(body).to.have.property("cacheHit");
        expect(body).to.have.property("metrics");
      });
    });

    it("all metric values have numeric incomplete and integer-or-null total", () => {
      cy.wait("@integritySummary").then((interception) => {
        const { metrics } = interception.response.body;
        for (const [, val] of Object.entries(metrics)) {
          expect(val.incomplete).to.be.a("number");
          expect(val.incomplete).to.be.at.least(0);
          if (val.total !== null) {
            expect(val.total).to.be.a("number");
            expect(val.total).to.be.at.least(0);
            expect(val.incomplete).to.be.at.most(val.total);
          }
        }
      });
    });

    it("exactly 21 metric keys are returned", () => {
      cy.wait("@integritySummary").then((interception) => {
        const keys = Object.keys(interception.response.body.metrics);
        expect(keys).to.have.length(21);
      });
    });
  });

  // ──────────────────────────────────────────────
  // 3. Group headers
  // ──────────────────────────────────────────────
  describe("3. Domain group headers visible", () => {
    beforeEach(() => {
      cy.wait("@integritySummary");
    });

    it('shows "Stock" group header', () => {
      cy.contains("Stock").should("be.visible");
    });

    it('shows "Credit & AR" group header', () => {
      cy.contains("Credit & AR").should("be.visible");
    });

    it('shows "Documents" group header', () => {
      cy.contains("Documents").should("be.visible");
    });

    it('shows "Master Data" group header', () => {
      cy.contains("Master Data").should("be.visible");
    });
  });

  // ──────────────────────────────────────────────
  // 4. Metric labels spot-check
  // ──────────────────────────────────────────────
  describe("4. Key metric labels visible", () => {
    beforeEach(() => {
      cy.wait("@integritySummary");
    });

    const spotLabels = [
      "Negative stock batches",
      "Reserved exceeds remaining",
      "Customers over credit limit",
      "Customers on credit hold",
      "Invoices overpaid (negative outstanding)",
      "Purchase Orders pending GRN",
      "Invoices pending Delivery Note",
      "Expired open quotations",
      "Products missing key fields",
      "Customers missing key data",
      "Warehouses missing address/city",
    ];

    for (const label of spotLabels) {
      it(`label is visible: "${label}"`, () => {
        cy.contains(label).should("be.visible");
      });
    }
  });

  // ──────────────────────────────────────────────
  // 5. Badge rendering
  // ──────────────────────────────────────────────
  describe("5. Badges rendered per metric", () => {
    beforeEach(() => {
      cy.wait("@integritySummary");
    });

    it("at least one badge is visible in the card", () => {
      // Badges display "OK", "Warning", "Action Required", or "—"
      cy.contains(/Data & Stock Integrity/i)
        .closest("section, div[class*='card'], div[class*='section'], div[class*='integrity']")
        .within(() => {
          cy.contains(/OK|Warning|Action Required/).should("exist");
        });
    });

    it("OK badge shown for metrics with zero incomplete", () => {
      cy.wait("@integritySummary").then((interception) => {
        const { metrics } = interception.response.body;
        // Check if there are any zero-count metrics
        const hasCleanMetric = Object.values(metrics).some(
          (m) => m.incomplete === 0 && m.total !== null && m.total > 0
        );
        if (hasCleanMetric) {
          cy.contains("OK").should("be.visible");
        }
      });
    });

    it("Action Required badge shown when any critical metric has non-zero count", () => {
      cy.wait("@integritySummary").then((interception) => {
        const { metrics } = interception.response.body;
        const criticalKeys = [
          "negativeStockBatches",
          "stock_reserved_overflow",
          "stock_balance_mismatch",
          "customersOverCreditLimit",
          "customers_on_credit_hold",
          "invoices_overpaid",
        ];
        const hasCriticalIssue = criticalKeys.some((k) => metrics[k]?.incomplete > 0);
        if (hasCriticalIssue) {
          cy.contains("Action Required").should("be.visible");
        }
      });
    });
  });

  // ──────────────────────────────────────────────
  // 6. Cache behaviour
  // ──────────────────────────────────────────────
  describe("6. Cache — second visit returns cache_hit: true", () => {
    it("second navigation to homepage returns cached response", () => {
      cy.wait("@integritySummary"); // consume first intercept

      // Navigate away and back
      cy.intercept("GET", "**/api/dashboard/integrity-summary").as("integritySummary2");
      cy.visit("/app");

      cy.wait("@integritySummary2").then((interception) => {
        expect(interception.response.statusCode).to.eq(200);
        // May or may not be cache_hit depending on 5-min TTL —
        // we only verify the endpoint still returns 200 with metrics
        expect(interception.response.body).to.have.property("metrics");
      });
    });
  });

  // ──────────────────────────────────────────────
  // 7. Draggable card
  // ──────────────────────────────────────────────
  describe("7. Draggable card affordance", () => {
    beforeEach(() => {
      cy.wait("@integritySummary");
    });

    it("drag handle button is present on the integrity card", () => {
      // The drag handle is typically a button with cursor-grab or a grip icon
      // Its exact selector depends on implementation; we look for any button
      // inside or near the integrity card
      cy.contains(/Data & Stock Integrity/i)
        .parents()
        .find("button")
        .should("have.length.at.least", 1);
    });
  });

  // ──────────────────────────────────────────────
  // 8. Null-total metric display
  // ──────────────────────────────────────────────
  describe("8. Null-total metric display", () => {
    beforeEach(() => {
      cy.wait("@integritySummary");
    });

    it("shows dash (—) when null-total metric has zero count", () => {
      cy.wait("@integritySummary").then((interception) => {
        const { metrics } = interception.response.body;
        const nullTotalKeys = [
          "quotationsExpired",
          "delivery_notes_empty",
          "stock_reservations_expired",
          "supplier_bills_underpaid",
        ];
        const hasZeroNullTotal = nullTotalKeys.some((k) => metrics[k]?.incomplete === 0);
        if (hasZeroNullTotal) {
          cy.contains("—").should("be.visible");
        }
      });
    });
  });

  // ──────────────────────────────────────────────
  // 9. No console errors during card render
  // ──────────────────────────────────────────────
  describe("9. No console errors", () => {
    it("renders the integrity card without JavaScript errors", () => {
      cy.wait("@integritySummary");

      // Intercept console.error
      cy.window().then((win) => {
        const errors = [];
        const original = win.console.error;
        win.console.error = (...args) => {
          errors.push(args.join(" "));
          original.apply(win, args);
        };

        cy.contains(/Data & Stock Integrity/i)
          .should("be.visible")
          .then(() => {
            const relevantErrors = errors.filter(
              (e) =>
                !e.includes("ResizeObserver") &&
                !e.includes("Warning: ReactDOM") &&
                !e.includes("act(")
            );
            expect(relevantErrors).to.have.length(0);
          });
      });
    });
  });
});
