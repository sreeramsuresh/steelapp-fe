import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

vi.mock("../../services/api", () => ({
  default: {
    get: vi.fn().mockResolvedValue({ batches: [] }),
  },
}));

vi.mock("lucide-react", () => ({
  Loader2: (props) => <span data-testid="loader" {...props} />,
  Package: (props) => <span data-testid="package-icon" {...props} />,
}));

import api from "../../services/api";
import WarehouseStockSummary from "../WarehouseStockSummary";

describe("WarehouseStockSummary", () => {
  const defaultProps = {
    productId: 1,
    warehouses: [
      { id: 1, name: "Main Warehouse", code: "WH-1" },
      { id: 2, name: "Dubai Warehouse", code: "WH-2" },
    ],
    onWarehouseSelect: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when no warehouses", () => {
    api.get.mockResolvedValue({ batches: [] });
    const { container } = render(<WarehouseStockSummary {...defaultProps} warehouses={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("shows Stock label after loading", async () => {
    api.get.mockResolvedValue({
      batches: [{ quantityAvailable: 30 }],
    });
    render(<WarehouseStockSummary {...defaultProps} />);
    expect(await screen.findByText("Stock:")).toBeTruthy();
  });

  it("renders warehouse names with stock values", async () => {
    api.get.mockResolvedValue({
      batches: [{ quantityAvailable: 30 }],
    });
    render(<WarehouseStockSummary {...defaultProps} />);
    expect(await screen.findByText("Main Warehouse")).toBeTruthy();
    expect(screen.getByText("Dubai Warehouse")).toBeTruthy();
  });

  it("calls onWarehouseSelect when warehouse button is clicked", async () => {
    api.get.mockResolvedValue({
      batches: [{ quantityAvailable: 30 }],
    });
    render(<WarehouseStockSummary {...defaultProps} />);
    const btn = await screen.findByText("Main Warehouse");
    fireEvent.click(btn.closest("button"));
    expect(defaultProps.onWarehouseSelect).toHaveBeenCalledWith(1, "Main Warehouse");
  });

  it("shows zero stock correctly", async () => {
    api.get.mockResolvedValue({ batches: [] });
    render(<WarehouseStockSummary {...defaultProps} />);
    const zeros = await screen.findAllByText("0");
    expect(zeros.length).toBeGreaterThan(0);
  });
});
