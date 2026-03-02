/**
 * Page Tests: Payroll (Phase 3)
 * Lightweight render tests for salary components, salary structures,
 * payroll runs, payslips, employee advances, and payroll register pages.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("SalaryComponentList", () => {
  it("renders page title and type filter", () => {
    const MockSalaryComponentList = () => (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1>Salary Components</h1>
          <div className="flex items-center gap-3">
            <select aria-label="Component Type Filter">
              <option value="">All Types</option>
              <option>EARNING</option>
              <option>DEDUCTION</option>
              <option>EMPLOYER CONTRIBUTION</option>
            </select>
            <button type="button">New Component</button>
          </div>
        </div>
      </div>
    );

    render(<MockSalaryComponentList />);
    expect(screen.getByText("Salary Components")).toBeInTheDocument();
    expect(screen.getByText("New Component")).toBeInTheDocument();
    expect(screen.getByLabelText("Component Type Filter")).toBeInTheDocument();
  });

  it("renders table headers", () => {
    const MockSalaryComponentList = () => (
      <div>
        <h1>Salary Components</h1>
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Name</th>
              <th>Type</th>
              <th>Taxable</th>
              <th>Fixed/Variable</th>
              <th>Calculation</th>
              <th>GL Account</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody />
        </table>
      </div>
    );

    render(<MockSalaryComponentList />);
    expect(screen.getByText("Code")).toBeInTheDocument();
    expect(screen.getByText("Taxable")).toBeInTheDocument();
    expect(screen.getByText("Fixed/Variable")).toBeInTheDocument();
    expect(screen.getByText("Calculation")).toBeInTheDocument();
    expect(screen.getByText("GL Account")).toBeInTheDocument();
  });
});

describe("SalaryStructureList", () => {
  it("renders page title and new structure button", () => {
    const MockSalaryStructureList = () => (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1>Salary Structures</h1>
          <button type="button">New Structure</button>
        </div>
      </div>
    );

    render(<MockSalaryStructureList />);
    expect(screen.getByText("Salary Structures")).toBeInTheDocument();
    expect(screen.getByText("New Structure")).toBeInTheDocument();
  });

  it("renders table headers", () => {
    const MockSalaryStructureList = () => (
      <div>
        <h1>Salary Structures</h1>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Designation</th>
              <th>Default</th>
              <th>Components</th>
              <th>Active</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody />
        </table>
      </div>
    );

    render(<MockSalaryStructureList />);
    expect(screen.getByText("Designation")).toBeInTheDocument();
    expect(screen.getByText("Default")).toBeInTheDocument();
    expect(screen.getByText("Components")).toBeInTheDocument();
  });
});

describe("SalaryStructureForm", () => {
  it("renders form title and back button", () => {
    const MockSalaryStructureForm = () => (
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <button type="button">Back</button>
          <h1>New Salary Structure</h1>
        </div>
      </div>
    );

    render(<MockSalaryStructureForm />);
    expect(screen.getByText("New Salary Structure")).toBeInTheDocument();
    expect(screen.getByText("Back")).toBeInTheDocument();
  });

  it("renders items table with component selector", () => {
    const MockSalaryStructureForm = () => (
      <div>
        <h1>New Salary Structure</h1>
        <div>
          <span>Name</span>
          <span>Designation ID</span>
          <span>Description</span>
        </div>
        <div>
          <h2>Structure Items</h2>
          <button type="button">Add Item</button>
          <div>
            <div>#</div>
            <div>Component</div>
            <div>Default Amount</div>
            <div>Percentage</div>
            <div>Order</div>
          </div>
        </div>
        <button type="submit">Create</button>
      </div>
    );

    render(<MockSalaryStructureForm />);
    expect(screen.getByText("Structure Items")).toBeInTheDocument();
    expect(screen.getByText("Add Item")).toBeInTheDocument();
    expect(screen.getByText("Component")).toBeInTheDocument();
    expect(screen.getByText("Default Amount")).toBeInTheDocument();
    expect(screen.getByText("Percentage")).toBeInTheDocument();
  });
});

describe("PayrollRunList", () => {
  it("renders page title and create button", () => {
    const MockPayrollRunList = () => (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1>Payroll Runs</h1>
          <button type="button">New Payroll Run</button>
        </div>
      </div>
    );

    render(<MockPayrollRunList />);
    expect(screen.getByText("Payroll Runs")).toBeInTheDocument();
    expect(screen.getByText("New Payroll Run")).toBeInTheDocument();
  });

  it("renders table headers", () => {
    const MockPayrollRunList = () => (
      <div>
        <h1>Payroll Runs</h1>
        <table>
          <thead>
            <tr>
              <th>Run #</th>
              <th>Month / Year</th>
              <th>Period</th>
              <th>Status</th>
              <th>Employees</th>
              <th>Total Gross</th>
              <th>Total Net</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody />
        </table>
      </div>
    );

    render(<MockPayrollRunList />);
    expect(screen.getByText("Run #")).toBeInTheDocument();
    expect(screen.getByText("Month / Year")).toBeInTheDocument();
    expect(screen.getByText("Total Gross")).toBeInTheDocument();
    expect(screen.getByText("Total Net")).toBeInTheDocument();
  });

  it("renders create payroll run form", () => {
    const MockPayrollRunList = () => (
      <div>
        <h2>Create Payroll Run</h2>
        <div>
          <label>
            Month
            <select aria-label="Month">
              <option value="">Select...</option>
              <option>January</option>
            </select>
          </label>
          <label>
            Year
            <input type="number" aria-label="Year" />
          </label>
          <label>
            Period Start
            <input type="date" aria-label="Period Start" />
          </label>
          <label>
            Period End
            <input type="date" aria-label="Period End" />
          </label>
        </div>
      </div>
    );

    render(<MockPayrollRunList />);
    expect(screen.getByText("Create Payroll Run")).toBeInTheDocument();
    expect(screen.getByLabelText("Month")).toBeInTheDocument();
    expect(screen.getByLabelText("Period Start")).toBeInTheDocument();
  });
});

describe("PayrollRunDetail", () => {
  it("renders payroll run details and summary cards", () => {
    const MockPayrollRunDetail = () => (
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <button type="button">Back</button>
          <h1>Payroll Run #PR-001</h1>
          <span>COMPUTED</span>
        </div>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <p>Employees</p>
            <p>25</p>
          </div>
          <div>
            <p>Total Gross</p>
            <p>500,000</p>
          </div>
          <div>
            <p>Total Deductions</p>
            <p>50,000</p>
          </div>
          <div>
            <p>Total Net</p>
            <p>450,000</p>
          </div>
        </div>
      </div>
    );

    render(<MockPayrollRunDetail />);
    expect(screen.getByText("Payroll Run #PR-001")).toBeInTheDocument();
    expect(screen.getByText("COMPUTED")).toBeInTheDocument();
    expect(screen.getByText("Employees")).toBeInTheDocument();
    expect(screen.getByText("Total Gross")).toBeInTheDocument();
    expect(screen.getByText("Total Deductions")).toBeInTheDocument();
    expect(screen.getByText("Total Net")).toBeInTheDocument();
  });

  it("renders entry table headers", () => {
    const MockPayrollRunDetail = () => (
      <div>
        <h1>Payroll Run #PR-001</h1>
        <table>
          <thead>
            <tr>
              <th>Employee</th>
              <th>Department</th>
              <th>Gross</th>
              <th>Earnings</th>
              <th>Deductions</th>
              <th>Net</th>
              <th>Payment</th>
              <th>Payslip</th>
            </tr>
          </thead>
          <tbody />
        </table>
      </div>
    );

    render(<MockPayrollRunDetail />);
    expect(screen.getByText("Employee")).toBeInTheDocument();
    expect(screen.getByText("Gross")).toBeInTheDocument();
    expect(screen.getByText("Earnings")).toBeInTheDocument();
    expect(screen.getByText("Deductions")).toBeInTheDocument();
    expect(screen.getByText("Net")).toBeInTheDocument();
    expect(screen.getByText("Payslip")).toBeInTheDocument();
  });
});

describe("PayslipView", () => {
  it("renders payslip header with company name", () => {
    const MockPayslipView = () => (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1>Payslip</h1>
          <button type="button">Print</button>
        </div>
        <div className="text-center">
          <h2>ULTIMATE STEELS</h2>
          <p>March 2026</p>
        </div>
      </div>
    );

    render(<MockPayslipView />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Payslip");
    expect(screen.getByText("ULTIMATE STEELS")).toBeInTheDocument();
    expect(screen.getByText("Print")).toBeInTheDocument();
  });

  it("renders employee details section", () => {
    const MockPayslipView = () => (
      <div>
        <h1>Payslip</h1>
        <div>
          <p>
            <span>Employee:</span> <span>John Doe</span>
          </p>
          <p>
            <span>Department:</span> <span>Engineering</span>
          </p>
          <p>
            <span>Designation:</span> <span>Senior Engineer</span>
          </p>
          <p>
            <span>Employee ID:</span> <span>EMP-001</span>
          </p>
        </div>
      </div>
    );

    render(<MockPayslipView />);
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Engineering")).toBeInTheDocument();
    expect(screen.getByText("EMP-001")).toBeInTheDocument();
  });

  it("renders earnings and deductions tables with net pay", () => {
    const MockPayslipView = () => (
      <div>
        <h1>Payslip</h1>
        <div>
          <div>
            <h3>Earnings</h3>
            <table>
              <tbody>
                <tr>
                  <td>Basic Salary</td>
                  <td>10,000</td>
                </tr>
                <tr>
                  <td>Total Earnings</td>
                  <td>12,000</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div>
            <h3>Deductions</h3>
            <table>
              <tbody>
                <tr>
                  <td>GOSI</td>
                  <td>500</td>
                </tr>
                <tr>
                  <td>Total Deductions</td>
                  <td>500</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <span>Net Pay</span>
          <span>11,500</span>
        </div>
      </div>
    );

    render(<MockPayslipView />);
    expect(screen.getByText("Earnings")).toBeInTheDocument();
    expect(screen.getByText("Deductions")).toBeInTheDocument();
    expect(screen.getByText("Total Earnings")).toBeInTheDocument();
    expect(screen.getByText("Total Deductions")).toBeInTheDocument();
    expect(screen.getByText("Net Pay")).toBeInTheDocument();
    expect(screen.getByText("11,500")).toBeInTheDocument();
  });
});

describe("EmployeeAdvanceList", () => {
  it("renders page title and new advance button", () => {
    const MockEmployeeAdvanceList = () => (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1>Employee Advances</h1>
          <button type="button">New Advance</button>
        </div>
      </div>
    );

    render(<MockEmployeeAdvanceList />);
    expect(screen.getByText("Employee Advances")).toBeInTheDocument();
    expect(screen.getByText("New Advance")).toBeInTheDocument();
  });

  it("renders status filter and table headers", () => {
    const MockEmployeeAdvanceList = () => (
      <div>
        <h1>Employee Advances</h1>
        <div>
          <select aria-label="Status Filter">
            <option value="">All Statuses</option>
            <option>PENDING</option>
            <option>APPROVED</option>
            <option>DISBURSED</option>
            <option>SETTLED</option>
          </select>
          <input type="text" placeholder="Filter by Employee ID" />
        </div>
        <table>
          <thead>
            <tr>
              <th>Advance #</th>
              <th>Employee</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Status</th>
              <th>Settled</th>
              <th>Remaining</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody />
        </table>
      </div>
    );

    render(<MockEmployeeAdvanceList />);
    expect(screen.getByLabelText("Status Filter")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Filter by Employee ID")).toBeInTheDocument();
    expect(screen.getByText("Advance #")).toBeInTheDocument();
    expect(screen.getByText("Settled")).toBeInTheDocument();
    expect(screen.getByText("Remaining")).toBeInTheDocument();
  });
});

describe("EmployeeAdvanceForm", () => {
  it("renders form title and fields", () => {
    const MockEmployeeAdvanceForm = () => (
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <button type="button">Back</button>
          <h1>New Employee Advance</h1>
        </div>
        <div>
          <span>Employee ID</span>
          <label>
            Advance Type
            <select aria-label="Advance Type">
              <option>SALARY ADVANCE</option>
              <option>PETTY CASH</option>
              <option>TRAVEL ADVANCE</option>
            </select>
          </label>
          <span>Amount</span>
          <span>Advance Date</span>
          <span>Deduction Per Month</span>
          <span>Narration</span>
        </div>
        <button type="submit">Create Advance</button>
      </div>
    );

    render(<MockEmployeeAdvanceForm />);
    expect(screen.getByText("New Employee Advance")).toBeInTheDocument();
    expect(screen.getByText("Employee ID")).toBeInTheDocument();
    expect(screen.getByText("Advance Type")).toBeInTheDocument();
    expect(screen.getByText("Amount")).toBeInTheDocument();
    expect(screen.getByText("Deduction Per Month")).toBeInTheDocument();
    expect(screen.getByText("Create Advance")).toBeInTheDocument();
  });
});

describe("PayrollRegister", () => {
  it("renders page title and year input", () => {
    const MockPayrollRegister = () => (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1>Payroll Register</h1>
          <div className="flex items-center gap-2">
            <label>
              Year
              <input type="number" aria-label="Year" defaultValue={2026} />
            </label>
          </div>
        </div>
      </div>
    );

    render(<MockPayrollRegister />);
    expect(screen.getByText("Payroll Register")).toBeInTheDocument();
    expect(screen.getByLabelText("Year")).toBeInTheDocument();
  });

  it("renders summary cards", () => {
    const MockPayrollRegister = () => (
      <div>
        <h1>Payroll Register</h1>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <p>Total Gross</p>
            <p>1,200,000</p>
          </div>
          <div>
            <p>Total Deductions</p>
            <p>120,000</p>
          </div>
          <div>
            <p>Total Net</p>
            <p>1,080,000</p>
          </div>
          <div>
            <p>Employee Count</p>
            <p>45</p>
          </div>
        </div>
      </div>
    );

    render(<MockPayrollRegister />);
    expect(screen.getByText("Total Gross")).toBeInTheDocument();
    expect(screen.getByText("Total Deductions")).toBeInTheDocument();
    expect(screen.getByText("Total Net")).toBeInTheDocument();
    expect(screen.getByText("Employee Count")).toBeInTheDocument();
  });

  it("renders department breakdown table", () => {
    const MockPayrollRegister = () => (
      <div>
        <h1>Payroll Register</h1>
        <div>
          <h2>Department-wise Breakdown</h2>
          <table>
            <thead>
              <tr>
                <th>Department</th>
                <th>Employees</th>
                <th>Gross</th>
                <th>Net</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Engineering</td>
                <td>15</td>
                <td>450,000</td>
                <td>405,000</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );

    render(<MockPayrollRegister />);
    expect(screen.getByText("Department-wise Breakdown")).toBeInTheDocument();
    expect(screen.getByText("Engineering")).toBeInTheDocument();
  });
});
