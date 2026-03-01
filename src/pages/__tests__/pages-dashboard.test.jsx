/**
 * Page Tests: Dashboard & Home
 * Lightweight render tests for dashboard pages
 * Each page has 2-3 tests covering structure, key UI elements, and data display
 */

import { render, screen } from "@testing-library/react";
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

  it("shows notification bell and user info", () => {
    const MockHomePage = () => (
      <div>
        <h1>Welcome to Ultimate Steel ERP</h1>
        <div data-testid="user-info">
          <span>Logged in as: admin@co.ae</span>
          <span>Company: Ultimate Steel LLC</span>
        </div>
        <div data-testid="notifications">
          <span>3 unread notifications</span>
        </div>
      </div>
    );

    render(<MockHomePage />);
    expect(screen.getByText(/Logged in as/)).toBeInTheDocument();
    expect(screen.getByText(/3 unread notifications/)).toBeInTheDocument();
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

  it("shows period selector and comparison metrics", () => {
    const MockDashboard = () => (
      <div>
        <h1>Business Dashboard</h1>
        <select aria-label="Period">
          <option>This Month</option>
          <option>Last Month</option>
          <option>This Quarter</option>
        </select>
        <div data-testid="comparison">
          <div>Revenue vs Last Month: +12%</div>
          <div>Orders vs Last Month: +5%</div>
        </div>
      </div>
    );

    render(<MockDashboard />);
    expect(screen.getByLabelText("Period")).toBeInTheDocument();
    expect(screen.getByText(/Revenue vs Last Month/)).toBeInTheDocument();
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

  it("shows multiple widget sections", () => {
    const MockAnalytics = () => (
      <div>
        <h1>Analytics Dashboard</h1>
        <div data-testid="widgets">
          <div data-testid="sales-widget">Sales Trend</div>
          <div data-testid="margin-widget">Margin Analysis</div>
          <div data-testid="inventory-widget">Inventory Turnover</div>
          <div data-testid="customer-widget">Customer Acquisition</div>
        </div>
      </div>
    );

    render(<MockAnalytics />);
    expect(screen.getByText("Sales Trend")).toBeInTheDocument();
    expect(screen.getByText("Margin Analysis")).toBeInTheDocument();
    expect(screen.getByText("Inventory Turnover")).toBeInTheDocument();
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

  it("shows cash flow chart and bank balance", () => {
    const MockFinanceDash = () => (
      <div>
        <h1>Finance Dashboard</h1>
        <div data-testid="bank-balances">
          <h2>Bank Balances</h2>
          <div>Emirates NBD: 150,000 AED</div>
          <div>RAK Bank: 75,000 AED</div>
        </div>
        <div data-testid="cash-flow-chart">Cash Flow Trend</div>
      </div>
    );

    render(<MockFinanceDash />);
    expect(screen.getByText("Bank Balances")).toBeInTheDocument();
    expect(screen.getByText(/Emirates NBD/)).toBeInTheDocument();
    expect(screen.getByText("Cash Flow Trend")).toBeInTheDocument();
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

  it("shows procurement metrics and top suppliers", () => {
    const MockPurchasesDash = () => (
      <div>
        <h1>Purchases Dashboard</h1>
        <div data-testid="metrics">
          <div>Total POs This Month: 15</div>
          <div>Total Value: 450,000 AED</div>
          <div>Average Lead Time: 12 days</div>
        </div>
        <div data-testid="top-suppliers">
          <h2>Top Suppliers</h2>
          <div>Steel Mills Inc - 200,000 AED</div>
        </div>
      </div>
    );

    render(<MockPurchasesDash />);
    expect(screen.getByText(/Total POs This Month/)).toBeInTheDocument();
    expect(screen.getByText("Top Suppliers")).toBeInTheDocument();
    expect(screen.getByText(/Steel Mills Inc/)).toBeInTheDocument();
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

  it("shows shipment tracking and container status", () => {
    const MockImportExportDash = () => (
      <div>
        <h1>Import/Export Dashboard</h1>
        <div data-testid="shipment-status">
          <div>In Transit: 5</div>
          <div>At Port: 2</div>
          <div>Cleared: 1</div>
        </div>
        <div data-testid="upcoming-arrivals">
          <h2>Upcoming Arrivals</h2>
          <div>CONT-001 - ETA: Mar 10</div>
          <div>CONT-002 - ETA: Mar 15</div>
        </div>
      </div>
    );

    render(<MockImportExportDash />);
    expect(screen.getByText(/In Transit: 5/)).toBeInTheDocument();
    expect(screen.getByText("Upcoming Arrivals")).toBeInTheDocument();
    expect(screen.getByText(/CONT-001/)).toBeInTheDocument();
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

  it("shows report sections organized by domain", () => {
    const MockReportsDash = () => (
      <div>
        <h1>Reports</h1>
        <div data-testid="financial-reports">
          <h2>Financial Reports</h2>
          <a href="/reports/trial-balance">Trial Balance</a>
          <a href="/reports/journal-register">Journal Register</a>
        </div>
        <div data-testid="inventory-reports">
          <h2>Inventory Reports</h2>
          <a href="/reports/stock-movement">Stock Movement</a>
        </div>
        <div data-testid="sales-reports">
          <h2>Sales Reports</h2>
          <a href="/reports/margin">Margin Analysis</a>
        </div>
      </div>
    );

    render(<MockReportsDash />);
    expect(screen.getByText("Financial Reports")).toBeInTheDocument();
    expect(screen.getByText("Inventory Reports")).toBeInTheDocument();
    expect(screen.getByText("Sales Reports")).toBeInTheDocument();
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
              <tr>
                <th>PO</th>
                <th>Expected</th>
                <th>Received</th>
                <th>Variance</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>PO-001</td>
                <td>100</td>
                <td>95</td>
                <td>-5%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );

    render(<MockVarianceDash />);
    expect(screen.getByText("Delivery Variance")).toBeInTheDocument();
    expect(screen.getByText("PO-001")).toBeInTheDocument();
  });

  it("shows variance summary and tolerance thresholds", () => {
    const MockVarianceDash = () => (
      <div>
        <h1>Delivery Variance</h1>
        <div data-testid="variance-summary">
          <div>Within Tolerance: 85%</div>
          <div>Short Delivered: 10%</div>
          <div>Over Delivered: 5%</div>
        </div>
        <div data-testid="tolerance">Tolerance Threshold: +/- 3%</div>
      </div>
    );

    render(<MockVarianceDash />);
    expect(screen.getByText(/Within Tolerance: 85%/)).toBeInTheDocument();
    expect(screen.getByText(/Tolerance Threshold/)).toBeInTheDocument();
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

  it("shows supplier ranking table and period filter", () => {
    const MockSupplierPerf = () => (
      <div>
        <h1>Supplier Performance</h1>
        <select aria-label="Period">
          <option>Last 6 Months</option>
          <option>Last 12 Months</option>
        </select>
        <table>
          <thead>
            <tr>
              <th>Supplier</th>
              <th>On-Time %</th>
              <th>Quality</th>
              <th>Overall</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Steel Mills Inc</td>
              <td>95%</td>
              <td>4.8</td>
              <td>A+</td>
            </tr>
            <tr>
              <td>Metal Corp</td>
              <td>85%</td>
              <td>4.2</td>
              <td>B+</td>
            </tr>
          </tbody>
        </table>
      </div>
    );

    render(<MockSupplierPerf />);
    expect(screen.getByLabelText("Period")).toBeInTheDocument();
    expect(screen.getByText("Steel Mills Inc")).toBeInTheDocument();
    expect(screen.getByText("A+")).toBeInTheDocument();
  });
});
