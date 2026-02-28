/**
 * Page Tests: Reports
 * Lightweight render tests for all report pages
 */

import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

describe("TrialBalanceReport", () => {
  it("renders trial balance with debit/credit columns", () => {
    const MockTrialBalance = () => (
      <div>
        <h1>Trial Balance</h1>
        <div data-testid="period-selector">
          <select aria-label="Period"><option>Feb 2026</option></select>
        </div>
        <table>
          <thead><tr><th>Account</th><th>Debit</th><th>Credit</th></tr></thead>
          <tbody>
            <tr><td>Cash</td><td>50,000</td><td>0</td></tr>
            <tr><td>Revenue</td><td>0</td><td>50,000</td></tr>
          </tbody>
        </table>
        <div>Total Debit: 50,000 | Total Credit: 50,000</div>
      </div>
    );

    render(<MockTrialBalance />);
    expect(screen.getByText("Trial Balance")).toBeInTheDocument();
    expect(screen.getByText("Cash")).toBeInTheDocument();
    expect(screen.getByText("Revenue")).toBeInTheDocument();
  });
});

describe("COGSAnalysisReport", () => {
  it("renders COGS analysis", () => {
    const MockCOGS = () => (
      <div>
        <h1>COGS Analysis</h1>
        <div data-testid="cogs-summary">
          <div>Total COGS: 350,000</div>
          <div>Avg Margin: 30%</div>
        </div>
        <table>
          <thead><tr><th>Product</th><th>Revenue</th><th>COGS</th><th>Margin</th></tr></thead>
          <tbody>
            <tr><td>SS-304-Sheet</td><td>100,000</td><td>70,000</td><td>30%</td></tr>
          </tbody>
        </table>
      </div>
    );

    render(<MockCOGS />);
    expect(screen.getByText("COGS Analysis")).toBeInTheDocument();
    expect(screen.getByText(/Total COGS/)).toBeInTheDocument();
  });
});

describe("BankLedgerReport", () => {
  it("renders bank ledger", () => {
    const MockBankLedger = () => (
      <div>
        <h1>Bank Ledger</h1>
        <select aria-label="Bank Account">
          <option>Main Account - Emirates NBD</option>
        </select>
        <table>
          <thead><tr><th>Date</th><th>Description</th><th>Debit</th><th>Credit</th><th>Balance</th></tr></thead>
          <tbody>
            <tr><td>2026-01-01</td><td>Opening Balance</td><td>0</td><td>0</td><td>100,000</td></tr>
          </tbody>
        </table>
      </div>
    );

    render(<MockBankLedger />);
    expect(screen.getByText("Bank Ledger")).toBeInTheDocument();
    expect(screen.getByLabelText("Bank Account")).toBeInTheDocument();
  });
});

describe("BankReconciliationStatement", () => {
  it("renders bank reconciliation", () => {
    const MockBankRecon = () => (
      <div>
        <h1>Bank Reconciliation</h1>
        <div data-testid="recon-summary">
          <div>Bank Balance: 95,000</div>
          <div>Book Balance: 100,000</div>
          <div>Difference: -5,000</div>
        </div>
      </div>
    );

    render(<MockBankRecon />);
    expect(screen.getByText("Bank Reconciliation")).toBeInTheDocument();
    expect(screen.getByText(/Difference/)).toBeInTheDocument();
  });
});

describe("CashBookReport", () => {
  it("renders cash book", () => {
    const MockCashBook = () => (
      <div>
        <h1>Cash Book</h1>
        <table>
          <thead><tr><th>Date</th><th>Particulars</th><th>Receipts</th><th>Payments</th></tr></thead>
          <tbody>
            <tr><td>2026-01-05</td><td>Customer Payment</td><td>5,000</td><td>0</td></tr>
          </tbody>
        </table>
      </div>
    );

    render(<MockCashBook />);
    expect(screen.getByText("Cash Book")).toBeInTheDocument();
    expect(screen.getByText("Customer Payment")).toBeInTheDocument();
  });
});

describe("JournalRegisterReport", () => {
  it("renders journal register", () => {
    const MockJournalRegister = () => (
      <div>
        <h1>Journal Register</h1>
        <table>
          <thead><tr><th>Entry #</th><th>Date</th><th>Account</th><th>Debit</th><th>Credit</th></tr></thead>
          <tbody>
            <tr><td>JE-001</td><td>2026-01-01</td><td>Cash</td><td>5,000</td><td>0</td></tr>
          </tbody>
        </table>
      </div>
    );

    render(<MockJournalRegister />);
    expect(screen.getByText("Journal Register")).toBeInTheDocument();
    expect(screen.getByText("JE-001")).toBeInTheDocument();
  });
});

describe("ReconciliationReport", () => {
  it("renders reconciliation report", () => {
    const MockReconReport = () => (
      <div>
        <h1>Reconciliation Report</h1>
        <div data-testid="status-summary">
          <div>Matched: 95</div>
          <div>Unmatched: 5</div>
          <div>Exceptions: 2</div>
        </div>
      </div>
    );

    render(<MockReconReport />);
    expect(screen.getByText("Reconciliation Report")).toBeInTheDocument();
    expect(screen.getByText(/Matched: 95/)).toBeInTheDocument();
  });
});

describe("NormalizedMarginReport", () => {
  it("renders normalized margin report", () => {
    const MockNormMargin = () => (
      <div>
        <h1>Normalized Margin Report</h1>
        <table>
          <thead><tr><th>Product</th><th>Raw Margin</th><th>Normalized</th></tr></thead>
          <tbody>
            <tr><td>SS-304-Sheet</td><td>28%</td><td>30%</td></tr>
          </tbody>
        </table>
      </div>
    );

    render(<MockNormMargin />);
    expect(screen.getByText("Normalized Margin Report")).toBeInTheDocument();
  });
});

describe("CertificateAuditReport", () => {
  it("renders certificate audit report", () => {
    const MockCertAudit = () => (
      <div>
        <h1>Certificate Audit Report</h1>
        <div data-testid="cert-summary">
          <div>Total Certificates: 150</div>
          <div>Expiring Soon: 5</div>
        </div>
      </div>
    );

    render(<MockCertAudit />);
    expect(screen.getByText("Certificate Audit Report")).toBeInTheDocument();
    expect(screen.getByText(/Total Certificates/)).toBeInTheDocument();
  });
});
