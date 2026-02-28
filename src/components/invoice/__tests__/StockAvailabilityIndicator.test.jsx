import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

vi.mock("../../../services/api", () => ({
  default: {
    get: vi.fn().mockResolvedValue({ batches: [] }),
  },
}));

vi.mock("../../../services/axiosAuthService", () => ({
  authService: {
    hasPermission: vi.fn(() => true),
  },
}));

vi.mock("lucide-react", () => ({
  AlertTriangle: (props) => <span data-testid="alert-triangle" {...props} />,
  CheckCircle: (props) => <span data-testid="check-circle" {...props} />,
  Loader2: (props) => <span data-testid="loader" {...props} />,
  Package: (props) => <span data-testid="package-icon" {...props} />,
  RefreshCw: (props) => <span data-testid="refresh-icon" {...props} />,
}));

import api from "../../../services/api";
import StockAvailabilityIndicator from "../StockAvailabilityIndicator";

describe("StockAvailabilityIndicator", () => {
  const defaultProps = {
    productId: 1,
    warehouseId: 2,
    requiredQty: 100,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows sufficient stock message when available > required", async () => {
    api.get.mockResolvedValueOnce({
      batches: [{ quantityAvailable: 150 }],
    });
    render(<StockAvailabilityIndicator {...defaultProps} />);
    expect(await screen.findByText(/150/)).toBeTruthy();
    expect(screen.getByText(/available in 1 batch/)).toBeTruthy();
  });

  it("shows insufficient stock message when partial", async () => {
    api.get.mockResolvedValueOnce({
      batches: [{ quantityAvailable: 50 }],
    });
    render(<StockAvailabilityIndicator {...defaultProps} />);
    expect(await screen.findByText("Insufficient Stock")).toBeTruthy();
  });

  it("shows no stock message when zero available", async () => {
    api.get.mockResolvedValueOnce({ batches: [] });
    render(<StockAvailabilityIndicator {...defaultProps} />);
    expect(await screen.findByText("Stock Not Available")).toBeTruthy();
  });

  it("shows error state on API failure", async () => {
    api.get.mockRejectedValueOnce({
      response: { data: { error: "Failed" } },
    });
    render(<StockAvailabilityIndicator {...defaultProps} />);
    expect(await screen.findByText("Failed")).toBeTruthy();
  });

  it("renders compact mode with sufficient stock", async () => {
    api.get.mockResolvedValueOnce({
      batches: [{ quantityAvailable: 200 }],
    });
    render(<StockAvailabilityIndicator {...defaultProps} compact={true} />);
    expect(await screen.findByText(/200/)).toBeTruthy();
  });

  it("renders compact mode with no stock", async () => {
    api.get.mockResolvedValueOnce({ batches: [] });
    render(<StockAvailabilityIndicator {...defaultProps} compact={true} />);
    expect(await screen.findByText("No Stock")).toBeTruthy();
  });

  it("renders icon-only compact mode", async () => {
    api.get.mockResolvedValueOnce({
      batches: [{ quantityAvailable: 200 }],
    });
    render(<StockAvailabilityIndicator {...defaultProps} compact={true} iconOnly={true} />);
    expect(await screen.findByTestId("check-circle")).toBeTruthy();
  });
});
