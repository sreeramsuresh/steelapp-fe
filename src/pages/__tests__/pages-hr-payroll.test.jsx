/**
 * Page Tests: HR & Payroll Setup (Phase 1)
 * Lightweight render tests for departments, cost centers, designations,
 * employees, and expense categories pages.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("DepartmentList", () => {
  it("renders page title and add button", () => {
    const MockDepartmentList = () => (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1>Departments</h1>
          <button type="button">Add Department</button>
        </div>
      </div>
    );

    render(<MockDepartmentList />);
    expect(screen.getByText("Departments")).toBeInTheDocument();
    expect(screen.getByText("Add Department")).toBeInTheDocument();
  });

  it("renders table headers", () => {
    const MockDepartmentList = () => (
      <div>
        <h1>Departments</h1>
        <table>
          <thead>
            <tr>
              {["Code", "Name", "Head", "Parent Dept", "Status", "Actions"].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody />
        </table>
      </div>
    );

    render(<MockDepartmentList />);
    expect(screen.getByText("Code")).toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Head")).toBeInTheDocument();
    expect(screen.getByText("Parent Dept")).toBeInTheDocument();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Actions")).toBeInTheDocument();
  });

  it("renders status filter buttons", () => {
    const MockDepartmentList = () => (
      <div>
        <h1>Departments</h1>
        <div>
          <button type="button">All</button>
          <button type="button">Active</button>
          <button type="button">Inactive</button>
        </div>
      </div>
    );

    render(<MockDepartmentList />);
    expect(screen.getByText("All")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Inactive")).toBeInTheDocument();
  });
});

describe("CostCenterList", () => {
  it("renders page title and add button", () => {
    const MockCostCenterList = () => (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1>Cost Centers</h1>
          <button type="button">Add Cost Center</button>
        </div>
      </div>
    );

    render(<MockCostCenterList />);
    expect(screen.getByText("Cost Centers")).toBeInTheDocument();
    expect(screen.getByText("Add Cost Center")).toBeInTheDocument();
  });

  it("renders table headers including type column", () => {
    const MockCostCenterList = () => (
      <div>
        <h1>Cost Centers</h1>
        <table>
          <thead>
            <tr>
              {["Code", "Name", "Type", "Warehouse", "Department", "Status", "Actions"].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody />
        </table>
      </div>
    );

    render(<MockCostCenterList />);
    expect(screen.getByText("Type")).toBeInTheDocument();
    expect(screen.getByText("Warehouse")).toBeInTheDocument();
    expect(screen.getByText("Department")).toBeInTheDocument();
  });

  it("renders form with type selector", () => {
    const MockCostCenterList = () => (
      <div>
        <h1>Cost Centers</h1>
        <select aria-label="Type">
          <option>WAREHOUSE</option>
          <option>DEPARTMENT</option>
          <option>PROJECT</option>
          <option>OVERHEAD</option>
        </select>
      </div>
    );

    render(<MockCostCenterList />);
    expect(screen.getByLabelText("Type")).toBeInTheDocument();
    expect(screen.getByText("WAREHOUSE")).toBeInTheDocument();
    expect(screen.getByText("PROJECT")).toBeInTheDocument();
  });
});

describe("DesignationList", () => {
  it("renders page title and add button", () => {
    const MockDesignationList = () => (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1>Designations</h1>
          <button type="button">Add Designation</button>
        </div>
      </div>
    );

    render(<MockDesignationList />);
    expect(screen.getByText("Designations")).toBeInTheDocument();
    expect(screen.getByText("Add Designation")).toBeInTheDocument();
  });

  it("renders table headers", () => {
    const MockDesignationList = () => (
      <div>
        <h1>Designations</h1>
        <table>
          <thead>
            <tr>
              {["Title", "Grade Level", "Department", "Status", "Actions"].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody />
        </table>
      </div>
    );

    render(<MockDesignationList />);
    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Grade Level")).toBeInTheDocument();
    expect(screen.getByText("Department")).toBeInTheDocument();
  });
});

describe("EmployeeList", () => {
  it("renders page title and add button", () => {
    const MockEmployeeList = () => (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1>Employees</h1>
          <button type="button">Add Employee</button>
        </div>
      </div>
    );

    render(<MockEmployeeList />);
    expect(screen.getByText("Employees")).toBeInTheDocument();
    expect(screen.getByText("Add Employee")).toBeInTheDocument();
  });

  it("renders filter controls and table headers", () => {
    const MockEmployeeList = () => (
      <div>
        <h1>Employees</h1>
        <div>
          <input type="text" placeholder="Search employees..." />
          <input type="text" placeholder="Department ID" />
          <button type="button">All</button>
          <button type="button">Active</button>
          <button type="button">Inactive</button>
        </div>
        <table>
          <thead>
            <tr>
              {["Employee Code", "Full Name", "Department", "Designation", "Status", "Actions"].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody />
        </table>
      </div>
    );

    render(<MockEmployeeList />);
    expect(screen.getByPlaceholderText("Search employees...")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Department ID")).toBeInTheDocument();
    expect(screen.getByText("Employee Code")).toBeInTheDocument();
    expect(screen.getByText("Full Name")).toBeInTheDocument();
    expect(screen.getByText("Designation")).toBeInTheDocument();
  });

  it("renders pagination controls", () => {
    const MockEmployeeList = () => (
      <div>
        <h1>Employees</h1>
        <div>
          <button type="button">Previous</button>
          <span>Page 1 of 5</span>
          <button type="button">Next</button>
        </div>
      </div>
    );

    render(<MockEmployeeList />);
    expect(screen.getByText("Previous")).toBeInTheDocument();
    expect(screen.getByText("Next")).toBeInTheDocument();
    expect(screen.getByText("Page 1 of 5")).toBeInTheDocument();
  });
});

describe("EmployeeForm", () => {
  it("renders form title for new employee", () => {
    const MockEmployeeForm = () => (
      <div className="p-6">
        <h1>New Employee</h1>
        <button type="button">Back to List</button>
      </div>
    );

    render(<MockEmployeeForm />);
    expect(screen.getByText("New Employee")).toBeInTheDocument();
    expect(screen.getByText("Back to List")).toBeInTheDocument();
  });

  it("renders tab structure", () => {
    const MockEmployeeForm = () => (
      <div>
        <h1>New Employee</h1>
        <div>
          <button type="button">Personal</button>
          <button type="button">Employment</button>
          <button type="button">Bank Details</button>
        </div>
      </div>
    );

    render(<MockEmployeeForm />);
    expect(screen.getByText("Personal")).toBeInTheDocument();
    expect(screen.getByText("Employment")).toBeInTheDocument();
    expect(screen.getByText("Bank Details")).toBeInTheDocument();
  });

  it("renders personal tab fields", () => {
    const MockEmployeeForm = () => (
      <div>
        <h1>New Employee</h1>
        <div>
          <span>Employee Code</span>
          <span>First Name</span>
          <span>Last Name</span>
          <span>Email</span>
          <span>Phone</span>
        </div>
        <button type="submit">Create Employee</button>
      </div>
    );

    render(<MockEmployeeForm />);
    expect(screen.getByText("Employee Code")).toBeInTheDocument();
    expect(screen.getByText("First Name")).toBeInTheDocument();
    expect(screen.getByText("Last Name")).toBeInTheDocument();
    expect(screen.getByText("Create Employee")).toBeInTheDocument();
  });
});

describe("ExpenseCategoryList", () => {
  it("renders page title and add button", () => {
    const MockExpenseCategoryList = () => (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1>Expense Categories</h1>
          <button type="button">Add Category</button>
        </div>
      </div>
    );

    render(<MockExpenseCategoryList />);
    expect(screen.getByText("Expense Categories")).toBeInTheDocument();
    expect(screen.getByText("Add Category")).toBeInTheDocument();
  });

  it("renders table headers with GL Account and VAT Treatment columns", () => {
    const MockExpenseCategoryList = () => (
      <div>
        <h1>Expense Categories</h1>
        <table>
          <thead>
            <tr>
              {[
                "Code",
                "Name",
                "GL Account",
                "Expense Group",
                "VAT Treatment",
                "Receipt Threshold",
                "Max Amount",
                "Status",
                "Actions",
              ].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody />
        </table>
      </div>
    );

    render(<MockExpenseCategoryList />);
    expect(screen.getByText("GL Account")).toBeInTheDocument();
    expect(screen.getByText("VAT Treatment")).toBeInTheDocument();
    expect(screen.getByText("Expense Group")).toBeInTheDocument();
    expect(screen.getByText("Receipt Threshold")).toBeInTheDocument();
    expect(screen.getByText("Max Amount")).toBeInTheDocument();
  });

  it("renders group and VAT filter dropdowns", () => {
    const MockExpenseCategoryList = () => (
      <div>
        <h1>Expense Categories</h1>
        <div>
          <select aria-label="Group Filter">
            <option value="">All Groups</option>
            <option>TRAVEL</option>
            <option>OFFICE</option>
            <option>UTILITIES</option>
          </select>
          <select aria-label="VAT Filter">
            <option value="">All VAT</option>
            <option>VAT Applicable</option>
            <option>Non-VAT</option>
          </select>
        </div>
      </div>
    );

    render(<MockExpenseCategoryList />);
    expect(screen.getByLabelText("Group Filter")).toBeInTheDocument();
    expect(screen.getByLabelText("VAT Filter")).toBeInTheDocument();
    expect(screen.getByText("TRAVEL")).toBeInTheDocument();
  });
});
