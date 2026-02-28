import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false, toggleTheme: vi.fn() }),
}));

vi.mock("../../../services/warehouseService", () => ({
  warehouseService: {
    getAll: vi.fn().mockResolvedValue({ data: [{ id: 1, name: "Main Warehouse" }, { id: 2, name: "Dubai Warehouse" }] }),
  },
}));

vi.mock("../../../services/stockMovementService", () => ({
  stockMovementService: {
    getStockLevels: vi.fn().mockResolvedValue({ data: [] }),
    createTransfer: vi.fn().mockResolvedValue({}),
  },
}));

import TransferForm from "../TransferForm";

describe("TransferForm", () => {
  it("renders without crashing", () => {
    const { container } = render(<TransferForm onCancel={vi.fn()} onSuccess={vi.fn()} />);
    expect(container).toBeTruthy();
  });

  it("displays form title", () => {
    render(<TransferForm onCancel={vi.fn()} onSuccess={vi.fn()} />);
    expect(screen.getByText("Create Stock Transfer")).toBeInTheDocument();
  });

  it("has source and destination warehouse selects", () => {
    render(<TransferForm onCancel={vi.fn()} onSuccess={vi.fn()} />);
    expect(screen.getByLabelText(/Source Warehouse/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Destination Warehouse/)).toBeInTheDocument();
  });
});
