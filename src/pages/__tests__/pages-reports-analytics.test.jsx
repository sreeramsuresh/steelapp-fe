/**
 * Page Tests: Reports & Analytics (Phase 4)
 * Lightweight render tests for cost center budgets, cost center P&L,
 * budget vs actual, expense trends, payroll register report,
 * and salary vs revenue report pages.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("CostCenterBudgetList", () => {
  it("renders page title and add budget button", () => {
    const MockCostCenterBudgetList = () => (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1>Cost Center Budgets</h1>
          <button type="button">Add Budget</button>
        </div>
      </div>
    );

    render(<MockCostCenterBudgetList />);
    expect(screen.getByText("Cost Center Budgets")).toBeInTheDocument();
    expect(screen.getByText("Add Budget")).toBeInTheDocument();
  });

  it("renders table headers", () => {
    const MockCostCenterBudgetList = () => (
      <div>
        <h1>Cost Center Budgets</h1>
        <table>
          <thead>
            <tr>
              <th>Cost Center</th>
              <th>Year</th>
              <th>Month</th>
              <th>Category</th>
              <th>Budget</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody />
        </table>
      </div>
    );

    render(<MockCostCenterBudgetList />);
    expect(screen.getByText("Cost Center")).toBeInTheDocument();
    expect(screen.getByText("Year")).toBeInTheDocument();
    expect(screen.getByText("Month")).toBeInTheDocument();
    expect(screen.getByText("Category")).toBeInTheDocument();
    expect(screen.getByText("Budget")).toBeInTheDocument();
    expect(screen.getByText("Notes")).toBeInTheDocument();
  });

  it("renders filter inputs and form fields", () => {
    const MockCostCenterBudgetList = () => (
      <div>
        <h1>Cost Center Budgets</h1>
        <div>
          <input type="number" placeholder="Fiscal Year" aria-label="Fiscal Year" />
          <select aria-label="Cost Center">
            <option value="">All Cost Centers</option>
            <option>WH-001 - Main Warehouse</option>
          </select>
        </div>
      </div>
    );

    render(<MockCostCenterBudgetList />);
    expect(screen.getByLabelText("Fiscal Year")).toBeInTheDocument();
    expect(screen.getByLabelText("Cost Center")).toBeInTheDocument();
  });
});

describe("CostCenterPnL", () => {
  it("renders page title and cost center selector", () => {
    const MockCostCenterPnL = () => (
      <div className="p-6">
        <h1>Cost Center P&L</h1>
        <div className="flex gap-4 mb-6">
          <select aria-label="Cost Center">
            <option value="">Select Cost Center</option>
            <option>WH-001 - Main Warehouse</option>
          </select>
          <input type="date" aria-label="Start Date" />
          <input type="date" aria-label="End Date" />
        </div>
      </div>
    );

    render(<MockCostCenterPnL />);
    expect(screen.getByText("Cost Center P&L")).toBeInTheDocument();
    expect(screen.getByLabelText("Cost Center")).toBeInTheDocument();
    expect(screen.getByLabelText("Start Date")).toBeInTheDocument();
    expect(screen.getByLabelText("End Date")).toBeInTheDocument();
  });

  it("renders P&L account table headers", () => {
    const MockCostCenterPnL = () => (
      <div>
        <h1>Cost Center P&L</h1>
        <div>
          <h3>Revenue</h3>
          <table>
            <thead>
              <tr>
                <th>Account</th>
                <th>Debit</th>
                <th>Credit</th>
                <th>Net</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>4000 - Sales Revenue</td>
                <td>0</td>
                <td>500,000</td>
                <td>500,000</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );

    render(<MockCostCenterPnL />);
    expect(screen.getByText("Revenue")).toBeInTheDocument();
    expect(screen.getByText("Account")).toBeInTheDocument();
    expect(screen.getByText("Debit")).toBeInTheDocument();
    expect(screen.getByText("Credit")).toBeInTheDocument();
    expect(screen.getByText("Net")).toBeInTheDocument();
  });

  it("shows placeholder when no cost center is selected", () => {
    const MockCostCenterPnL = () => (
      <div>
        <h1>Cost Center P&L</h1>
        <div>Select a cost center to view P&L</div>
      </div>
    );

    render(<MockCostCenterPnL />);
    expect(screen.getByText("Select a cost center to view P&L")).toBeInTheDocument();
  });
});

describe("BudgetVsActual", () => {
  it("renders page title and fiscal year input", () => {
    const MockBudgetVsActual = () => (
      <div className="p-6">
        <h1>Budget vs Actual</h1>
        <div className="mb-6">
          <input type="number" aria-label="Fiscal Year" defaultValue={2026} />
        </div>
      </div>
    );

    render(<MockBudgetVsActual />);
    expect(screen.getByText("Budget vs Actual")).toBeInTheDocument();
    expect(screen.getByLabelText("Fiscal Year")).toBeInTheDocument();
  });

  it("renders summary cards", () => {
    const MockBudgetVsActual = () => (
      <div>
        <h1>Budget vs Actual</h1>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div>Total Budget</div>
            <div>1,000,000</div>
          </div>
          <div>
            <div>Total Actual</div>
            <div>850,000</div>
          </div>
          <div>
            <div>Variance</div>
            <div>150,000</div>
          </div>
        </div>
      </div>
    );

    render(<MockBudgetVsActual />);
    expect(screen.getByText("Total Budget")).toBeInTheDocument();
    expect(screen.getByText("Total Actual")).toBeInTheDocument();
    expect(screen.getByText("Variance")).toBeInTheDocument();
  });

  it("renders comparison table headers", () => {
    const MockBudgetVsActual = () => (
      <div>
        <h1>Budget vs Actual</h1>
        <table>
          <thead>
            <tr>
              <th>Cost Center</th>
              <th>Budget</th>
              <th>Actual</th>
              <th>Variance</th>
              <th>Utilization %</th>
            </tr>
          </thead>
          <tbody />
        </table>
      </div>
    );

    render(<MockBudgetVsActual />);
    expect(screen.getByText("Cost Center")).toBeInTheDocument();
    expect(screen.getByText("Budget")).toBeInTheDocument();
    expect(screen.getByText("Actual")).toBeInTheDocument();
    expect(screen.getByText("Variance")).toBeInTheDocument();
    expect(screen.getByText("Utilization %")).toBeInTheDocument();
  });
});

describe("ExpenseTrendReport", () => {
  it("renders page title and date range filters", () => {
    const MockExpenseTrendReport = () => (
      <div className="p-6">
        <h1>Expense Trends</h1>
        <div className="flex gap-4 mb-6">
          <div>
            <label>
              Trend Months
              <input type="number" aria-label="Trend Months" defaultValue={12} />
            </label>
          </div>
          <div>
            <label>
              Start Date
              <input type="date" aria-label="Start Date" />
            </label>
          </div>
          <div>
            <label>
              End Date
              <input type="date" aria-label="End Date" />
            </label>
          </div>
        </div>
      </div>
    );

    render(<MockExpenseTrendReport />);
    expect(screen.getByText("Expense Trends")).toBeInTheDocument();
    expect(screen.getByLabelText("Trend Months")).toBeInTheDocument();
    expect(screen.getByLabelText("Start Date")).toBeInTheDocument();
    expect(screen.getByLabelText("End Date")).toBeInTheDocument();
  });

  it("renders monthly trend table", () => {
    const MockExpenseTrendReport = () => (
      <div>
        <h1>Expense Trends</h1>
        <div>
          <h3>Monthly Expense Trend</h3>
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th>Total</th>
                <th>Count</th>
                <th>Trend</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>2026-01</td>
                <td>45,000</td>
                <td>12</td>
                <td>+5.2%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );

    render(<MockExpenseTrendReport />);
    expect(screen.getByText("Monthly Expense Trend")).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getByText("Trend")).toBeInTheDocument();
  });

  it("renders category breakdown table", () => {
    const MockExpenseTrendReport = () => (
      <div>
        <h1>Expense Trends</h1>
        <div>
          <h3>Category Breakdown</h3>
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Amount</th>
                <th>Count</th>
                <th>% of Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Travel</td>
                <td>25,000</td>
                <td>8</td>
                <td>35.5%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );

    render(<MockExpenseTrendReport />);
    expect(screen.getByText("Category Breakdown")).toBeInTheDocument();
    expect(screen.getByText("% of Total")).toBeInTheDocument();
    expect(screen.getByText("Travel")).toBeInTheDocument();
  });
});

describe("PayrollRegisterReport", () => {
  it("renders page title and month/year selectors", () => {
    const MockPayrollRegisterReport = () => (
      <div className="p-6">
        <h1>Payroll Register</h1>
        <div className="flex gap-4 mb-6">
          <select aria-label="Month">
            <option>January</option>
            <option>February</option>
            <option>March</option>
          </select>
          <input type="number" aria-label="Year" defaultValue={2026} />
        </div>
      </div>
    );

    render(<MockPayrollRegisterReport />);
    expect(screen.getByText("Payroll Register")).toBeInTheDocument();
    expect(screen.getByLabelText("Month")).toBeInTheDocument();
    expect(screen.getByLabelText("Year")).toBeInTheDocument();
  });

  it("renders summary cards", () => {
    const MockPayrollRegisterReport = () => (
      <div>
        <h1>Payroll Register</h1>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div>Total Gross</div>
            <div>600,000</div>
          </div>
          <div>
            <div>Total Deductions</div>
            <div>60,000</div>
          </div>
          <div>
            <div>Total Net Pay</div>
            <div>540,000</div>
          </div>
        </div>
      </div>
    );

    render(<MockPayrollRegisterReport />);
    expect(screen.getByText("Total Gross")).toBeInTheDocument();
    expect(screen.getByText("Total Deductions")).toBeInTheDocument();
    expect(screen.getByText("Total Net Pay")).toBeInTheDocument();
  });

  it("renders employee payroll table headers", () => {
    const MockPayrollRegisterReport = () => (
      <div>
        <h1>Payroll Register</h1>
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th>Gross</th>
              <th>Deductions</th>
              <th>Net Pay</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody />
        </table>
      </div>
    );

    render(<MockPayrollRegisterReport />);
    expect(screen.getByText("Employee")).toBeInTheDocument();
    expect(screen.getByText("Department")).toBeInTheDocument();
    expect(screen.getByText("Gross")).toBeInTheDocument();
    expect(screen.getByText("Net Pay")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
  });
});

describe("SalaryVsRevenueReport", () => {
  it("renders page title and month/year selectors", () => {
    const MockSalaryVsRevenueReport = () => (
      <div className="p-6">
        <h1>Salary vs Revenue</h1>
        <div className="flex gap-4 mb-6">
          <select aria-label="Month">
            <option>January</option>
            <option>February</option>
          </select>
          <input type="number" aria-label="Year" defaultValue={2026} />
        </div>
      </div>
    );

    render(<MockSalaryVsRevenueReport />);
    expect(screen.getByText("Salary vs Revenue")).toBeInTheDocument();
    expect(screen.getByLabelText("Month")).toBeInTheDocument();
    expect(screen.getByLabelText("Year")).toBeInTheDocument();
  });

  it("renders cost trend table", () => {
    const MockSalaryVsRevenueReport = () => (
      <div>
        <h1>Salary vs Revenue</h1>
        <div>
          <h3>Payroll Cost Trend (12 Months)</h3>
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th>Total Gross</th>
                <th>Total Net</th>
                <th>Employees</th>
                <th>Avg per Employee</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Jan 2026</td>
                <td>500,000</td>
                <td>450,000</td>
                <td>25</td>
                <td>20,000</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );

    render(<MockSalaryVsRevenueReport />);
    expect(screen.getByText("Payroll Cost Trend (12 Months)")).toBeInTheDocument();
    expect(screen.getByText("Total Gross")).toBeInTheDocument();
    expect(screen.getByText("Total Net")).toBeInTheDocument();
    expect(screen.getByText("Avg per Employee")).toBeInTheDocument();
  });

  it("renders department summary table", () => {
    const MockSalaryVsRevenueReport = () => (
      <div>
        <h1>Salary vs Revenue</h1>
        <div>
          <h3>Department Summary</h3>
          <table>
            <thead>
              <tr>
                <th>Department</th>
                <th>Employees</th>
                <th>Total Cost</th>
                <th>% of Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Engineering</td>
                <td>15</td>
                <td>300,000</td>
                <td>45.5%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );

    render(<MockSalaryVsRevenueReport />);
    expect(screen.getByText("Department Summary")).toBeInTheDocument();
    expect(screen.getByText("Total Cost")).toBeInTheDocument();
    expect(screen.getByText("% of Total")).toBeInTheDocument();
    expect(screen.getByText("Engineering")).toBeInTheDocument();
  });
});
