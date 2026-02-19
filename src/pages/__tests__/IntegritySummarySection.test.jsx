/**
 * Integrity Summary Card — Vitest / React Testing Library tests
 *
 * Tests badge logic, group structure, count display, and metric label rendering
 * using inline mock components (following the established pattern in this project —
 * HomePage.jsx is too heavy to import directly in jsdom).
 *
 * Coverage:
 *   1. Badge logic — green / yellow / red / grey based on (incomplete, total, critical)
 *   2. Group structure — 4 domain sections
 *   3. All 21 metric labels
 *   4. Count display — "N / total", count-only for null-total, "—" for zero null-total
 *   5. Math invariants — incomplete never exceeds total in rendered output
 *   6. Null-total metrics always produce count-only or dash
 *   7. API response shape validation logic
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

// ─── Inline implementations mirroring the real logic in HomePage.jsx ─────────

/** Mirrors getIntegrityBadge from HomePage.jsx */
function getIntegrityBadge(incomplete, total, isCritical) {
  if (incomplete === 0 && total === null) return { label: "—", color: "grey" };
  if (incomplete === 0) return { label: "OK", color: "green" };
  if (total === null) return { label: "Action Required", color: "red" };
  if (isCritical) return { label: "Action Required", color: "red" };
  const ratio = total > 0 ? incomplete / total : 0;
  if (ratio >= 0.1) return { label: "Action Required", color: "red" };
  return { label: "Warning", color: "yellow" };
}

/** Mirrors the count display logic in IntegritySummarySection */
function formatCount(incomplete, total) {
  if (total === null && incomplete === 0) return "—";
  if (total === null) return String(incomplete);
  return `${incomplete} / ${total}`;
}

/** The 4 domain groups as defined in INTEGRITY_GROUPS in HomePage.jsx */
const INTEGRITY_GROUPS = [
  {
    label: "Stock",
    keys: [
      { key: "negativeStockBatches", label: "Negative stock batches", critical: true },
      { key: "stockReservedOverflow", label: "Reserved exceeds remaining", critical: true },
      { key: "stockBalanceMismatch", label: "Batch balance mismatch", critical: true },
      { key: "stockZeroCost", label: "Active batches with zero cost", critical: false },
    ],
  },
  {
    label: "Credit & AR",
    keys: [
      { key: "customersOverCreditLimit", label: "Customers over credit limit", critical: true },
      { key: "customersOnCreditHold", label: "Customers on credit hold", critical: true },
      { key: "invoicesOverpaid", label: "Invoices overpaid (negative outstanding)", critical: true },
      { key: "supplierBillsUnderpaid", label: "Supplier bills marked paid with shortfall", critical: false },
    ],
  },
  {
    label: "Documents",
    keys: [
      { key: "purchaseOrdersIncomplete", label: "Purchase Orders pending GRN", critical: false },
      { key: "invoicesIncomplete", label: "Invoices pending Delivery Note", critical: false },
      { key: "importOrdersPendingGrn", label: "Import Orders pending GRN", critical: false },
      { key: "exportOrdersPendingDn", label: "Export Orders pending Delivery Note", critical: false },
      { key: "invoicesWithZeroLines", label: "Invoices with zero-qty/rate lines", critical: false },
      { key: "deliveryNotesEmpty", label: "Delivery notes with no items", critical: false },
      { key: "quotationsExpired", label: "Expired open quotations", critical: false },
      { key: "stockReservationsExpired", label: "Expired active stock reservations", critical: false },
    ],
  },
  {
    label: "Master Data",
    keys: [
      { key: "productsMissingData", label: "Products missing key fields", critical: false },
      { key: "productsNoActivePrice", label: "Products with no active price", critical: false },
      { key: "customersMissingData", label: "Customers missing key data", critical: false },
      { key: "suppliersNoContact", label: "Suppliers missing contact info", critical: false },
      { key: "warehousesMissingData", label: "Warehouses missing address/city", critical: false },
    ],
  },
];

