import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false, toggleTheme: vi.fn() }),
}));

vi.mock("../../../services/stockMovementService", () => ({
  stockMovementService: {
    listTransfers: vi.fn().mockResolvedValue({ data: [], pagination: { totalItems: 0 } }),
    shipTransfer: vi.fn(),
    receiveTransfer: vi.fn(),
    cancelTransfer: vi.fn(),
  },
  TRANSFER_STATUSES: {
    DRAFT: { value: "DRAFT", label: "Draft", color: "default" },
    SHIPPED: { value: "SHIPPED", label: "Shipped", color: "primary" },
    COMPLETED: { value: "COMPLETED", label: "Completed", color: "success" },
  },
}));

vi.mock("../../../services/warehouseService", () => ({
  warehouseService: {
    getAll: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

vi.mock("../../../services/axiosAuthService", () => ({
  authService: {
    hasPermission: vi.fn().mockReturnValue(true),
  },
}));

import TransferList from "../TransferList";

describe("TransferList", () => {
  it("renders without crashing", () => {
    const { container } = render(<TransferList onCreateNew={vi.fn()} onViewTransfer={vi.fn()} />);
    expect(container).toBeTruthy();
  });

  it("shows New Transfer button", () => {
    render(<TransferList onCreateNew={vi.fn()} onViewTransfer={vi.fn()} />);
    expect(screen.getByText("New Transfer")).toBeInTheDocument();
  });

  it("shows search input", () => {
    render(<TransferList onCreateNew={vi.fn()} onViewTransfer={vi.fn()} />);
    expect(screen.getByPlaceholderText("Search transfers...")).toBeInTheDocument();
  });
});
