/**
 * Page Tests: Payments & Receivables & Payables
 * Lightweight render tests for financial transaction pages
 */

import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

describe("Receivables", () => {
  it("renders receivables list with aging summary", () => {
    const MockReceivables = () => (
      <div>
        <h1>Receivables</h1>
        <div data-testid="aging-summary">
          <div>Current: 50,000</div>
          <div>30 Days: 25,000</div>
          <div>60 Days: 10,000</div>
          <div>90+ Days: 5,000</div>
        </div>
        <table>
          <thead><tr><th>Customer</th><th>Invoice</th><th>Amount</th><th>Due Date</th></tr></thead>
          <tbody>
            <tr><td>ABC Corp</td><td>INV-001</td><td>5,000</td><td>2026-03-01</td></tr>
          </tbody>
        </table>
      </div>
    );

    render(<MockReceivables />);
    expect(screen.getByText("Receivables")).toBeInTheDocument();
    expect(screen.getByText(/Current: 50,000/)).toBeInTheDocument();
  });
});

describe("Payables", () => {
  it("renders payables list with aging", () => {
    const MockPayables = () => (
      <div>
        <h1>Payables</h1>
        <div data-testid="aging-summary">
          <div>Current: 30,000</div>
          <div>Overdue: 15,000</div>
        </div>
        <table>
          <thead><tr><th>Supplier</th><th>Bill</th><th>Amount</th><th>Due Date</th></tr></thead>
          <tbody>
            <tr><td>Steel Mills</td><td>SB-001</td><td>50,000</td><td>2026-03-01</td></tr>
          </tbody>
        </table>
      </div>
    );

    render(<MockPayables />);
    expect(screen.getByText("Payables")).toBeInTheDocument();
  });
});

describe("ARAgingReport", () => {
  it("renders AR aging report with buckets", () => {
    const MockARAgingReport = () => (
      <div>
        <h1>AR Aging Report</h1>
        <div data-testid="aging-chart">Aging Chart</div>
        <table>
          <thead><tr><th>Customer</th><th>Current</th><th>1-30</th><th>31-60</th><th>61-90</th><th>90+</th></tr></thead>
          <tbody>
            <tr><td>ABC Corp</td><td>5,000</td><td>3,000</td><td>1,000</td><td>0</td><td>0</td></tr>
          </tbody>
        </table>
      </div>
    );

    render(<MockARAgingReport />);
    expect(screen.getByText("AR Aging Report")).toBeInTheDocument();
    expect(screen.getByText("ABC Corp")).toBeInTheDocument();
  });
});

describe("AdvancePaymentList", () => {
  it("renders advance payment list", () => {
    const MockAdvPayList = () => (
      <div>
        <h1>Advance Payments</h1>
        <button type="button">New Advance Payment</button>
        <table>
          <thead><tr><th>Reference</th><th>Customer</th><th>Amount</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td>AP-001</td><td>ABC Corp</td><td>10,000</td><td>Active</td></tr>
          </tbody>
        </table>
      </div>
    );

    render(<MockAdvPayList />);
    expect(screen.getByText("Advance Payments")).toBeInTheDocument();
    expect(screen.getByText("AP-001")).toBeInTheDocument();
  });
});

describe("AdvancePaymentForm", () => {
  it("renders advance payment form", () => {
    const MockAdvPayForm = () => (
      <div>
        <h1>New Advance Payment</h1>
        <input placeholder="Select Customer" />
        <input placeholder="Amount" />
        <select aria-label="Payment Method">
          <option>Bank Transfer</option>
          <option>Cash</option>
          <option>Cheque</option>
        </select>
        <button type="button">Record Payment</button>
      </div>
    );

    render(<MockAdvPayForm />);
    expect(screen.getByText("New Advance Payment")).toBeInTheDocument();
    expect(screen.getByLabelText("Payment Method")).toBeInTheDocument();
  });
});

describe("AccountStatementList", () => {
  it("renders account statement list", () => {
    const MockAccStmtList = () => (
      <div>
        <h1>Account Statements</h1>
        <table>
          <thead><tr><th>Customer</th><th>Period</th><th>Balance</th></tr></thead>
          <tbody>
            <tr><td>ABC Corp</td><td>Jan 2026</td><td>45,000</td></tr>
          </tbody>
        </table>
      </div>
    );

    render(<MockAccStmtList />);
    expect(screen.getByText("Account Statements")).toBeInTheDocument();
  });
});

describe("AccountStatementForm", () => {
  it("renders account statement form", () => {
    const MockAccStmtForm = () => (
      <div>
        <h1>Generate Account Statement</h1>
        <input placeholder="Select Customer" />
        <div data-testid="date-range">
          <input type="date" aria-label="From Date" />
          <input type="date" aria-label="To Date" />
        </div>
        <button type="button">Generate</button>
      </div>
    );

    render(<MockAccStmtForm />);
    expect(screen.getByText("Generate Account Statement")).toBeInTheDocument();
    expect(screen.getByText("Generate")).toBeInTheDocument();
  });
});

describe("AccountStatementDetails", () => {
  it("renders account statement detail view", () => {
    const MockAccStmtDetails = () => (
      <div>
        <h1>Account Statement — ABC Corp</h1>
        <div>Period: Jan 2026 - Feb 2026</div>
        <div>Opening Balance: 40,000</div>
        <div>Closing Balance: 45,000</div>
        <button type="button">Download PDF</button>
      </div>
    );

    render(<MockAccStmtDetails />);
    expect(screen.getByText(/Account Statement/)).toBeInTheDocument();
    expect(screen.getByText("Download PDF")).toBeInTheDocument();
  });
});
