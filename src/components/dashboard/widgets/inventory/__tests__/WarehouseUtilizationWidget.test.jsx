import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

import WarehouseUtilizationWidget from "../WarehouseUtilizationWidget";

describe("WarehouseUtilizationWidget", () => {
  it("renders without crashing", () => {
    render(<WarehouseUtilizationWidget />);
  });

  it("renders with fallback data showing warehouse names", () => {
    render(<WarehouseUtilizationWidget data={null} />);
    // Fallback data should be used
  });

  it("renders with custom data", () => {
    const data = {
      warehouses: [
        {
          id: 1,
          name: "Main Warehouse",
          code: "WH-01",
          city: "Dubai",
          capacity: 500,
          used: 425,
          utilization: 85,
          value: 2850000,
          items: 456,
          status: "high",
        },
      ],
      totalCapacity: 500,
      totalUsed: 425,
      overallUtilization: 85,
      transfers: [],
    };
    render(<WarehouseUtilizationWidget data={data} />);
    expect(screen.getByText("Main Warehouse")).toBeInTheDocument();
  });

  it("renders without crashing when empty warehouses", () => {
    render(<WarehouseUtilizationWidget data={{ warehouses: [] }} />);
  });
});
