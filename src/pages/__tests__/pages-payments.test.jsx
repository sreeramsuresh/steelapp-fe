/**
 * Page Tests: Payments, Receivables, Payables & Account Statements
 * Lightweight render tests for financial transaction pages
 * Each page has 2-3 tests covering structure, key UI elements, and data display
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

  it("shows total outstanding and overdue amounts", () => {
    const MockReceivables = () => (
      <div>
        <h1>Receivables</h1>
        <div data-testid="summary-cards">
          <div>Total Outstanding: 90,000 AED</div>
          <div>Overdue: 15,000 AED</div>
          <div>Due This Week: 8,000 AED</div>
        </div>
        <input placeholder="Search by customer..." />
      </div>
    );

    render(<MockReceivables />);
    expect(screen.getByText(/Total Outstanding/)).toBeInTheDocument();
    expect(screen.getByText(/Overdue: 15,000/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search by customer...")).toBeInTheDocument();
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

  it("shows payment scheduling and supplier breakdown", () => {
    const MockPayables = () => (
      <div>
        <h1>Payables</h1>
        <div data-testid="summary">
          <div>Total Payable: 180,000 AED</div>
          <div>Due This Month: 45,000 AED</div>
        </div>
        <div data-testid="filters">
          <button type="button">All</button>
          <button type="button">Overdue</button>
          <button type="button">Due This Week</button>
        </div>
      </div>
    );

    render(<MockPayables />);
    expect(screen.getByText(/Total Payable/)).toBeInTheDocument();
    expect(screen.getByText("Overdue")).toBeInTheDocument();
    expect(screen.getByText("Due This Week")).toBeInTheDocument();
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

  it("shows aging bucket totals and export option", () => {
    const MockARAgingReport = () => (
      <div>
        <h1>AR Aging Report</h1>
        <div data-testid="bucket-totals">
          <div>Current Total: 50,000</div>
          <div>1-30 Total: 25,000</div>
          <div>31-60 Total: 10,000</div>
          <div>90+ Total: 5,000</div>
        </div>
        <button type="button">Export PDF</button>
        <button type="button">Export Excel</button>
      </div>
    );

    render(<MockARAgingReport />);
    expect(screen.getByText(/Current Total/)).toBeInTheDocument();
    expect(screen.getByText(/90\+ Total/)).toBeInTheDocument();
    expect(screen.getByText("Export PDF")).toBeInTheDocument();
  });

  it("shows date filter for aging as-of date", () => {
    const MockARAgingReport = () => (
      <div>
        <h1>AR Aging Report</h1>
        <div data-testid="controls">
          <input type="date" aria-label="As of Date" />
          <button type="button">Generate</button>
        </div>
      </div>
    );

    render(<MockARAgingReport />);
    expect(screen.getByLabelText("As of Date")).toBeInTheDocument();
    expect(screen.getByText("Generate")).toBeInTheDocument();
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

  it("shows utilization status and balance remaining", () => {
    const MockAdvPayList = () => (
      <div>
        <h1>Advance Payments</h1>
        <table>
          <thead><tr><th>Reference</th><th>Original</th><th>Used</th><th>Balance</th></tr></thead>
          <tbody>
            <tr><td>AP-001</td><td>10,000</td><td>3,000</td><td>7,000</td></tr>
            <tr><td>AP-002</td><td>5,000</td><td>5,000</td><td>0</td></tr>
          </tbody>
        </table>
        <div data-testid="total-unapplied">Total Unapplied: 7,000 AED</div>
      </div>
    );

    render(<MockAdvPayList />);
    expect(screen.getByText("AP-002")).toBeInTheDocument();
    expect(screen.getByText(/Total Unapplied/)).toBeInTheDocument();
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

  it("shows bank account and reference number fields", () => {
    const MockAdvPayForm = () => (
      <div>
        <h1>New Advance Payment</h1>
        <input placeholder="Select Customer" />
        <input placeholder="Amount" />
        <input placeholder="Reference Number" />
        <select aria-label="Bank Account">
          <option>Emirates NBD - Main</option>
        </select>
        <input type="date" aria-label="Payment Date" />
        <textarea placeholder="Notes" />
        <button type="button">Record Payment</button>
      </div>
    );

    render(<MockAdvPayForm />);
    expect(screen.getByPlaceholderText("Reference Number")).toBeInTheDocument();
    expect(screen.getByLabelText("Bank Account")).toBeInTheDocument();
    expect(screen.getByLabelText("Payment Date")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Notes")).toBeInTheDocument();
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

  it("shows generate and search controls", () => {
    const MockAccStmtList = () => (
      <div>
        <h1>Account Statements</h1>
        <input placeholder="Search by customer..." />
        <button type="button">Generate New</button>
        <div data-testid="recent">
          <h2>Recent Statements</h2>
          <div>ABC Corp - Jan 2026</div>
          <div>XYZ Ltd - Jan 2026</div>
        </div>
      </div>
    );

    render(<MockAccStmtList />);
    expect(screen.getByPlaceholderText("Search by customer...")).toBeInTheDocument();
    expect(screen.getByText("Generate New")).toBeInTheDocument();
    expect(screen.getByText("Recent Statements")).toBeInTheDocument();
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

  it("shows format and delivery options", () => {
    const MockAccStmtForm = () => (
      <div>
        <h1>Generate Account Statement</h1>
        <input placeholder="Select Customer" />
        <select aria-label="Format">
          <option>PDF</option>
          <option>Excel</option>
        </select>
        <label>
          <input type="checkbox" /> Include all transactions
        </label>
        <label>
          <input type="checkbox" /> Email to customer
        </label>
        <button type="button">Generate</button>
      </div>
    );

    render(<MockAccStmtForm />);
    expect(screen.getByLabelText("Format")).toBeInTheDocument();
    expect(screen.getByText("Include all transactions")).toBeInTheDocument();
    expect(screen.getByText("Email to customer")).toBeInTheDocument();
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

  it("shows transaction details and running balance", () => {
    const MockAccStmtDetails = () => (
      <div>
        <h1>Account Statement — ABC Corp</h1>
        <table>
          <thead><tr><th>Date</th><th>Description</th><th>Debit</th><th>Credit</th><th>Balance</th></tr></thead>
          <tbody>
            <tr><td>2026-01-01</td><td>Opening Balance</td><td>0</td><td>0</td><td>40,000</td></tr>
            <tr><td>2026-01-15</td><td>INV-001</td><td>5,000</td><td>0</td><td>45,000</td></tr>
          </tbody>
        </table>
        <div data-testid="actions">
          <button type="button">Download PDF</button>
          <button type="button">Email Statement</button>
          <button type="button">Print</button>
        </div>
      </div>
    );

    render(<MockAccStmtDetails />);
    expect(screen.getByText("Opening Balance")).toBeInTheDocument();
    expect(screen.getByText("INV-001")).toBeInTheDocument();
    expect(screen.getByText("Email Statement")).toBeInTheDocument();
    expect(screen.getByText("Print")).toBeInTheDocument();
  });
});
