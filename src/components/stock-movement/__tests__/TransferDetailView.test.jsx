import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false, toggleTheme: vi.fn() }),
}));

vi.mock("../../../services/stockMovementService", () => ({
  stockMovementService: {
    getAllMovements: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

import TransferDetailView from "../TransferDetailView";

const mockTransfer = {
  id: 1,
  transferNumber: "TF-001",
  status: "SHIPPED",
  sourceWarehouseName: "Main Warehouse",
  destinationWarehouseName: "Dubai Warehouse",
  createdAt: "2026-01-15T10:00:00Z",
  shippedDate: "2026-01-16T10:00:00Z",
  receivedDate: null,
  transferDate: "2026-01-15",
  notes: "Urgent transfer",
  vehicleNumber: "ABC-123",
  driverName: "Ahmed",
};

describe("TransferDetailView", () => {
  it("returns null when no transfer provided", () => {
    const { container } = render(<TransferDetailView transfer={null} onBack={vi.fn()} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders transfer number and status", () => {
    render(<TransferDetailView transfer={mockTransfer} onBack={vi.fn()} />);
    expect(screen.getByText("TF-001")).toBeInTheDocument();
    expect(screen.getAllByText("Shipped").length).toBeGreaterThan(0);
  });

  it("renders source and destination warehouses", () => {
    render(<TransferDetailView transfer={mockTransfer} onBack={vi.fn()} />);
    expect(screen.getByText("Main Warehouse")).toBeInTheDocument();
    expect(screen.getByText("Dubai Warehouse")).toBeInTheDocument();
  });
});
