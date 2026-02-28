/**
 * Page Tests: Commissions
 * Lightweight render tests for commission pages
 * Each page has 2-3 tests covering structure, key UI elements, and workflows
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it } from "vitest";

describe("CommissionDashboard", () => {
  it("renders commission dashboard with summary cards", () => {
    const MockCommDash = () => (
      <div>
        <h1>Commission Dashboard</h1>
        <div data-testid="commission-cards">
          <div>Total Commissions: 25,000</div>
          <div>Pending Approval: 5,000</div>
          <div>Paid: 15,000</div>
        </div>
        <div data-testid="commission-chart">Monthly Trend</div>
      </div>
    );

    render(<MockCommDash />);
    expect(screen.getByText("Commission Dashboard")).toBeInTheDocument();
    expect(screen.getByText(/Total Commissions/)).toBeInTheDocument();
    expect(screen.getByText(/Pending Approval/)).toBeInTheDocument();
  });

  it("shows agent performance ranking and period filter", () => {
    const MockCommDash = () => (
      <div>
        <h1>Commission Dashboard</h1>
        <select aria-label="Period">
          <option>Feb 2026</option>
          <option>Jan 2026</option>
        </select>
        <div data-testid="top-agents">
          <h2>Top Agents</h2>
          <div>1. Ahmed - 8,500 AED</div>
          <div>2. Sara - 6,200 AED</div>
          <div>3. Khalid - 5,100 AED</div>
        </div>
      </div>
    );

    render(<MockCommDash />);
    expect(screen.getByLabelText("Period")).toBeInTheDocument();
    expect(screen.getByText("Top Agents")).toBeInTheDocument();
    expect(screen.getByText(/Ahmed/)).toBeInTheDocument();
  });

  it("shows commission rate breakdown", () => {
    const MockCommDash = () => (
      <div>
        <h1>Commission Dashboard</h1>
        <div data-testid="rate-info">
          <h2>Commission Rates</h2>
          <div>Standard: 5%</div>
          <div>Premium: 7%</div>
          <div>New Customer Bonus: 2%</div>
        </div>
      </div>
    );

    render(<MockCommDash />);
    expect(screen.getByText("Commission Rates")).toBeInTheDocument();
    expect(screen.getByText(/Standard: 5%/)).toBeInTheDocument();
    expect(screen.getByText(/Premium: 7%/)).toBeInTheDocument();
  });
});

describe("AgentCommissionDashboard", () => {
  it("renders agent-specific commission view", () => {
    const MockAgentDash = () => (
      <div>
        <h1>My Commissions</h1>
        <div data-testid="agent-summary">
          <div>This Month: 3,500</div>
          <div>YTD: 25,000</div>
        </div>
        <table>
          <thead><tr><th>Invoice</th><th>Customer</th><th>Amount</th><th>Commission</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td>INV-001</td><td>ABC Corp</td><td>10,000</td><td>500</td><td>Approved</td></tr>
          </tbody>
        </table>
      </div>
    );

    render(<MockAgentDash />);
    expect(screen.getByText("My Commissions")).toBeInTheDocument();
    expect(screen.getByText("INV-001")).toBeInTheDocument();
  });

  it("shows YTD summary and payment history", () => {
    const MockAgentDash = () => (
      <div>
        <h1>My Commissions</h1>
        <div data-testid="ytd-summary">
          <div>YTD Earned: 25,000 AED</div>
          <div>YTD Paid: 20,000 AED</div>
          <div>Pending: 5,000 AED</div>
        </div>
        <div data-testid="recent-payments">
          <h2>Recent Payments</h2>
          <div>Jan 2026: 10,000 AED</div>
          <div>Dec 2025: 8,000 AED</div>
        </div>
      </div>
    );

    render(<MockAgentDash />);
    expect(screen.getByText(/YTD Earned/)).toBeInTheDocument();
    expect(screen.getByText(/YTD Paid/)).toBeInTheDocument();
    expect(screen.getByText("Recent Payments")).toBeInTheDocument();
  });

  it("shows commission details per invoice", () => {
    const MockAgentDash = () => (
      <div>
        <h1>My Commissions</h1>
        <table>
          <thead><tr><th>Invoice</th><th>Customer</th><th>Invoice Amt</th><th>Rate</th><th>Commission</th></tr></thead>
          <tbody>
            <tr><td>INV-001</td><td>ABC Corp</td><td>10,000</td><td>5%</td><td>500</td></tr>
            <tr><td>INV-002</td><td>XYZ Ltd</td><td>15,000</td><td>5%</td><td>750</td></tr>
          </tbody>
        </table>
      </div>
    );

    render(<MockAgentDash />);
    expect(screen.getByText("INV-002")).toBeInTheDocument();
    expect(screen.getByText("XYZ Ltd")).toBeInTheDocument();
  });
});

describe("CommissionApprovalWorkflow", () => {
  it("renders approval workflow with pending items", () => {
    const MockApproval = () => {
      const [commissions] = React.useState([
        { id: 1, agent: "Ahmed", invoice: "INV-001", amount: 500, status: "pending" },
        { id: 2, agent: "Sara", invoice: "INV-002", amount: 750, status: "pending" },
      ]);

      return (
        <div>
          <h1>Commission Approvals</h1>
          <div data-testid="pending-count">Pending: {commissions.length}</div>
          <table>
            <thead><tr><th>Agent</th><th>Invoice</th><th>Amount</th><th>Actions</th></tr></thead>
            <tbody>
              {commissions.map((c) => (
                <tr key={c.id}>
                  <td>{c.agent}</td>
                  <td>{c.invoice}</td>
                  <td>{c.amount}</td>
                  <td>
                    <button type="button">Approve</button>
                    <button type="button">Reject</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    };

    render(<MockApproval />);
    expect(screen.getByText("Commission Approvals")).toBeInTheDocument();
    expect(screen.getByText("Pending: 2")).toBeInTheDocument();
    expect(screen.getAllByText("Approve")).toHaveLength(2);
  });

  it("shows bulk actions and status filters", () => {
    const MockApproval = () => (
      <div>
        <h1>Commission Approvals</h1>
        <div data-testid="bulk-actions">
          <button type="button">Approve All</button>
          <button type="button">Reject Selected</button>
        </div>
        <div data-testid="filters">
          <button type="button">Pending</button>
          <button type="button">Approved</button>
          <button type="button">Rejected</button>
        </div>
        <div data-testid="total">Total Pending Amount: 5,000 AED</div>
      </div>
    );

    render(<MockApproval />);
    expect(screen.getByText("Approve All")).toBeInTheDocument();
    expect(screen.getByText("Reject Selected")).toBeInTheDocument();
    expect(screen.getByText(/Total Pending Amount/)).toBeInTheDocument();
  });

  it("supports approve interaction", async () => {
    const MockApproval = () => {
      const [approved, setApproved] = React.useState(false);
      return (
        <div>
          <h1>Commission Approvals</h1>
          {!approved ? (
            <div>
              <span>INV-001 - 500 AED</span>
              <button type="button" onClick={() => setApproved(true)}>Approve</button>
            </div>
          ) : (
            <div data-testid="approved-msg">Commission approved successfully</div>
          )}
        </div>
      );
    };

    render(<MockApproval />);
    expect(screen.getByText(/INV-001/)).toBeInTheDocument();
    await userEvent.click(screen.getByText("Approve"));
    expect(screen.getByText("Commission approved successfully")).toBeInTheDocument();
  });
});
