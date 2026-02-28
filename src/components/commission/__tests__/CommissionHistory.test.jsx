/**
 * CommissionHistory Component Tests
 * Tests historical commission view with filtering and pagination
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false, theme: "light", toggleTheme: vi.fn() }),
}));

vi.mock("../../../services/commissionService", () => ({
  commissionService: {
    getSalesPersonCommissions: vi.fn().mockResolvedValue({
      commissions: [],
    }),
  },
}));

vi.mock("../../../services/notificationService", () => ({
  notificationService: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("../../../utils/invoiceUtils", () => ({
  formatCurrency: (val) => `AED ${Number(val || 0).toFixed(2)}`,
  formatDate: (val) => val || "",
}));

import CommissionHistory from "../CommissionHistory";

describe("CommissionHistory", () => {
  it("renders without crashing with no salesPersonId", () => {
    const { container } = render(<CommissionHistory />);
    expect(container).toBeTruthy();
  });

  it("shows select prompt when no salesPersonId", () => {
    render(<CommissionHistory />);
    expect(screen.getByText(/Select a sales person/)).toBeInTheDocument();
  });

  it("renders Commission History heading when salesPersonId provided", () => {
    render(<CommissionHistory salesPersonId={1} salesPersonName="John Doe" />);
    expect(screen.getByText("Commission History")).toBeInTheDocument();
  });

  it("renders sales person name", () => {
    render(<CommissionHistory salesPersonId={1} salesPersonName="John Doe" />);
    expect(screen.getByText("John Doe")).toBeInTheDocument();
  });

  it("renders Refresh button", () => {
    render(<CommissionHistory salesPersonId={1} />);
    expect(screen.getByText("Refresh")).toBeInTheDocument();
  });

  it("renders summary cards", () => {
    render(<CommissionHistory salesPersonId={1} />);
    expect(screen.getByText("Total Earned")).toBeInTheDocument();
    // "Pending" and "Approved" also appear in the status filter dropdown,
    // so use getAllByText to check they exist
    expect(screen.getAllByText("Pending").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Approved").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Paid").length).toBeGreaterThan(0);
  });

  it("renders filter controls", () => {
    render(<CommissionHistory salesPersonId={1} />);
    expect(screen.getByPlaceholderText("Search invoice...")).toBeInTheDocument();
    expect(screen.getByText("All Statuses")).toBeInTheDocument();
    expect(screen.getByText("Clear Filters")).toBeInTheDocument();
  });
});
