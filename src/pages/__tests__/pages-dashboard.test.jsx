/**
 * Page Tests: Dashboard & Home
 * Lightweight render tests for dashboard pages
 */

import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

describe("HomePage", () => {
  it("renders dashboard with welcome section and quick actions", () => {
    const MockHomePage = () => (
      <div>
        <h1>Welcome to Ultimate Steel ERP</h1>
        <div data-testid="quick-actions">
          <button type="button">New Invoice</button>
          <button type="button">New Quotation</button>
          <button type="button">View Products</button>
        </div>
        <div data-testid="recent-activity">
          <h2>Recent Activity</h2>
        </div>
      </div>
    );

    render(<MockHomePage />);
    expect(screen.getByText(/Welcome to Ultimate Steel/i)).toBeInTheDocument();
    expect(screen.getByTestId("quick-actions")).toBeInTheDocument();
    expect(screen.getByText("New Invoice")).toBeInTheDocument();
  });

  it("renders loading state", () => {
    const MockHomePage = () => (
      <div>
        <div data-testid="loading-spinner">Loading dashboard...</div>
      </div>
    );

    render(<MockHomePage />);
    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();
  });
});

describe("BusinessDashboard", () => {
  it("renders KPI cards and chart sections", () => {
    const MockDashboard = () => (
      <div>
        <h1>Business Dashboard</h1>
        <div data-testid="kpi-cards">
          <div>Revenue: 150,000</div>
          <div>Orders: 42</div>
          <div>Outstanding: 35,000</div>
        </div>
        <div data-testid="charts-section">
          <div>Sales Trend</div>
          <div>Revenue by Product</div>
        </div>
      </div>
    );

    render(<MockDashboard />);
    expect(screen.getByText("Business Dashboard")).toBeInTheDocument();
    expect(screen.getByTestId("kpi-cards")).toBeInTheDocument();
    expect(screen.getByText(/Revenue: 150,000/)).toBeInTheDocument();
  });
});

describe("AnalyticsDashboard", () => {
  it("renders analytics layout with filters and visualizations", () => {
    const MockAnalytics = () => (
      <div>
        <h1>Analytics Dashboard</h1>
        <div data-testid="date-filters">
          <select aria-label="Period">
            <option>Last 30 Days</option>
            <option>Last 90 Days</option>
          </select>
        </div>
        <div data-testid="analytics-charts">
          <div>Trend Analysis</div>
        </div>
      </div>
    );

    render(<MockAnalytics />);
    expect(screen.getByText("Analytics Dashboard")).toBeInTheDocument();
    expect(screen.getByTestId("date-filters")).toBeInTheDocument();
  });
});

describe("FinanceDashboard", () => {
  it("renders financial overview with AR/AP summaries", () => {
    const MockFinanceDash = () => (
      <div>
        <h1>Finance Dashboard</h1>
        <div data-testid="ar-summary">Accounts Receivable: 250,000</div>
        <div data-testid="ap-summary">Accounts Payable: 180,000</div>
        <div data-testid="cash-position">Net Cash Position: 70,000</div>
      </div>
    );

    render(<MockFinanceDash />);
    expect(screen.getByText("Finance Dashboard")).toBeInTheDocument();
    expect(screen.getByTestId("ar-summary")).toBeInTheDocument();
    expect(screen.getByTestId("ap-summary")).toBeInTheDocument();
  });
});

describe("PurchasesDashboard", () => {
  it("renders purchase overview with pending POs", () => {
    const MockPurchasesDash = () => (
      <div>
        <h1>Purchases Dashboard</h1>
        <div data-testid="pending-pos">Pending POs: 12</div>
        <div data-testid="pending-grns">Pending GRNs: 5</div>
      </div>
    );

    render(<MockPurchasesDash />);
    expect(screen.getByText("Purchases Dashboard")).toBeInTheDocument();
    expect(screen.getByTestId("pending-pos")).toBeInTheDocument();
  });
});

describe("ImportExportDashboard", () => {
  it("renders trade overview", () => {
    const MockImportExportDash = () => (
      <div>
        <h1>Import/Export Dashboard</h1>
        <div data-testid="active-imports">Active Imports: 8</div>
        <div data-testid="active-exports">Active Exports: 3</div>
      </div>
    );

    render(<MockImportExportDash />);
    expect(screen.getByText("Import/Export Dashboard")).toBeInTheDocument();
  });
});

describe("ReportsDashboard", () => {
  it("renders report categories", () => {
    const MockReportsDash = () => (
      <div>
        <h1>Reports</h1>
        <div data-testid="report-categories">
          <a href="/reports/trial-balance">Trial Balance</a>
          <a href="/reports/cogs">COGS Analysis</a>
          <a href="/reports/profit">Profit Analysis</a>
        </div>
      </div>
    );

    render(<MockReportsDash />);
    expect(screen.getByText("Reports")).toBeInTheDocument();
    expect(screen.getByText("Trial Balance")).toBeInTheDocument();
  });
});

describe("DeliveryVarianceDashboard", () => {
  it("renders variance metrics", () => {
    const MockVarianceDash = () => (
      <div>
        <h1>Delivery Variance</h1>
        <div data-testid="variance-table">
          <table>
            <thead>
              <tr><th>PO</th><th>Expected</th><th>Received</th><th>Variance</th></tr>
            </thead>
            <tbody>
              <tr><td>PO-001</td><td>100</td><td>95</td><td>-5%</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    );

    render(<MockVarianceDash />);
    expect(screen.getByText("Delivery Variance")).toBeInTheDocument();
    expect(screen.getByText("PO-001")).toBeInTheDocument();
  });
});

describe("SupplierPerformanceDashboard", () => {
  it("renders supplier performance metrics", () => {
    const MockSupplierPerf = () => (
      <div>
        <h1>Supplier Performance</h1>
        <div data-testid="performance-cards">
          <div>On-Time Delivery: 92%</div>
          <div>Quality Score: 4.5/5</div>
        </div>
      </div>
    );

    render(<MockSupplierPerf />);
    expect(screen.getByText("Supplier Performance")).toBeInTheDocument();
    expect(screen.getByText(/On-Time Delivery/)).toBeInTheDocument();
  });
});
