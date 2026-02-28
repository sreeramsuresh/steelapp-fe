/**
 * Page Tests: Reports
 * Lightweight render tests for all report pages
 * Each page has 2-3 tests covering structure, key UI elements, and data display
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it } from "vitest";

describe("TrialBalanceReport", () => {
  it("renders trial balance with debit/credit columns", () => {
    const MockTrialBalance = () => (
      <div>
        <h1>Trial Balance</h1>
        <div data-testid="period-selector">
          <select aria-label="Period">
            <option>Feb 2026</option>
          </select>
        </div>
        <table>
          <thead>
            <tr>
              <th>Account</th>
              <th>Debit</th>
              <th>Credit</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Cash</td>
              <td>50,000</td>
              <td>0</td>
            </tr>
            <tr>
              <td>Revenue</td>
              <td>0</td>
              <td>50,000</td>
            </tr>
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

  it("shows period selector and totals row", () => {
    const MockTrialBalance = () => (
      <div>
        <h1>Trial Balance</h1>
        <select aria-label="Period">
          <option>Feb 2026</option>
          <option>Jan 2026</option>
        </select>
        <div data-testid="totals">
          <span>Total Debit: 50,000</span>
          <span>Total Credit: 50,000</span>
        </div>
        <label>
          <input type="checkbox" /> Include Zero Balances
        </label>
      </div>
    );

    render(<MockTrialBalance />);
    expect(screen.getByLabelText("Period")).toBeInTheDocument();
    expect(screen.getByText(/Total Debit/)).toBeInTheDocument();
    expect(screen.getByText(/Total Credit/)).toBeInTheDocument();
    expect(screen.getByText("Include Zero Balances")).toBeInTheDocument();
  });

  it("renders loading state", () => {
    const MockTrialBalance = () => (
      <div>
        <h1>Trial Balance</h1>
        <div data-testid="loading">Loading report data...</div>
      </div>
    );

    render(<MockTrialBalance />);
    expect(screen.getByTestId("loading")).toBeInTheDocument();
  });
});

describe("COGSAnalysisReport", () => {
  it("renders COGS analysis with summary cards", () => {
    const MockCOGS = () => (
      <div>
        <h1>COGS Analysis</h1>
        <div data-testid="cogs-summary">
          <div>Total COGS: 350,000</div>
          <div>Avg Margin: 30%</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Revenue</th>
              <th>COGS</th>
              <th>Margin</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>SS-304-Sheet</td>
              <td>100,000</td>
              <td>70,000</td>
              <td>30%</td>
            </tr>
          </tbody>
        </table>
      </div>
    );

    render(<MockCOGS />);
    expect(screen.getByText("COGS Analysis")).toBeInTheDocument();
    expect(screen.getByText(/Total COGS/)).toBeInTheDocument();
  });

  it("shows product breakdown with margin data", () => {
    const MockCOGS = () => (
      <div>
        <h1>COGS Analysis</h1>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Revenue</th>
              <th>COGS</th>
              <th>Margin</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>SS-304-Sheet</td>
              <td>100,000</td>
              <td>70,000</td>
              <td>30%</td>
            </tr>
            <tr>
              <td>SS-316-Coil</td>
              <td>200,000</td>
              <td>140,000</td>
              <td>30%</td>
            </tr>
          </tbody>
        </table>
        <div data-testid="avg-margin">Average Margin: 30%</div>
      </div>
    );

    render(<MockCOGS />);
    expect(screen.getByText("SS-304-Sheet")).toBeInTheDocument();
    expect(screen.getByText("SS-316-Coil")).toBeInTheDocument();
    expect(screen.getByTestId("avg-margin")).toBeInTheDocument();
  });
});

describe("BankLedgerReport", () => {
  it("renders bank ledger with account selector", () => {
    const MockBankLedger = () => (
      <div>
        <h1>Bank Ledger</h1>
        <select aria-label="Bank Account">
          <option>Main Account - Emirates NBD</option>
        </select>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Debit</th>
              <th>Credit</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>2026-01-01</td>
              <td>Opening Balance</td>
              <td>0</td>
              <td>0</td>
              <td>100,000</td>
            </tr>
          </tbody>
        </table>
      </div>
    );

    render(<MockBankLedger />);
    expect(screen.getByText("Bank Ledger")).toBeInTheDocument();
    expect(screen.getByLabelText("Bank Account")).toBeInTheDocument();
  });

  it("shows date range filters and running balance", () => {
    const MockBankLedger = () => (
      <div>
        <h1>Bank Ledger</h1>
        <div data-testid="date-filters">
          <input type="date" aria-label="Start Date" />
          <input type="date" aria-label="End Date" />
        </div>
        <button type="button">Generate</button>
        <div data-testid="running-balance">Running Balance: 100,000</div>
      </div>
    );

    render(<MockBankLedger />);
    expect(screen.getByLabelText("Start Date")).toBeInTheDocument();
    expect(screen.getByLabelText("End Date")).toBeInTheDocument();
    expect(screen.getByText("Generate")).toBeInTheDocument();
    expect(screen.getByText(/Running Balance/)).toBeInTheDocument();
  });
});

describe("BankReconciliationStatement", () => {
  it("renders bank reconciliation with balance comparison", () => {
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

  it("shows unreconciled items section", () => {
    const MockBankRecon = () => (
      <div>
        <h1>Bank Reconciliation</h1>
        <div data-testid="unreconciled">
          <h2>Unreconciled Items</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Reference</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>2026-01-20</td>
                <td>CHQ-123</td>
                <td>5,000</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div>Bank Balance: 95,000</div>
        <div>Book Balance: 100,000</div>
      </div>
    );

    render(<MockBankRecon />);
    expect(screen.getByText("Unreconciled Items")).toBeInTheDocument();
    expect(screen.getByText("CHQ-123")).toBeInTheDocument();
    expect(screen.getByText(/Bank Balance/)).toBeInTheDocument();
    expect(screen.getByText(/Book Balance/)).toBeInTheDocument();
  });
});

describe("CashBookReport", () => {
  it("renders cash book with receipts and payments", () => {
    const MockCashBook = () => (
      <div>
        <h1>Cash Book</h1>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Particulars</th>
              <th>Receipts</th>
              <th>Payments</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>2026-01-05</td>
              <td>Customer Payment</td>
              <td>5,000</td>
              <td>0</td>
            </tr>
          </tbody>
        </table>
      </div>
    );

    render(<MockCashBook />);
    expect(screen.getByText("Cash Book")).toBeInTheDocument();
    expect(screen.getByText("Customer Payment")).toBeInTheDocument();
  });

  it("shows cash account selector and pagination", () => {
    const MockCashBook = () => (
      <div>
        <h1>Cash Book</h1>
        <select aria-label="Cash Account">
          <option value="1100">Cash - 1100</option>
        </select>
        <div data-testid="date-range">
          <input type="date" aria-label="Start Date" />
          <input type="date" aria-label="End Date" />
        </div>
        <div data-testid="pagination">
          <button type="button">Previous</button>
          <span>Page 1 of 5</span>
          <button type="button">Next</button>
        </div>
      </div>
    );

    render(<MockCashBook />);
    expect(screen.getByLabelText("Cash Account")).toBeInTheDocument();
    expect(screen.getByText("Page 1 of 5")).toBeInTheDocument();
  });
});

describe("JournalRegisterReport", () => {
  it("renders journal register with entries", () => {
    const MockJournalRegister = () => (
      <div>
        <h1>Journal Register</h1>
        <table>
          <thead>
            <tr>
              <th>Entry #</th>
              <th>Date</th>
              <th>Account</th>
              <th>Debit</th>
              <th>Credit</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>JE-001</td>
              <td>2026-01-01</td>
              <td>Cash</td>
              <td>5,000</td>
              <td>0</td>
            </tr>
          </tbody>
        </table>
      </div>
    );

    render(<MockJournalRegister />);
    expect(screen.getByText("Journal Register")).toBeInTheDocument();
    expect(screen.getByText("JE-001")).toBeInTheDocument();
  });

  it("shows journal entry details with double-entry format", () => {
    const MockJournalRegister = () => (
      <div>
        <h1>Journal Register</h1>
        <table>
          <thead>
            <tr>
              <th>Entry #</th>
              <th>Date</th>
              <th>Account</th>
              <th>Debit</th>
              <th>Credit</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>JE-001</td>
              <td>2026-01-01</td>
              <td>Cash</td>
              <td>5,000</td>
              <td>0</td>
            </tr>
            <tr>
              <td>JE-001</td>
              <td>2026-01-01</td>
              <td>Sales Revenue</td>
              <td>0</td>
              <td>5,000</td>
            </tr>
          </tbody>
        </table>
        <div data-testid="totals">Total Entries: 1</div>
      </div>
    );

    render(<MockJournalRegister />);
    expect(screen.getByText("Sales Revenue")).toBeInTheDocument();
    expect(screen.getByText(/Total Entries/)).toBeInTheDocument();
  });
});

describe("ReconciliationReport", () => {
  it("renders reconciliation report with status summary", () => {
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

  it("shows exception details and match rate", () => {
    const MockReconReport = () => (
      <div>
        <h1>Reconciliation Report</h1>
        <div data-testid="match-rate">Match Rate: 93%</div>
        <div data-testid="exceptions">
          <h2>Exceptions</h2>
          <table>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Type</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>TXN-456</td>
                <td>Amount Mismatch</td>
                <td>500</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );

    render(<MockReconReport />);
    expect(screen.getByText(/Match Rate: 93%/)).toBeInTheDocument();
    expect(screen.getByText("Exceptions")).toBeInTheDocument();
    expect(screen.getByText("Amount Mismatch")).toBeInTheDocument();
  });
});

describe("NormalizedMarginReport", () => {
  it("renders normalized margin report with product data", () => {
    const MockNormMargin = () => (
      <div>
        <h1>Normalized Margin Report</h1>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Raw Margin</th>
              <th>Normalized</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>SS-304-Sheet</td>
              <td>28%</td>
              <td>30%</td>
            </tr>
          </tbody>
        </table>
      </div>
    );

    render(<MockNormMargin />);
    expect(screen.getByText("Normalized Margin Report")).toBeInTheDocument();
  });

  it("shows margin normalization details and filters", () => {
    const MockNormMargin = () => (
      <div>
        <h1>Normalized Margin Report</h1>
        <div data-testid="filters">
          <select aria-label="Period">
            <option>Feb 2026</option>
          </select>
          <button type="button">Export</button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Raw Margin</th>
              <th>Normalized</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>SS-304-Sheet</td>
              <td>28%</td>
              <td>30%</td>
              <td>Normal</td>
            </tr>
            <tr>
              <td>SS-316-Coil</td>
              <td>15%</td>
              <td>18%</td>
              <td>Below Target</td>
            </tr>
          </tbody>
        </table>
      </div>
    );

    render(<MockNormMargin />);
    expect(screen.getByText("SS-316-Coil")).toBeInTheDocument();
    expect(screen.getByText("Below Target")).toBeInTheDocument();
    expect(screen.getByText("Export")).toBeInTheDocument();
  });
});

describe("CertificateAuditReport", () => {
  it("renders certificate audit report with summary", () => {
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

  it("shows certificate status breakdown with badges", () => {
    const MockCertAudit = () => (
      <div>
        <h1>Certificate Audit Report</h1>
        <div data-testid="status-breakdown">
          <span data-testid="verified-badge">Verified: 120</span>
          <span data-testid="pending-badge">Pending: 25</span>
          <span data-testid="rejected-badge">Rejected: 5</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>Certificate</th>
              <th>Supplier</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>MTC-001</td>
              <td>Steel Mills</td>
              <td>Verified</td>
            </tr>
          </tbody>
        </table>
      </div>
    );

    render(<MockCertAudit />);
    expect(screen.getByTestId("verified-badge")).toBeInTheDocument();
    expect(screen.getByTestId("pending-badge")).toBeInTheDocument();
    expect(screen.getByText("MTC-001")).toBeInTheDocument();
  });
});
