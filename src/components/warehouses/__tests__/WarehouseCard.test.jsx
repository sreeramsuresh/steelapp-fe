/**
 * WarehouseCard Component Tests
 * Tests warehouse card display with status, location, and actions
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false, theme: "light", toggleTheme: vi.fn() }),
}));

vi.mock("../../../services/axiosAuthService", () => ({
  authService: {
    hasPermission: vi.fn().mockReturnValue(true),
  },
}));

import WarehouseCard from "../WarehouseCard";

describe("WarehouseCard", () => {
  const defaultWarehouse = {
    name: "Main Warehouse",
    code: "WH-MAIN",
    city: "Dubai",
    state: "Dubai",
    country: "UAE",
    contactPerson: "Ahmed Hassan",
    phone: "+971-50-123-4567",
    email: "wh@example.com",
    capacity: 5000,
    capacityUnit: "MT",
    isActive: true,
    isDefault: false,
    inventoryCount: 150,
    utilizationPercent: 65,
  };

  const defaultProps = {
    warehouse: defaultWarehouse,
    onView: vi.fn(),
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onSetDefault: vi.fn(),
  };

  it("renders without crashing", () => {
    const { container } = render(<WarehouseCard {...defaultProps} />);
    expect(container).toBeTruthy();
  });

  it("renders warehouse name", () => {
    render(<WarehouseCard {...defaultProps} />);
    expect(screen.getByText("Main Warehouse")).toBeInTheDocument();
  });

  it("renders warehouse code", () => {
    render(<WarehouseCard {...defaultProps} />);
    expect(screen.getByText("WH-MAIN")).toBeInTheDocument();
  });

  it("renders location", () => {
    render(<WarehouseCard {...defaultProps} />);
    expect(screen.getByText("Dubai, Dubai, UAE")).toBeInTheDocument();
  });

  it("renders Active status badge when active", () => {
    render(<WarehouseCard {...defaultProps} />);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("renders Inactive status badge when not active", () => {
    const inactive = { ...defaultWarehouse, isActive: false };
    render(<WarehouseCard {...defaultProps} warehouse={inactive} />);
    expect(screen.getByText("Inactive")).toBeInTheDocument();
  });

  it("renders Default badge when isDefault", () => {
    const defaultWh = { ...defaultWarehouse, isDefault: true };
    render(<WarehouseCard {...defaultProps} warehouse={defaultWh} />);
    expect(screen.getByText("Default")).toBeInTheDocument();
  });

  it("does not render Default badge when not default", () => {
    render(<WarehouseCard {...defaultProps} />);
    expect(screen.queryByText("Default")).not.toBeInTheDocument();
  });

  it("renders contact person", () => {
    render(<WarehouseCard {...defaultProps} />);
    expect(screen.getByText("Ahmed Hassan")).toBeInTheDocument();
  });

  it("renders phone number", () => {
    render(<WarehouseCard {...defaultProps} />);
    expect(screen.getByText("+971-50-123-4567")).toBeInTheDocument();
  });

  it("renders utilization percentage", () => {
    render(<WarehouseCard {...defaultProps} />);
    expect(screen.getByText("65%")).toBeInTheDocument();
  });

  it("renders View Dashboard button", () => {
    render(<WarehouseCard {...defaultProps} />);
    expect(screen.getByText(/View Dashboard/)).toBeInTheDocument();
  });

  it("renders more actions button", () => {
    render(<WarehouseCard {...defaultProps} />);
    expect(screen.getByLabelText("More actions")).toBeInTheDocument();
  });
});
