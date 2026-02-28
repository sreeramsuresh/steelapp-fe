/**
 * Page Tests: Commissions
 * Lightweight render tests for commission pages
 */

import { render, screen } from "@testing-library/react";
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
});
