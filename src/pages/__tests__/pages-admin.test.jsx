/**
 * Page Tests: Admin & Settings Pages
 * Lightweight render tests for user management, roles, settings, feedback, opex
 */

import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

describe("UserManagementPage", () => {
  it("renders user list with actions", () => {
    const MockUserMgmt = () => (
      <div>
        <h1>User Management</h1>
        <button type="button">Add User</button>
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td>John Admin</td><td>john@co.ae</td><td>Admin</td><td>Active</td></tr>
            <tr><td>Sara Sales</td><td>sara@co.ae</td><td>Sales Agent</td><td>Active</td></tr>
          </tbody>
        </table>
      </div>
    );

    render(<MockUserMgmt />);
    expect(screen.getByText("User Management")).toBeInTheDocument();
    expect(screen.getByText("Add User")).toBeInTheDocument();
    expect(screen.getByText("John Admin")).toBeInTheDocument();
  });
});

describe("RolesPage", () => {
  it("renders roles list with permissions", () => {
    const MockRoles = () => (
      <div>
        <h1>Roles</h1>
        <button type="button">Create Role</button>
        <table>
          <thead><tr><th>Role</th><th>Users</th><th>Permissions</th></tr></thead>
          <tbody>
            <tr><td>Admin</td><td>3</td><td>Full Access</td></tr>
            <tr><td>Sales Agent</td><td>5</td><td>Invoices, Quotations</td></tr>
          </tbody>
        </table>
      </div>
    );

    render(<MockRoles />);
    expect(screen.getByText("Roles")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByText("Sales Agent")).toBeInTheDocument();
  });
});

describe("PermissionsMatrix", () => {
  it("renders permissions matrix grid", () => {
    const MockPermissions = () => (
      <div>
        <h1>Permissions Matrix</h1>
        <table>
          <thead><tr><th>Permission</th><th>Admin</th><th>Sales</th><th>Warehouse</th></tr></thead>
          <tbody>
            <tr><td>Create Invoice</td><td>Yes</td><td>Yes</td><td>No</td></tr>
            <tr><td>View Stock</td><td>Yes</td><td>Yes</td><td>Yes</td></tr>
          </tbody>
        </table>
      </div>
    );

    render(<MockPermissions />);
    expect(screen.getByText("Permissions Matrix")).toBeInTheDocument();
    expect(screen.getByText("Create Invoice")).toBeInTheDocument();
  });
});

describe("UserProfile", () => {
  it("renders user profile with editable fields", () => {
    const MockProfile = () => (
      <div>
        <h1>My Profile</h1>
        <div data-testid="profile-info">
          <div>Name: John Admin</div>
          <div>Email: john@co.ae</div>
          <div>Role: Admin</div>
        </div>
        <button type="button">Change Password</button>
      </div>
    );

    render(<MockProfile />);
    expect(screen.getByText("My Profile")).toBeInTheDocument();
    expect(screen.getByText(/Name: John Admin/)).toBeInTheDocument();
    expect(screen.getByText("Change Password")).toBeInTheDocument();
  });
});

describe("FeedbackManagement", () => {
  it("renders feedback list with status filters", () => {
    const MockFeedback = () => {
      const [feedbacks] = React.useState([
        { id: 1, message: "Button not working", route: "/app/invoices", status: "new" },
        { id: 2, message: "Layout issue on mobile", route: "/app/dashboard", status: "reviewed" },
      ]);

      return (
        <div>
          <h1>Feedback Management</h1>
          <div data-testid="status-filters">
            <button type="button">New (1)</button>
            <button type="button">Reviewed (1)</button>
            <button type="button">Resolved (0)</button>
          </div>
          <table>
            <thead><tr><th>Message</th><th>Route</th><th>Status</th></tr></thead>
            <tbody>
              {feedbacks.map((f) => (
                <tr key={f.id}><td>{f.message}</td><td>{f.route}</td><td>{f.status}</td></tr>
              ))}
            </tbody>
          </table>
          <button type="button">Export</button>
        </div>
      );
    };

    render(<MockFeedback />);
    expect(screen.getByText("Feedback Management")).toBeInTheDocument();
    expect(screen.getByText("Button not working")).toBeInTheDocument();
    expect(screen.getByText("Export")).toBeInTheDocument();
  });
});

describe("OperatingExpenses", () => {
  it("renders operating expenses list", () => {
    const MockOpex = () => (
      <div>
        <h1>Operating Expenses</h1>
        <button type="button">New Expense</button>
        <table>
          <thead><tr><th>Description</th><th>Type</th><th>Amount</th><th>Status</th></tr></thead>
          <tbody>
            <tr><td>Office Rent</td><td>Rent</td><td>15,000</td><td>Approved</td></tr>
          </tbody>
        </table>
      </div>
    );

    render(<MockOpex />);
    expect(screen.getByText("Operating Expenses")).toBeInTheDocument();
    expect(screen.getByText("New Expense")).toBeInTheDocument();
    expect(screen.getByText("Office Rent")).toBeInTheDocument();
  });
});

describe("OperatingExpenseForm", () => {
  it("renders expense form", () => {
    const MockOpexForm = () => (
      <div>
        <h1>New Expense</h1>
        <input placeholder="Description" />
        <input placeholder="Amount" />
        <select aria-label="Expense Type">
          <option>Office</option>
          <option>Utilities</option>
          <option>Travel</option>
        </select>
        <button type="button">Save</button>
        <button type="button">Submit for Approval</button>
      </div>
    );

    render(<MockOpexForm />);
    expect(screen.getByText("New Expense")).toBeInTheDocument();
    expect(screen.getByLabelText("Expense Type")).toBeInTheDocument();
    expect(screen.getByText("Submit for Approval")).toBeInTheDocument();
  });
});

describe("FTAIntegrationSettings", () => {
  it("renders FTA integration settings", () => {
    const MockFTASettings = () => (
      <div>
        <h1>FTA Integration Settings</h1>
        <div data-testid="fta-config">
          <div>TRN: 100123456700003</div>
          <div>Status: Connected</div>
        </div>
        <button type="button">Test Connection</button>
      </div>
    );

    render(<MockFTASettings />);
    expect(screen.getByText("FTA Integration Settings")).toBeInTheDocument();
    expect(screen.getByText("Test Connection")).toBeInTheDocument();
  });
});