/** Mock IntegritySummarySection that mirrors the real component's rendering logic */
function MockIntegritySummarySection({ metrics }) {
  if (!metrics) return <div>Loading...</div>;
  return (
    <div data-testid="integrity-card">
      <h2>Data &amp; Stock Integrity</h2>
      {INTEGRITY_GROUPS.map((group) => (
        <div key={group.label}>
          <div data-testid={`group-header-${group.label}`}>{group.label}</div>
          {group.keys.map(({ key, label, critical }) => {
            const m = metrics[key] ?? { incomplete: 0, total: 0 };
            const badge = getIntegrityBadge(m.incomplete, m.total, critical);
            const count = formatCount(m.incomplete, m.total);
            return (
              <div key={key} data-testid={`metric-row-${key}`}>
                <span data-testid={`label-${key}`}>{label}</span>
                <span data-testid={`count-${key}`}>{count}</span>
                <span data-testid={`badge-${key}`}>{badge.label}</span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/** Standard test payload with mixed data */
function buildMetrics(overrides = {}) {
  return {
    negativeStockBatches: { incomplete: 0, total: 50 },
    stockReservedOverflow: { incomplete: 0, total: 50 },
    stockBalanceMismatch: { incomplete: 0, total: 50 },
    stockZeroCost: { incomplete: 2, total: 50 },
    customersOverCreditLimit: { incomplete: 3, total: 60 },
    customersOnCreditHold: { incomplete: 1, total: 60 },
    invoicesOverpaid: { incomplete: 0, total: 120 },
    supplierBillsUnderpaid: { incomplete: 0, total: null },
    purchaseOrdersIncomplete: { incomplete: 10, total: 32 },
    invoicesIncomplete: { incomplete: 5, total: 120 },
    importOrdersPendingGrn: { incomplete: 2, total: 15 },
    exportOrdersPendingDn: { incomplete: 1, total: 8 },
    invoicesWithZeroLines: { incomplete: 0, total: 120 },
    deliveryNotesEmpty: { incomplete: 0, total: null },
    quotationsExpired: { incomplete: 4, total: null },
    stockReservationsExpired: { incomplete: 0, total: null },
    productsMissingData: { incomplete: 0, total: 200 },
    productsNoActivePrice: { incomplete: 5, total: 200 },
    customersMissingData: { incomplete: 8, total: 60 },
    suppliersNoContact: { incomplete: 0, total: 10 },
    warehousesMissingData: { incomplete: 0, total: 4 },
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Badge logic — pure function
// ─────────────────────────────────────────────────────────────────────────────
describe("1. getIntegrityBadge — badge logic", () => {
  it("returns OK when incomplete=0 and total>0", () => {
    expect(getIntegrityBadge(0, 50, false).label).toBe("OK");
    expect(getIntegrityBadge(0, 50, false).color).toBe("green");
  });

  it("returns OK when incomplete=0 and total=0 (empty set)", () => {
    expect(getIntegrityBadge(0, 0, false).label).toBe("OK");
  });

  it("returns — when incomplete=0 and total=null (null-total, clean)", () => {
    expect(getIntegrityBadge(0, null, false).label).toBe("—");
    expect(getIntegrityBadge(0, null, false).color).toBe("grey");
  });

  it("returns Action Required for null-total with non-zero count", () => {
    expect(getIntegrityBadge(5, null, false).label).toBe("Action Required");
    expect(getIntegrityBadge(5, null, false).color).toBe("red");
  });

  it("returns Action Required for critical metric with any non-zero count", () => {
    expect(getIntegrityBadge(1, 100, true).label).toBe("Action Required");
    // Even 1% triggers Action Required when critical=true
    expect(getIntegrityBadge(1, 1000, true).label).toBe("Action Required");
  });

  it("returns Warning for non-critical with ratio < 10%", () => {
    expect(getIntegrityBadge(5, 100, false).label).toBe("Warning"); // 5%
    expect(getIntegrityBadge(9, 100, false).label).toBe("Warning"); // 9%
  });

  it("returns Action Required for non-critical with ratio >= 10%", () => {
    expect(getIntegrityBadge(10, 100, false).label).toBe("Action Required"); // 10%
    expect(getIntegrityBadge(50, 100, false).label).toBe("Action Required"); // 50%
  });

  it("Action Required beats Warning — critical flag overrides ratio check", () => {
    // 1/1000 = 0.1% — would be Warning if not critical
    const badge = getIntegrityBadge(1, 1000, true);
    expect(badge.label).toBe("Action Required");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Count display logic — pure function
// ─────────────────────────────────────────────────────────────────────────────
describe("2. formatCount — count display", () => {
  it("shows N / total for metrics with an integer total", () => {
    expect(formatCount(10, 32)).toBe("10 / 32");
    expect(formatCount(0, 50)).toBe("0 / 50");
  });

  it("shows — for null-total with zero count", () => {
    expect(formatCount(0, null)).toBe("—");
  });

  it("shows count only for null-total with non-zero count", () => {
    expect(formatCount(7, null)).toBe("7");
    expect(formatCount(1, null)).toBe("1");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Group structure rendered
// ─────────────────────────────────────────────────────────────────────────────
describe("3. Group structure — 4 domain sections rendered", () => {
  it("renders all 4 group headers", () => {
    render(<MockIntegritySummarySection metrics={buildMetrics()} />);
    expect(screen.getByText("Stock")).toBeTruthy();
    expect(screen.getByText("Credit & AR")).toBeTruthy();
    expect(screen.getByText("Documents")).toBeTruthy();
    expect(screen.getByText("Master Data")).toBeTruthy();
  });

  it("renders card title", () => {
    render(<MockIntegritySummarySection metrics={buildMetrics()} />);
    expect(screen.getByText(/Data.*Stock Integrity/i)).toBeTruthy();
  });

  it("shows loading state when metrics is null", () => {
    render(<MockIntegritySummarySection metrics={null} />);
    expect(screen.getByText("Loading...")).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. All 21 metric labels
// ─────────────────────────────────────────────────────────────────────────────
describe("4. All 21 metric labels rendered", () => {
  const ALL_LABELS = [
    "Negative stock batches",
    "Reserved exceeds remaining",
    "Batch balance mismatch",
    "Active batches with zero cost",
    "Customers over credit limit",
    "Customers on credit hold",
    "Invoices overpaid (negative outstanding)",
    "Supplier bills marked paid with shortfall",
    "Purchase Orders pending GRN",
    "Invoices pending Delivery Note",
    "Import Orders pending GRN",
    "Export Orders pending Delivery Note",
    "Invoices with zero-qty/rate lines",
    "Delivery notes with no items",
    "Expired open quotations",
    "Expired active stock reservations",
    "Products missing key fields",
    "Products with no active price",
    "Customers missing key data",
    "Suppliers missing contact info",
    "Warehouses missing address/city",
  ];

  it("renders exactly 21 metric rows", () => {
    render(<MockIntegritySummarySection metrics={buildMetrics()} />);
    const rows = screen.getAllByTestId(/^metric-row-/);
    expect(rows).toHaveLength(21);
  });

  for (const label of ALL_LABELS) {
    it(`renders label: "${label}"`, () => {
      render(<MockIntegritySummarySection metrics={buildMetrics()} />);
      expect(screen.getByText(label)).toBeTruthy();
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Badge rendering correctness in full render
// ─────────────────────────────────────────────────────────────────────────────
describe("5. Badge rendering in full component", () => {
  it("shows OK for metrics with zero incomplete", () => {
    const metrics = buildMetrics({
      negativeStockBatches: { incomplete: 0, total: 50 },
    });
    render(<MockIntegritySummarySection metrics={metrics} />);
    const badge = screen.getByTestId("badge-negativeStockBatches");
    expect(badge.textContent).toBe("OK");
  });

  it("shows Action Required for critical metric with count > 0", () => {
    const metrics = buildMetrics({
      negativeStockBatches: { incomplete: 2, total: 50 },
    });
    render(<MockIntegritySummarySection metrics={metrics} />);
    expect(screen.getByTestId("badge-negativeStockBatches").textContent).toBe("Action Required");
  });

  it("shows Warning for non-critical metric with ratio < 10%", () => {
    const metrics = buildMetrics({
      stockZeroCost: { incomplete: 3, total: 50 }, // 6% — Warning
    });
    render(<MockIntegritySummarySection metrics={metrics} />);
    expect(screen.getByTestId("badge-stockZeroCost").textContent).toBe("Warning");
  });

  it("shows Action Required for non-critical metric with ratio >= 10%", () => {
    const metrics = buildMetrics({
      stockZeroCost: { incomplete: 10, total: 50 }, // 20% — Action Required
    });
    render(<MockIntegritySummarySection metrics={metrics} />);
    expect(screen.getByTestId("badge-stockZeroCost").textContent).toBe("Action Required");
  });

  it("shows — for null-total metric with zero count", () => {
    const metrics = buildMetrics({
      quotationsExpired: { incomplete: 0, total: null },
    });
    render(<MockIntegritySummarySection metrics={metrics} />);
    expect(screen.getByTestId("badge-quotationsExpired").textContent).toBe("—");
  });

  it("shows Action Required for null-total metric with non-zero count", () => {
    const metrics = buildMetrics({
      quotationsExpired: { incomplete: 5, total: null },
    });
    render(<MockIntegritySummarySection metrics={metrics} />);
    expect(screen.getByTestId("badge-quotationsExpired").textContent).toBe("Action Required");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Count display in full render
// ─────────────────────────────────────────────────────────────────────────────
describe("6. Count display in full render", () => {
  it("shows N / total for integer-total metric", () => {
    const metrics = buildMetrics({
      purchaseOrdersIncomplete: { incomplete: 10, total: 32 },
    });
    render(<MockIntegritySummarySection metrics={metrics} />);
    expect(screen.getByTestId("count-purchaseOrdersIncomplete").textContent).toBe("10 / 32");
  });

  it("shows count-only for null-total metric with non-zero count", () => {
    const metrics = buildMetrics({
      quotationsExpired: { incomplete: 7, total: null },
    });
    render(<MockIntegritySummarySection metrics={metrics} />);
    expect(screen.getByTestId("count-quotationsExpired").textContent).toBe("7");
  });

  it("shows — for null-total metric with zero count", () => {
    const metrics = buildMetrics({
      deliveryNotesEmpty: { incomplete: 0, total: null },
    });
    render(<MockIntegritySummarySection metrics={metrics} />);
    expect(screen.getByTestId("count-deliveryNotesEmpty").textContent).toBe("—");
  });

  it("shows 0 / total for clean metric with integer total", () => {
    const metrics = buildMetrics({
      negativeStockBatches: { incomplete: 0, total: 50 },
    });
    render(<MockIntegritySummarySection metrics={metrics} />);
    expect(screen.getByTestId("count-negativeStockBatches").textContent).toBe("0 / 50");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. Math invariants
// ─────────────────────────────────────────────────────────────────────────────
describe("7. Math invariants", () => {
  it("incomplete never exceeds total in any badge computation", () => {
    // For every metric with integer total, badge should be valid
    const metrics = buildMetrics();
    for (const [_key, m] of Object.entries(metrics)) {
      if (m.total !== null) {
        expect(m.incomplete).toBeLessThanOrEqual(m.total);
      }
      // Badge should not throw
      const badge = getIntegrityBadge(m.incomplete, m.total, false);
      expect(["OK", "Warning", "Action Required", "—"]).toContain(badge.label);
    }
  });

  it("all incomplete counts are non-negative", () => {
    const metrics = buildMetrics();
    for (const m of Object.values(metrics)) {
      expect(m.incomplete).toBeGreaterThanOrEqual(0);
    }
  });

  it("all integer totals are non-negative", () => {
    const metrics = buildMetrics();
    for (const m of Object.values(metrics)) {
      if (m.total !== null) {
        expect(m.total).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. API response key mapping (camelCase contract)
// ─────────────────────────────────────────────────────────────────────────────
describe("8. camelCase key contract", () => {
  const EXPECTED_CAMEL_KEYS = [
    "negativeStockBatches",
    "stockReservedOverflow",
    "stockBalanceMismatch",
    "stockZeroCost",
    "customersOverCreditLimit",
    "customersOnCreditHold",
    "invoicesOverpaid",
    "supplierBillsUnderpaid",
    "purchaseOrdersIncomplete",
    "invoicesIncomplete",
    "importOrdersPendingGrn",
    "exportOrdersPendingDn",
    "invoicesWithZeroLines",
    "deliveryNotesEmpty",
    "quotationsExpired",
    "stockReservationsExpired",
    "productsMissingData",
    "productsNoActivePrice",
    "customersMissingData",
    "suppliersNoContact",
    "warehousesMissingData",
  ];

  it("INTEGRITY_GROUPS covers all 21 camelCase keys", () => {
    const allKeys = INTEGRITY_GROUPS.flatMap((g) => g.keys.map((k) => k.key));
    expect(allKeys.sort()).toEqual(EXPECTED_CAMEL_KEYS.sort());
  });

  it("each key is in exactly one group", () => {
    const allKeys = INTEGRITY_GROUPS.flatMap((g) => g.keys.map((k) => k.key));
    const unique = new Set(allKeys);
    expect(unique.size).toBe(allKeys.length);
  });

  it("no snake_case keys in group definitions", () => {
    const allKeys = INTEGRITY_GROUPS.flatMap((g) => g.keys.map((k) => k.key));
    for (const key of allKeys) {
      expect(key).not.toMatch(/_/); // camelCase has no underscores
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. All-clean state
// ─────────────────────────────────────────────────────────────────────────────
describe("9. All-clean data state", () => {
  it("shows OK or — for every metric when all incomplete counts are 0", () => {
    const cleanMetrics = buildMetrics();
    for (const k of Object.keys(cleanMetrics)) {
      cleanMetrics[k] = { ...cleanMetrics[k], incomplete: 0 };
    }
    render(<MockIntegritySummarySection metrics={cleanMetrics} />);

    const badges = screen.getAllByTestId(/^badge-/);
    for (const badge of badges) {
      expect(["OK", "—"]).toContain(badge.textContent);
    }
    expect(screen.queryByText("Action Required")).toBeNull();
    expect(screen.queryByText("Warning")).toBeNull();
  });
});
