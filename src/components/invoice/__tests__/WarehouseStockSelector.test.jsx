import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

vi.mock("../../services/api", () => ({
  default: {
    get: vi.fn().mockResolvedValue({ batches: [] }),
  },
}));

vi.mock("../../services/axiosAuthService", () => ({
  authService: {
    hasPermission: vi.fn(() => true),
  },
}));

vi.mock("lucide-react", () => ({
  AlertCircle: (props) => <span data-testid="alert-circle" {...props} />,
  Loader2: (props) => <span data-testid="loader" {...props} />,
  Package: (props) => <span data-testid="package-icon" {...props} />,
}));

import api from "../../services/api";
import WarehouseStockSelector from "../WarehouseStockSelector";

describe("WarehouseStockSelector", () => {
  const defaultProps = {
    productId: 1,
    warehouses: [
      { id: 1, name: "Main Warehouse", code: "WH-1" },
      { id: 2, name: "Abu Dhabi Warehouse", code: "WH-2" },
    ],
    selectedWarehouseId: null,
    onWarehouseSelect: vi.fn(),
    companyId: 1,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows no warehouses message when empty", () => {
    render(
      <WarehouseStockSelector {...defaultProps} warehouses={[]} />
    );
    expect(screen.getByText("No warehouses available")).toBeTruthy();
  });

  it("shows stock availability label", async () => {
    api.get.mockResolvedValue({
      batches: [{ quantityAvailable: 50 }],
    });
    render(<WarehouseStockSelector {...defaultProps} />);
    expect(
      await screen.findByText("Stock availability:")
    ).toBeTruthy();
  });

  it("renders warehouse buttons", async () => {
    api.get.mockResolvedValue({
      batches: [{ quantityAvailable: 50 }],
    });
    render(<WarehouseStockSelector {...defaultProps} />);
    expect(await screen.findByText("Main Warehouse")).toBeTruthy();
    expect(screen.getByText("Abu Dhabi Warehouse")).toBeTruthy();
  });

  it("calls onWarehouseSelect when warehouse is clicked", async () => {
    api.get.mockResolvedValue({
      batches: [{ quantityAvailable: 50 }],
    });
    render(<WarehouseStockSelector {...defaultProps} />);
    const btn = await screen.findByText("Main Warehouse");
    fireEvent.click(btn.closest("button"));
    expect(defaultProps.onWarehouseSelect).toHaveBeenCalledWith(1, true);
  });

  it("shows error message on API failure", async () => {
    api.get.mockRejectedValue(new Error("Network error"));
    render(<WarehouseStockSelector {...defaultProps} />);
    expect(
      await screen.findByText("Failed to load stock availability")
    ).toBeTruthy();
  });
});
