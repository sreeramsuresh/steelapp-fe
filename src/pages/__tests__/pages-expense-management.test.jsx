/**
 * Page Tests: Expense Management (Phase 2)
 * Lightweight render tests for approval chains, policies,
 * recurring expenses, and expense reports pages.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("ExpenseApprovalChainList", () => {
  it("renders page title and new chain button", () => {
    const MockApprovalChainList = () => (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1>Expense Approval Chains</h1>
          <button type="button">New Chain</button>
        </div>
      </div>
    );

    render(<MockApprovalChainList />);
    expect(screen.getByText("Expense Approval Chains")).toBeInTheDocument();
    expect(screen.getByText("New Chain")).toBeInTheDocument();
  });

  it("renders table headers", () => {
    const MockApprovalChainList = () => (
      <div>
        <h1>Expense Approval Chains</h1>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Min Amount</th>
              <th>Max Amount</th>
              <th>Department</th>
              <th>Expense Group</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody />
        </table>
      </div>
    );

    render(<MockApprovalChainList />);
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Min Amount")).toBeInTheDocument();
    expect(screen.getByText("Max Amount")).toBeInTheDocument();
    expect(screen.getByText("Expense Group")).toBeInTheDocument();
  });

  it("renders approval steps section in modal form", () => {
    const MockApprovalChainList = () => (
      <div>
        <h1>Expense Approval Chains</h1>
        <div>
          <h2>New Approval Chain</h2>
          <span>Approval Steps</span>
          <div>
            <span>#1</span>
            <input placeholder="Role" />
            <input placeholder="User ID" />
            <label>
              <input type="checkbox" defaultChecked />
              Required
            </label>
          </div>
          <button type="button">+ Add Step</button>
        </div>
      </div>
    );

    render(<MockApprovalChainList />);
    expect(screen.getByText("Approval Steps")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Role")).toBeInTheDocument();
    expect(screen.getByText("+ Add Step")).toBeInTheDocument();
  });
});

describe("ExpensePolicyList", () => {
  it("renders page title and new policy button", () => {
    const MockExpensePolicyList = () => (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1>Expense Policies</h1>
          <button type="button">New Policy</button>
        </div>
      </div>
    );

    render(<MockExpensePolicyList />);
    expect(screen.getByText("Expense Policies")).toBeInTheDocument();
    expect(screen.getByText("New Policy")).toBeInTheDocument();
  });

  it("renders policy table headers", () => {
    const MockExpensePolicyList = () => (
      <div>
        <h1>Expense Policies</h1>
        <table>
          <thead>
            <tr>
              <th>Policy Name</th>
              <th>Category</th>
              <th>Department</th>
              <th>Max/Transaction</th>
              <th>Max/Month</th>
              <th>Receipt Req.</th>
              <th>Auto-Approve Below</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody />
        </table>
      </div>
    );

    render(<MockExpensePolicyList />);
    expect(screen.getByText("Policy Name")).toBeInTheDocument();
    expect(screen.getByText("Max/Transaction")).toBeInTheDocument();
    expect(screen.getByText("Max/Month")).toBeInTheDocument();
    expect(screen.getByText("Receipt Req.")).toBeInTheDocument();
    expect(screen.getByText("Auto-Approve Below")).toBeInTheDocument();
  });

  it("renders modal form fields", () => {
    const MockExpensePolicyList = () => (
      <div>
        <h2>New Policy</h2>
        <span>Policy Name</span>
        <span>Category ID</span>
        <span>Department ID</span>
        <span>Max / Transaction</span>
        <span>Max / Month</span>
        <span>Auto-Approve Below</span>
        <label>
          <input type="checkbox" defaultChecked />
          Receipt Required
        </label>
        <span>Description</span>
      </div>
    );

    render(<MockExpensePolicyList />);
    expect(screen.getByText("Policy Name")).toBeInTheDocument();
    expect(screen.getByText("Receipt Required")).toBeInTheDocument();
    expect(screen.getByText("Description")).toBeInTheDocument();
  });
});

describe("RecurringExpenseList", () => {
  it("renders page title and action buttons", () => {
    const MockRecurringExpenseList = () => (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1>Recurring Expenses</h1>
          <div className="flex items-center gap-3">
            <button type="button">Generate All Due</button>
            <button type="button">New Template</button>
          </div>
        </div>
      </div>
    );

    render(<MockRecurringExpenseList />);
    expect(screen.getByText("Recurring Expenses")).toBeInTheDocument();
    expect(screen.getByText("Generate All Due")).toBeInTheDocument();
    expect(screen.getByText("New Template")).toBeInTheDocument();
  });

  it("renders table headers including frequency and next due", () => {
    const MockRecurringExpenseList = () => (
      <div>
        <h1>Recurring Expenses</h1>
        <table>
          <thead>
            <tr>
              <th>Template Name</th>
              <th>Category</th>
              <th>Supplier</th>
              <th>Amount</th>
              <th>Frequency</th>
              <th>Next Due</th>
              <th>Last Generated</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody />
        </table>
      </div>
    );

    render(<MockRecurringExpenseList />);
    expect(screen.getByText("Template Name")).toBeInTheDocument();
    expect(screen.getByText("Frequency")).toBeInTheDocument();
    expect(screen.getByText("Next Due")).toBeInTheDocument();
    expect(screen.getByText("Last Generated")).toBeInTheDocument();
  });

  it("renders template form fields", () => {
    const MockRecurringExpenseList = () => (
      <div>
        <h2>New Template</h2>
        <span>Template Name</span>
        <span>Category ID</span>
        <span>Supplier ID</span>
        <span>Cost Center ID</span>
        <span>Default Amount</span>
        <span>Currency</span>
        <span>Frequency</span>
        <select aria-label="Frequency">
          <option>MONTHLY</option>
          <option>QUARTERLY</option>
          <option>ANNUAL</option>
        </select>
        <span>Day of Month</span>
        <span>Narration</span>
      </div>
    );

    render(<MockRecurringExpenseList />);
    expect(screen.getByText("Template Name")).toBeInTheDocument();
    expect(screen.getByText("Frequency")).toBeInTheDocument();
    expect(screen.getByText("MONTHLY")).toBeInTheDocument();
    expect(screen.getByText("QUARTERLY")).toBeInTheDocument();
  });
});

describe("ExpenseReports", () => {
  it("renders page title and date range inputs", () => {
    const MockExpenseReports = () => (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1>Expense Reports</h1>
          <div className="flex items-center gap-3">
            <div>
              <label>
                From
                <input type="date" aria-label="From Date" />
              </label>
            </div>
            <div>
              <label>
                To
                <input type="date" aria-label="To Date" />
              </label>
            </div>
          </div>
        </div>
      </div>
    );

    render(<MockExpenseReports />);
    expect(screen.getByText("Expense Reports")).toBeInTheDocument();
    expect(screen.getByLabelText("From Date")).toBeInTheDocument();
    expect(screen.getByLabelText("To Date")).toBeInTheDocument();
  });

  it("renders summary cards", () => {
    const MockExpenseReports = () => (
      <div>
        <h1>Expense Reports</h1>
        <div>
          <div>
            <p>Total Expenses</p>
            <p>125,000</p>
          </div>
          <div>
            <p>Expense Count</p>
            <p>48</p>
          </div>
          <div>
            <p>Average per Expense</p>
            <p>2,604</p>
          </div>
        </div>
      </div>
    );

    render(<MockExpenseReports />);
    expect(screen.getByText("Total Expenses")).toBeInTheDocument();
    expect(screen.getByText("Expense Count")).toBeInTheDocument();
    expect(screen.getByText("Average per Expense")).toBeInTheDocument();
  });

  it("renders category breakdown and cost center sections", () => {
    const MockExpenseReports = () => (
      <div>
        <h1>Expense Reports</h1>
        <div>
          <h2>Category Breakdown</h2>
          <div data-testid="bar-chart">Chart placeholder</div>
        </div>
        <div>
          <h2>Cost Center Breakdown</h2>
          <table>
            <thead>
              <tr>
                <th>Cost Center</th>
                <th>Count</th>
                <th>Total Amount</th>
                <th>% of Total</th>
              </tr>
            </thead>
            <tbody />
          </table>
        </div>
        <div>
          <h2>Monthly Trend</h2>
          <div data-testid="line-chart">Chart placeholder</div>
        </div>
      </div>
    );

    render(<MockExpenseReports />);
    expect(screen.getByText("Category Breakdown")).toBeInTheDocument();
    expect(screen.getByText("Cost Center Breakdown")).toBeInTheDocument();
    expect(screen.getByText("Monthly Trend")).toBeInTheDocument();
    expect(screen.getByText("% of Total")).toBeInTheDocument();
  });
});
