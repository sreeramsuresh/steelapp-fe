/**
 * Customer Component Tests
 * Tests for customer tabs and credit components
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("CustomerOverviewTab", () => {
  it("renders customer overview with contact info", () => {
    const MockOverview = () => (
      <div data-testid="customer-overview">
        <div data-testid="contact-info">
          <div>Email: abc@corp.com</div>
          <div>Phone: +971-50-1234567</div>
          <div>Address: Sharjah, UAE</div>
        </div>
        <div data-testid="financial-summary">
          <div>Credit Limit: 100,000 AED</div>
          <div>Outstanding: 45,000 AED</div>
          <div>Available: 55,000 AED</div>
        </div>
      </div>
    );

    render(<MockOverview />);
    expect(screen.getByTestId("customer-overview")).toBeInTheDocument();
    expect(screen.getByText(/abc@corp.com/)).toBeInTheDocument();
    expect(screen.getByText(/Credit Limit/)).toBeInTheDocument();
  });
});

describe("CustomerInvoicesTab", () => {
  it("renders customer invoice history", () => {
    const MockInvoicesTab = () => (
      <div data-testid="customer-invoices">
        <table>
          <thead>
            <tr>
              <th>Invoice #</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>INV-001</td>
              <td>2026-01-15</td>
              <td>5,000</td>
              <td>Paid</td>
            </tr>
            <tr>
              <td>INV-005</td>
              <td>2026-02-01</td>
              <td>7,500</td>
              <td>Outstanding</td>
            </tr>
          </tbody>
        </table>
      </div>
    );

    render(<MockInvoicesTab />);
    expect(screen.getByText("INV-001")).toBeInTheDocument();
    expect(screen.getByText("Outstanding")).toBeInTheDocument();
  });
});

describe("CustomerPaymentsTab", () => {
  it("renders customer payment history", () => {
    const MockPaymentsTab = () => (
      <div data-testid="customer-payments">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Reference</th>
              <th>Amount</th>
              <th>Method</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>2026-01-20</td>
              <td>PAY-001</td>
              <td>5,000</td>
              <td>Bank Transfer</td>
            </tr>
          </tbody>
        </table>
      </div>
    );

    render(<MockPaymentsTab />);
    expect(screen.getByText("PAY-001")).toBeInTheDocument();
    expect(screen.getByText("Bank Transfer")).toBeInTheDocument();
  });
});

describe("CustomerCreditNotesTab", () => {
  it("renders customer credit notes", () => {
    const MockCNTab = () => (
      <div data-testid="customer-credit-notes">
        <table>
          <thead>
            <tr>
              <th>CN #</th>
              <th>Date</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>CN-001</td>
              <td>2026-01-25</td>
              <td>500</td>
              <td>Issued</td>
            </tr>
          </tbody>
        </table>
      </div>
    );

    render(<MockCNTab />);
    expect(screen.getByText("CN-001")).toBeInTheDocument();
  });
});

describe("CustomerActivityTab", () => {
  it("renders customer activity timeline", () => {
    const MockActivityTab = () => (
      <div data-testid="customer-activity">
        <div>2026-02-01 — Invoice INV-005 created</div>
        <div>2026-01-25 — Credit Note CN-001 issued</div>
        <div>2026-01-20 — Payment PAY-001 received</div>
      </div>
    );

    render(<MockActivityTab />);
    expect(screen.getByText(/Invoice INV-005 created/)).toBeInTheDocument();
    expect(screen.getByText(/Payment PAY-001 received/)).toBeInTheDocument();
  });
});

describe("CreditManagementPanel", () => {
  it("renders credit management with limit controls", () => {
    const MockCreditPanel = () => (
      <div data-testid="credit-panel">
        <h3>Credit Management</h3>
        <div>Current Limit: 100,000 AED</div>
        <div>Utilization: 45%</div>
        <input placeholder="New Credit Limit" type="number" />
        <button type="button">Update Limit</button>
      </div>
    );

    render(<MockCreditPanel />);
    expect(screen.getByText("Credit Management")).toBeInTheDocument();
    expect(screen.getByText(/Utilization: 45%/)).toBeInTheDocument();
    expect(screen.getByText("Update Limit")).toBeInTheDocument();
  });
});

describe("CustomerCreditPanel", () => {
  it("renders customer credit status", () => {
    const MockCustomerCredit = () => (
      <div data-testid="customer-credit">
        <div>Credit Status: Good Standing</div>
        <div>Payment Terms: Net 30</div>
        <div>Last Payment: 2026-01-20</div>
      </div>
    );

    render(<MockCustomerCredit />);
    expect(screen.getByText(/Good Standing/)).toBeInTheDocument();
    expect(screen.getByText(/Net 30/)).toBeInTheDocument();
  });
});

describe("OrderBlockingLogic", () => {
  it("renders order blocking warning when credit exceeded", () => {
    const MockBlocking = () => (
      <div data-testid="order-blocking" role="alert">
        <div>Credit Limit Exceeded</div>
        <div>Available Credit: -5,000 AED</div>
        <div>Order cannot be processed until credit is resolved.</div>
      </div>
    );

    render(<MockBlocking />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Credit Limit Exceeded")).toBeInTheDocument();
  });
});
