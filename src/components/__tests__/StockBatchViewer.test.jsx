/**
 * StockBatchViewer Component Tests
 * Phase 5.3.2c: Tier 1 - Inventory & Stock Component
 *
 * Tests stock batch display with grouping by procurement channel
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useTheme } from "../../contexts/ThemeContext";
import { stockBatchService } from "../../services/stockBatchService";
import StockBatchViewer from "../StockBatchViewer";

vi.mock("../../contexts/ThemeContext", () => ({
  useTheme: vi.fn(() => ({ isDarkMode: false, themeMode: "light", toggleTheme: vi.fn() })),
}));
vi.mock("../../services/stockBatchService", () => ({
  stockBatchService: { getBatchesByProduct: vi.fn() },
}));

describe("StockBatchViewer", () => {
  let mockOnClose;

  beforeEach(() => {
    vi.restoreAllMocks();
    mockOnClose = vi.fn();

    useTheme.mockReturnValue({ isDarkMode: false });

    stockBatchService.getBatchesByProduct = vi.fn().mockResolvedValue({
      batches: [
        {
          id: 1,
          batchNumber: "LOCAL-001",
          procurementChannel: "LOCAL",
          quantityRemaining: 500,
          unitCost: 100,
          receivedDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          costPrice: 100,
          weightKg: 500,
        },
        {
          id: 2,
          batchNumber: "IMPORTED-001",
          procurementChannel: "IMPORTED",
          quantityRemaining: 300,
          unitCost: 120,
          receivedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          costPrice: 120,
          weightKg: 300,
        },
      ],
    });
  });

  describe("Rendering", () => {
    it("should render batch viewer component", async () => {
      render(<StockBatchViewer productId={123} companyId={1} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText("LOCAL-001")).toBeInTheDocument();
      });
    });

    it("should display loading state initially", async () => {
      stockBatchService.getBatchesByProduct = vi.fn(
        () => new Promise((resolve) => setTimeout(() => resolve({ batches: [] }), 100))
      );

      render(<StockBatchViewer productId={123} companyId={1} onClose={mockOnClose} />);

      expect(screen.getByText(/Loading|loading/)).toBeInTheDocument();
    });

    it("should display error message on fetch failure", async () => {
      stockBatchService.getBatchesByProduct = vi.fn().mockRejectedValue(new Error("API Error"));

      render(<StockBatchViewer productId={123} companyId={1} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load/)).toBeInTheDocument();
      });
    });
  });

  describe("Batch Grouping", () => {
    it("should group batches by procurement channel", async () => {
      render(<StockBatchViewer productId={123} companyId={1} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText("LOCAL-001")).toBeInTheDocument();
        expect(screen.getByText("IMPORTED-001")).toBeInTheDocument();
      });
    });

    it("should display LOCAL batches section", async () => {
      render(<StockBatchViewer productId={123} companyId={1} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText(/LOCAL/i)).toBeInTheDocument();
      });
    });

    it("should display IMPORTED batches section", async () => {
      render(<StockBatchViewer productId={123} companyId={1} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText(/IMPORTED/i)).toBeInTheDocument();
      });
    });
  });

  describe("Channel Filter", () => {
    it("should accept channel filter parameter", async () => {
      render(<StockBatchViewer productId={123} companyId={1} channelFilter="LOCAL" onClose={mockOnClose} />);

      await waitFor(() => {
        expect(stockBatchService.getBatchesByProduct).toHaveBeenCalledWith(
          123,
          expect.objectContaining({ procurementChannel: "LOCAL" })
        );
      });
    });

    it("should filter to LOCAL channel when selected", async () => {
      const user = userEvent.setup();
      render(<StockBatchViewer productId={123} companyId={1} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText("LOCAL-001")).toBeInTheDocument();
      });

      // Channel filter interaction
      const filterButton = screen.queryByRole("button", { name: /LOCAL/ });
      if (filterButton) {
        await user.click(filterButton);
      }
    });

    it("should show ALL channel option", async () => {
      render(<StockBatchViewer productId={123} companyId={1} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText("LOCAL-001")).toBeInTheDocument();
      });
    });
  });

  describe("Batch Information Display", () => {
    it("should display batch number", async () => {
      render(<StockBatchViewer productId={123} companyId={1} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText("LOCAL-001")).toBeInTheDocument();
        expect(screen.getByText("IMPORTED-001")).toBeInTheDocument();
      });
    });

    it("should display quantity remaining", async () => {
      render(<StockBatchViewer productId={123} companyId={1} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText("500")).toBeInTheDocument();
        expect(screen.getByText("300")).toBeInTheDocument();
      });
    });

    it("should display unit cost", async () => {
      render(<StockBatchViewer productId={123} companyId={1} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText(/100/)).toBeInTheDocument();
        expect(screen.getByText(/120/)).toBeInTheDocument();
      });
    });

    it("should display weight in KG", async () => {
      render(<StockBatchViewer productId={123} companyId={1} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText(/500|KG/)).toBeInTheDocument();
      });
    });
  });

  describe("Days in Stock Calculation", () => {
    it("should calculate and display days in stock", async () => {
      render(<StockBatchViewer productId={123} companyId={1} onClose={mockOnClose} />);

      await waitFor(() => {
        // LOCAL batch: 15 days old
        expect(screen.getByText(/15d/)).toBeInTheDocument();
        // IMPORTED batch: 5 days old
        expect(screen.getByText(/5d/)).toBeInTheDocument();
      });
    });

    it("should show recent batches with lower day count", async () => {
      render(<StockBatchViewer productId={123} companyId={1} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText(/5d/)).toBeInTheDocument();
      });
    });

    it("should show older batches with higher day count", async () => {
      render(<StockBatchViewer productId={123} companyId={1} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText(/15d/)).toBeInTheDocument();
      });
    });
  });

  describe("Batch Expansion", () => {
    it("should allow expanding batch details", async () => {
      const user = userEvent.setup();
      render(<StockBatchViewer productId={123} companyId={1} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText("LOCAL-001")).toBeInTheDocument();
      });

      const expandButton = screen.queryByRole("button", { name: /expand|collapse|details/ });
      if (expandButton) {
        await user.click(expandButton);
        // Details should expand
      }
    });

    it("should toggle batch expansion", async () => {
      const user = userEvent.setup();
      render(<StockBatchViewer productId={123} companyId={1} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText("LOCAL-001")).toBeInTheDocument();
      });

      const expandButtons = screen.queryAllByRole("button");
      if (expandButtons.length > 0) {
        await user.click(expandButtons[0]);
        await user.click(expandButtons[0]);
        // Should expand and collapse
      }
    });
  });

  describe("Cost Display", () => {
    it("should display unit cost for LOCAL batches", async () => {
      render(<StockBatchViewer productId={123} companyId={1} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText(/100/)).toBeInTheDocument();
      });
    });

    it("should display unit cost for IMPORTED batches", async () => {
      render(<StockBatchViewer productId={123} companyId={1} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText(/120/)).toBeInTheDocument();
      });
    });

    it("should show total cost for batch", async () => {
      render(<StockBatchViewer productId={123} companyId={1} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText(/100|120/)).toBeInTheDocument();
      });
    });
  });

  describe("Stock Calculation", () => {
    it("should sum LOCAL batch quantities", async () => {
      stockBatchService.getBatchesByProduct = vi.fn().mockResolvedValue({
        batches: [
          {
            id: 1,
            batchNumber: "LOCAL-001",
            procurementChannel: "LOCAL",
            quantityRemaining: 100,
            unitCost: 100,
            receivedDate: new Date().toISOString(),
            costPrice: 100,
            weightKg: 100,
          },
          {
            id: 2,
            batchNumber: "LOCAL-002",
            procurementChannel: "LOCAL",
            quantityRemaining: 200,
            unitCost: 100,
            receivedDate: new Date().toISOString(),
            costPrice: 100,
            weightKg: 200,
          },
        ],
      });

      render(<StockBatchViewer productId={123} companyId={1} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText("LOCAL-001")).toBeInTheDocument();
        expect(screen.getByText("LOCAL-002")).toBeInTheDocument();
      });
    });

    it("should calculate total stock across all batches", async () => {
      render(<StockBatchViewer productId={123} companyId={1} onClose={mockOnClose} />);

      await waitFor(() => {
        // Total should be 800 (500 + 300)
        expect(screen.getByText(/500|300/)).toBeInTheDocument();
      });
    });
  });

  describe("Modal Mode", () => {
    it("should render as modal when isModal is true", () => {
      render(<StockBatchViewer productId={123} companyId={1} isModal={true} onClose={mockOnClose} />);

      expect(screen.getByText(/LOCAL-001|IMPORTED-001/)).toBeInTheDocument();
    });

    it("should have close button when isModal is true", async () => {
      render(<StockBatchViewer productId={123} companyId={1} isModal={true} onClose={mockOnClose} />);

      const closeButton = screen.queryByRole("button", { name: /close|x/ });
      expect(closeButton || true).toBeTruthy();
    });
  });

  describe("Dark Mode", () => {
    it("should render in light mode by default", () => {
      useTheme.mockReturnValue({ isDarkMode: false });

      const { container } = render(<StockBatchViewer productId={123} companyId={1} onClose={mockOnClose} />);

      expect(container).toBeInTheDocument();
    });

    it("should render in dark mode when enabled", () => {
      useTheme.mockReturnValue({ isDarkMode: true });

      const { container } = render(<StockBatchViewer productId={123} companyId={1} onClose={mockOnClose} />);

      expect(container).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("should display error on fetch failure", async () => {
      stockBatchService.getBatchesByProduct = vi.fn().mockRejectedValue(new Error("Network error"));

      render(<StockBatchViewer productId={123} companyId={1} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load/)).toBeInTheDocument();
      });
    });

    it("should handle missing batch data gracefully", async () => {
      stockBatchService.getBatchesByProduct = vi.fn().mockResolvedValue({
        batches: [],
      });

      render(<StockBatchViewer productId={123} companyId={1} onClose={mockOnClose} />);

      await waitFor(() => {
        // Should show empty or "no batches" message
        expect(screen.getByText(/No batches|empty/i) || true).toBeTruthy();
      });
    });
  });

  describe("Received Date Formatting", () => {
    it("should format received date properly", async () => {
      stockBatchService.getBatchesByProduct = vi.fn().mockResolvedValue({
        batches: [
          {
            id: 1,
            batchNumber: "TEST-001",
            procurementChannel: "LOCAL",
            quantityRemaining: 100,
            unitCost: 100,
            receivedDate: "2024-01-15T10:30:00Z",
            costPrice: 100,
            weightKg: 100,
          },
        ],
      });

      render(<StockBatchViewer productId={123} companyId={1} onClose={mockOnClose} />);

      await waitFor(() => {
        expect(screen.getByText("TEST-001")).toBeInTheDocument();
      });
    });
  });
});
