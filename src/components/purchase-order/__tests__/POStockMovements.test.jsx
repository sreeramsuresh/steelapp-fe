import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

vi.mock("../../../services/stockMovementService", () => ({
  stockMovementService: {
    getByPurchaseOrder: vi.fn(),
  },
  MOVEMENT_TYPES: {
    IN: { label: "Stock In", color: "green" },
    OUT: { label: "Stock Out", color: "default" },
  },
}));

vi.mock("@/components/ui/table", () => ({
  Table: ({ children, className }) => <table className={className}>{children}</table>,
  TableBody: ({ children }) => <tbody>{children}</tbody>,
  TableCell: ({ children, className }) => <td className={className}>{children}</td>,
  TableHead: ({ children, className }) => <th className={className}>{children}</th>,
  TableHeader: ({ children }) => <thead>{children}</thead>,
  TableRow: ({ children, className }) => <tr className={className}>{children}</tr>,
}));

vi.mock("lucide-react", () => ({
  ChevronDown: (props) => <svg data-testid="chevron-down" {...props} />,
  ChevronUp: (props) => <svg data-testid="chevron-up" {...props} />,
  Package: (props) => <svg {...props} />,
  Truck: (props) => <svg {...props} />,
}));

import { stockMovementService } from "../../../services/stockMovementService";
import POStockMovements from "../POStockMovements";

describe("POStockMovements", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when no purchaseOrderId is provided", () => {
    const { container } = render(<POStockMovements purchaseOrderId={null} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders stock movements header", async () => {
    stockMovementService.getByPurchaseOrder.mockResolvedValue({ data: [] });
    render(<POStockMovements purchaseOrderId={1} />);
    expect(screen.getByText("Stock Movements")).toBeInTheDocument();
  });

  it("shows no stock received message when empty", async () => {
    stockMovementService.getByPurchaseOrder.mockResolvedValue({ data: [] });
    render(<POStockMovements purchaseOrderId={1} />);
    await waitFor(() => {
      expect(screen.getByText(/No stock has been received/)).toBeInTheDocument();
    });
  });

  it("renders movement count badge when movements exist", async () => {
    stockMovementService.getByPurchaseOrder.mockResolvedValue({
      data: [{ id: 1, movementType: "IN", quantity: 100, productName: "Steel Rod", movementDate: "2025-01-15" }],
    });
    render(<POStockMovements purchaseOrderId={1} />);
    await waitFor(() => {
      expect(screen.getByText("1 movement")).toBeInTheDocument();
    });
  });

  it("shows error state on failure", async () => {
    stockMovementService.getByPurchaseOrder.mockRejectedValue(new Error("Network error"));
    render(<POStockMovements purchaseOrderId={1} />);
    await waitFor(() => {
      expect(screen.getByText("Failed to load stock movements")).toBeInTheDocument();
    });
  });

  it("toggles expanded state when header is clicked", async () => {
    stockMovementService.getByPurchaseOrder.mockResolvedValue({ data: [] });
    render(<POStockMovements purchaseOrderId={1} defaultExpanded={true} />);
    await waitFor(() => {
      expect(screen.getByText(/No stock has been received/)).toBeInTheDocument();
    });
    // Click to collapse
    fireEvent.click(screen.getByText("Stock Movements").closest("button"));
    expect(screen.queryByText(/No stock has been received/)).not.toBeInTheDocument();
  });

  it("starts collapsed when defaultExpanded is false", async () => {
    stockMovementService.getByPurchaseOrder.mockResolvedValue({ data: [] });
    render(<POStockMovements purchaseOrderId={1} defaultExpanded={false} />);
    await waitFor(() => {
      // Should not show the content area
      expect(screen.queryByText(/No stock has been received/)).not.toBeInTheDocument();
    });
  });
});
