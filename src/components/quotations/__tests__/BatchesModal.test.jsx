import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

vi.mock("../../services/api", () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue({ batches: [] }),
  },
}));

vi.mock("lucide-react", () => ({
  AlertCircle: (props) => <span data-testid="alert-circle" {...props} />,
  Package: (props) => <span data-testid="package-icon" {...props} />,
  X: (props) => <span data-testid="x-icon" {...props} />,
}));

import { apiClient } from "../../services/api";
import BatchesModal from "../BatchesModal";

describe("BatchesModal", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    productId: 1,
    productName: "Steel Bar 10mm",
    warehouseId: 2,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when not open", () => {
    const { container } = render(
      <BatchesModal {...defaultProps} isOpen={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders modal header with product name", () => {
    apiClient.get.mockResolvedValueOnce({ batches: [] });
    render(<BatchesModal {...defaultProps} />);
    expect(screen.getByText("Available Batches")).toBeTruthy();
    expect(screen.getByText("Steel Bar 10mm")).toBeTruthy();
  });

  it("shows empty state when no batches", async () => {
    apiClient.get.mockResolvedValueOnce({ batches: [] });
    render(<BatchesModal {...defaultProps} />);
    expect(
      await screen.findByText("No batches available for this product")
    ).toBeTruthy();
  });

  it("renders batches table when data exists", async () => {
    apiClient.get.mockResolvedValueOnce({
      batches: [
        {
          id: 1,
          batchNumber: "B-001",
          heatNumber: "H-100",
          warehouseName: "Main",
          grade: "60",
          availableQuantity: 50,
          reservedQuantity: 10,
          unit: "PCS",
        },
      ],
    });
    render(<BatchesModal {...defaultProps} />);
    expect(await screen.findByText("B-001")).toBeTruthy();
    expect(screen.getByText("H-100")).toBeTruthy();
    expect(screen.getByText("Main")).toBeTruthy();
  });

  it("shows error message on API failure", async () => {
    apiClient.get.mockRejectedValueOnce(new Error("Network error"));
    render(<BatchesModal {...defaultProps} />);
    expect(
      await screen.findByText("Failed to load batches. Please try again.")
    ).toBeTruthy();
  });

  it("shows Close button in footer", () => {
    apiClient.get.mockResolvedValueOnce({ batches: [] });
    render(<BatchesModal {...defaultProps} />);
    // There should be a Close button in footer
    const closeButtons = screen.getAllByText("Close");
    expect(closeButtons.length).toBeGreaterThan(0);
  });

  it("calls onClose when Close button is clicked", () => {
    apiClient.get.mockResolvedValueOnce({ batches: [] });
    render(<BatchesModal {...defaultProps} />);
    // Click the text Close button (footer)
    const closeButtons = screen.getAllByRole("button");
    const footerClose = closeButtons.find(
      (btn) => btn.textContent === "Close"
    );
    if (footerClose) fireEvent.click(footerClose);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
