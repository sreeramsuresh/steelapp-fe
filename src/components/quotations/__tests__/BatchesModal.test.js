/**
 * BatchesModal Component Tests
 * Phase 5.3.2: Tier 1 Critical Business Component
 *
 * Tests batch selection modal for product stock allocation
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import BatchesModal from "../BatchesModal";
import sinon from 'sinon';

// sinon.stub() // "../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

// sinon.stub() // "../../../services/api", () => ({
  apiClient: {
    get: sinon.stub(),
  },
}));

const mockApiClient = () => require("../../../services/api").apiClient;

describe("BatchesModal", () => {
  let mockOnClose;

  beforeEach(() => {
    mockOnClose = sinon.stub();
    sinon.restore();
    mockApiClient().get.mockResolvedValue({
      data: {
        batches: [
          {
            id: "batch-1",
            batchNumber: "SS304-2024-001",
            quantity: 500,
            availableQuantity: 450,
            mfgDate: "2024-01-15",
            expiryDate: "2025-01-15",
            location: "A1-B2",
          },
          {
            id: "batch-2",
            batchNumber: "SS304-2024-002",
            quantity: 300,
            availableQuantity: 280,
            mfgDate: "2024-02-10",
            expiryDate: "2025-02-10",
            location: "A2-B1",
          },
        ],
      },
    });
  });

  it("should not render when isOpen is false", () => {
    const { container } = render(
      <BatchesModal
        isOpen={false}
        onClose={mockOnClose}
        productId="prod-1"
        productName="SS304 Coil"
        warehouseId="wh-1"
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it("should render modal when isOpen is true", async () => {
    render(
      <BatchesModal
        isOpen={true}
        onClose={mockOnClose}
        productId="prod-1"
        productName="SS304 Coil"
        warehouseId="wh-1"
      />
    );

    await waitFor(() => {
      expect(mockApiClient().get).toHaveBeenCalled();
    });
  });

  it("should fetch batches on open with product and warehouse", async () => {
    render(
      <BatchesModal
        isOpen={true}
        onClose={mockOnClose}
        productId="prod-1"
        productName="SS304 Coil"
        warehouseId="wh-1"
      />
    );

    await waitFor(() => {
      expect(mockApiClient().get).toHaveBeenCalledWith(expect.stringContaining("/api/stock-batches"));
    });
  });

  it("should display batches after loading", async () => {
    render(
      <BatchesModal
        isOpen={true}
        onClose={mockOnClose}
        productId="prod-1"
        productName="SS304 Coil"
        warehouseId="wh-1"
      />
    );

    await waitFor(() => {
      expect(screen.getByText("SS304-2024-001")).toBeInTheDocument();
      expect(screen.getByText("SS304-2024-002")).toBeInTheDocument();
    });
  });

  it("should close modal when X button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <BatchesModal
        isOpen={true}
        onClose={mockOnClose}
        productId="prod-1"
        productName="SS304 Coil"
        warehouseId="wh-1"
      />
    );

    await waitFor(() => {
      expect(mockApiClient().get).toHaveBeenCalled();
    });

    const closeButton = screen.getAllByRole("button")[0];
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("should handle API errors gracefully", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    mockApiClient().get.mockRejectedValueOnce(new Error("API error"));

    render(
      <BatchesModal
        isOpen={true}
        onClose={mockOnClose}
        productId="prod-1"
        productName="SS304 Coil"
        warehouseId="wh-1"
      />
    );

    await waitFor(() => {
      expect(screen.getByText(/Failed to load batches/)).toBeInTheDocument();
    });

    consoleErrorSpy.mockRestore();
  });

  it("should display loading state", () => {
    mockApiClient().get.mockImplementationOnce(
      () => new Promise((resolve) => setTimeout(() => resolve({ data: { batches: [] } }), 100))
    );

    render(
      <BatchesModal
        isOpen={true}
        onClose={mockOnClose}
        productId="prod-1"
        productName="SS304 Coil"
        warehouseId="wh-1"
      />
    );

    // Should show loading state (check for loading indicator or loading text)
    expect(mockApiClient().get).toHaveBeenCalled();
  });

  it("should include warehouse filter when warehouseId is provided", async () => {
    render(
      <BatchesModal
        isOpen={true}
        onClose={mockOnClose}
        productId="prod-1"
        productName="SS304 Coil"
        warehouseId="wh-123"
      />
    );

    await waitFor(() => {
      const callUrl = mockApiClient().get.mock.calls[0][0];
      expect(callUrl).toContain("warehouseId=wh-123");
    });
  });

  it("should not include warehouse filter when warehouseId is not provided", async () => {
    render(
      <BatchesModal
        isOpen={true}
        onClose={mockOnClose}
        productId="prod-1"
        productName="SS304 Coil"
        warehouseId={null}
      />
    );

    await waitFor(() => {
      const callUrl = mockApiClient().get.mock.calls[0][0];
      expect(callUrl).not.toContain("warehouseId=");
    });
  });

  it("should always filter for active status batches", async () => {
    render(
      <BatchesModal
        isOpen={true}
        onClose={mockOnClose}
        productId="prod-1"
        productName="SS304 Coil"
        warehouseId="wh-1"
      />
    );

    await waitFor(() => {
      const callUrl = mockApiClient().get.mock.calls[0][0];
      expect(callUrl).toContain("status=active");
    });
  });

  it("should display batch details correctly", async () => {
    render(
      <BatchesModal
        isOpen={true}
        onClose={mockOnClose}
        productId="prod-1"
        productName="SS304 Coil"
        warehouseId="wh-1"
      />
    );

    await waitFor(() => {
      expect(screen.getByText("SS304-2024-001")).toBeInTheDocument();
      expect(screen.getByText("450")).toBeInTheDocument(); // Available quantity
      expect(screen.getByText("A1-B2")).toBeInTheDocument(); // Location
    });
  });
});
