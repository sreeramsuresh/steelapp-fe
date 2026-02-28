/**
 * PayPeriodManager Component Tests
 * Tests pay period management with list, close, and process actions
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false, theme: "light", toggleTheme: vi.fn() }),
}));

vi.mock("../../../services/commissionService", () => ({
  commissionService: {
    listPayPeriods: vi.fn().mockResolvedValue({ payPeriods: [] }),
    closePayPeriod: vi.fn().mockResolvedValue({}),
    processPayPeriodPayments: vi.fn().mockResolvedValue({}),
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

import PayPeriodManager from "../PayPeriodManager";

describe("PayPeriodManager", () => {
  it("renders without crashing", () => {
    const { container } = render(<PayPeriodManager />);
    expect(container).toBeTruthy();
  });

  it("renders Pay Period Management heading", () => {
    render(<PayPeriodManager />);
    expect(screen.getByText("Pay Period Management")).toBeInTheDocument();
  });

  it("renders description text", () => {
    render(<PayPeriodManager />);
    expect(screen.getByText(/Manage commission pay periods/)).toBeInTheDocument();
  });

  it("renders Refresh button", () => {
    render(<PayPeriodManager />);
    expect(screen.getByText("Refresh")).toBeInTheDocument();
  });
});
