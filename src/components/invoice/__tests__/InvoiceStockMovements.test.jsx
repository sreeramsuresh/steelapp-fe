import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

vi.mock("../../services/invoiceService", () => ({
  invoiceService: {
    getInvoiceStockMovements: vi.fn().mockResolvedValue([]),
    createStockMovements: vi.fn().mockResolvedValue({ success: true }),
  },
}));

vi.mock("date-fns", () => ({
  format: (date, fmt) => "01 Jan 2024 10:00",
}));

import { invoiceService } from "../../services/invoiceService";
import InvoiceStockMovements from "../InvoiceStockMovements";

describe("InvoiceStockMovements", () => {
  const defaultProps = {
    invoiceId: 1,
    invoiceNumber: "INV-001",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows empty state when no movements", async () => {
    invoiceService.getInvoiceStockMovements.mockResolvedValueOnce([]);
    render(<InvoiceStockMovements {...defaultProps} />);
    expect(await screen.findByText("No stock movements recorded for this invoice")).toBeTruthy();
  });

  it("shows Stock Movements header by default", async () => {
    invoiceService.getInvoiceStockMovements.mockResolvedValueOnce([]);
    render(<InvoiceStockMovements {...defaultProps} />);
    expect(await screen.findByText("Stock Movements")).toBeTruthy();
  });

  it("hides header when showHeader is false", async () => {
    invoiceService.getInvoiceStockMovements.mockResolvedValueOnce([]);
    render(<InvoiceStockMovements {...defaultProps} showHeader={false} />);
    await screen.findByText("No stock movements recorded for this invoice");
    expect(screen.queryByText("Stock Movements")).toBeNull();
  });

  it("shows Deduct Stock Manually button when no movements exist", async () => {
    invoiceService.getInvoiceStockMovements.mockResolvedValueOnce([]);
    render(<InvoiceStockMovements {...defaultProps} />);
    expect(await screen.findByText("Deduct Stock Manually")).toBeTruthy();
  });

  it("renders movements table when data exists", async () => {
    invoiceService.getInvoiceStockMovements.mockResolvedValueOnce([
      {
        id: 1,
        movementType: "OUT",
        quantity: 50,
        unit: "KG",
        productName: "Steel Bar",
        movementDate: "2024-01-15T10:00:00Z",
        warehouseName: "Main Warehouse",
        balanceAfter: 150,
      },
    ]);
    render(<InvoiceStockMovements {...defaultProps} />);
    expect(await screen.findByText("Steel Bar")).toBeTruthy();
    expect(screen.getByText("Stock Deducted")).toBeTruthy();
    expect(screen.getByText("Stock Returned")).toBeTruthy();
  });

  it("shows error message on API failure", async () => {
    invoiceService.getInvoiceStockMovements.mockRejectedValueOnce(new Error("Network error"));
    render(<InvoiceStockMovements {...defaultProps} />);
    expect(await screen.findByText("Network error")).toBeTruthy();
  });
});
