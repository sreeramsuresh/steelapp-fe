import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false, toggleTheme: vi.fn() }),
}));

vi.mock("../../../services/stockMovementService", () => ({
  stockMovementService: {
    listTransfers: vi.fn().mockResolvedValue({ data: [] }),
    listReservations: vi.fn().mockResolvedValue({ data: [] }),
    getAll: vi.fn().mockResolvedValue({ data: [], pagination: { totalItems: 0 } }),
  },
}));

import StockMovementOverview from "../StockMovementOverview";

describe("StockMovementOverview", () => {
  it("renders without crashing", () => {
    const { container } = render(<StockMovementOverview onNavigateToTab={vi.fn()} />);
    expect(container).toBeTruthy();
  });

  it("displays overview header", () => {
    render(<StockMovementOverview onNavigateToTab={vi.fn()} />);
    expect(screen.getByText("Stock Movement Overview")).toBeInTheDocument();
  });

  it("shows quick action cards", () => {
    render(<StockMovementOverview onNavigateToTab={vi.fn()} />);
    expect(screen.getByText("New Transfer")).toBeInTheDocument();
    expect(screen.getByText("Reconcile Stock")).toBeInTheDocument();
    expect(screen.getByText("View Reports")).toBeInTheDocument();
  });
});
