/**
 * Sanity Check: Prove tests are mock-based, not integration-based
 * This file intentionally breaks business rules to show tests don't catch it
 */

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

describe("SANITY CHECK: Mock-based tests do NOT catch business logic failures", () => {
  it("FAIL-FAST #1: Should FAIL if VAT rate is 0 (but it WON'T because test only checks mock state)", () => {
    const BrokenVAT = () => {
      const [invoice] = React.useState({
        customerLocation: "Dubai, UAE",
        subtotal: 10000,
        vatRate: 0, // BROKEN: Should be 0.05 for domestic, but test won't catch this
        vatAmount: 0, // BROKEN: Should be 500
        total: 10000, // BROKEN: Should be 10500
      });

      return (
        <>
          <div>Location: {invoice.customerLocation}</div>
          <div>VAT Rate: {invoice.vatRate * 100}%</div>
          <div>VAT Amount: {invoice.vatAmount}</div>
          <div>Total: {invoice.total}</div>
        </>
      );
    };

    render(<BrokenVAT />);

    // These assertions PASS because the mock is set up this way
    // But the REAL business rule (5% VAT for domestic sales) is violated!
    expect(screen.getByText("Location: Dubai, UAE")).toBeInTheDocument();
    expect(screen.getByText("VAT Rate: 0%")).toBeInTheDocument(); // ❌ SHOULD FAIL but doesn't
    expect(screen.getByText("VAT Amount: 0")).toBeInTheDocument(); // ❌ SHOULD FAIL but doesn't
    expect(screen.getByText("Total: 10000")).toBeInTheDocument(); // ❌ SHOULD FAIL but doesn't
  });

  it("FAIL-FAST #2: Should FAIL if company_id filter is removed (but it WON'T)", () => {
    const BrokenTenancy = () => {
      const currentCompanyId = "COMPANY-A";

      // BROKEN: Returns ALL invoices regardless of company filter
      const [invoices] = React.useState([
        { id: 1, companyId: "COMPANY-A", amount: 5000 },
        { id: 2, companyId: "COMPANY-B", amount: 7000 }, // Should NOT be visible
        { id: 3, companyId: "COMPANY-A", amount: 3000 },
      ]);

      return (
        <>
          <div>Company: {currentCompanyId}</div>
          {invoices.map((inv) => (
            <div key={inv.id}>
              INV-{inv.id}: {inv.amount}
            </div>
          ))}
        </>
      );
    };

    render(<BrokenTenancy />);

    expect(screen.getByText("INV-1: 5000")).toBeInTheDocument();
    expect(screen.getByText("INV-3: 3000")).toBeInTheDocument();
    expect(screen.getByText("INV-2: 7000")).toBeInTheDocument(); // SHOULD FAIL - Company B data leaked!
  });

  it("PROOF: Tests assert DOM state, NOT database state", () => {
    const MockInvoice = () => {
      const [invoice] = React.useState({
        id: "INV-001",
        total: 99999, // Nonsensical value
        status: "invalid_state", // Invalid status
        createdAt: "1970-01-01", // Unrealistic
      });

      return (
        <>
          <div>Invoice: {invoice.id}</div>
          <div>Total: {invoice.total}</div>
          <div>Status: {invoice.status}</div>
          <div>Created: {invoice.createdAt}</div>
        </>
      );
    };

    render(<MockInvoice />);

    // All assertions pass because we're just checking what the mock renders
    expect(screen.getByText("Invoice: INV-001")).toBeInTheDocument();
    expect(screen.getByText("Total: 99999")).toBeInTheDocument(); // Passes, but violates business rules
    expect(screen.getByText("Status: invalid_state")).toBeInTheDocument(); // Passes, but impossible state
    expect(screen.getByText("Created: 1970-01-01")).toBeInTheDocument(); // Passes, but unrealistic
  });
});
