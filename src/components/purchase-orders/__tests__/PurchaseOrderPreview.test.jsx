import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

vi.mock("../../../constants/defaultTemplateSettings", () => ({
  getDocumentTemplateColor: () => "#0d9488",
}));

vi.mock("../../../utils/invoiceUtils", () => ({
  formatCurrency: (val) => `AED ${parseFloat(val || 0).toFixed(2)}`,
  TIMEZONE_DISCLAIMER: "All dates shown in UAE timezone",
  toUAEDateProfessional: (d) => d || "N/A",
}));

const mockValidate = vi.fn().mockReturnValue({ isValid: true, warnings: [] });
vi.mock("../../../utils/recordUtils", () => ({
  validatePurchaseOrderForDownload: (...args) => mockValidate(...args),
}));

vi.mock("lucide-react", () => ({
  AlertTriangle: (props) => <svg {...props} />,
  X: (props) => <svg data-testid="x-icon" {...props} />,
}));

import PurchaseOrderPreview from "../PurchaseOrderPreview";

const purchaseOrder = {
  id: 1,
  poNumber: "PO-2025-001",
  status: "confirmed",
  poDate: "2025-01-15",
  deliveryDate: "2025-02-15",
  supplierName: "ABC Steel Supplier",
  supplierDetails: {
    company: "ABC Steel Co.",
    address: { street: "123 Industrial St", city: "Dubai", emirate: "Dubai" },
    vatNumber: "TRN-123456",
  },
  items: [
    { id: 1, name: "Steel Rod", quantity: 100, unit: "KG", rate: 50, vatRate: 5, amount: 5000 },
    { id: 2, name: "Steel Sheet", quantity: 50, unit: "KG", rate: 80, vatRate: 5, amount: 4000 },
  ],
  notes: "Please deliver by noon",
  warehouseName: "Main Warehouse",
};

const company = { name: "Ultimate Steel Trading LLC", phone: "+971-4-123-4567" };

describe("PurchaseOrderPreview", () => {
  it("renders preview header", () => {
    render(<PurchaseOrderPreview purchaseOrder={purchaseOrder} company={company} onClose={() => {}} />);
    expect(screen.getByText("Purchase Order Preview")).toBeInTheDocument();
  });

  it("renders PURCHASE ORDER document title", () => {
    render(<PurchaseOrderPreview purchaseOrder={purchaseOrder} company={company} onClose={() => {}} />);
    expect(screen.getByText("PURCHASE ORDER")).toBeInTheDocument();
  });

  it("displays PO number", () => {
    render(<PurchaseOrderPreview purchaseOrder={purchaseOrder} company={company} onClose={() => {}} />);
    expect(screen.getByText("PO-2025-001")).toBeInTheDocument();
  });

  it("displays supplier name", () => {
    render(<PurchaseOrderPreview purchaseOrder={purchaseOrder} company={company} onClose={() => {}} />);
    expect(screen.getByText("ABC Steel Supplier")).toBeInTheDocument();
  });

  it("displays status badge", () => {
    render(<PurchaseOrderPreview purchaseOrder={purchaseOrder} company={company} onClose={() => {}} />);
    expect(screen.getByText("Confirmed")).toBeInTheDocument();
  });

  it("displays items table with product names", () => {
    render(<PurchaseOrderPreview purchaseOrder={purchaseOrder} company={company} onClose={() => {}} />);
    expect(screen.getByText("Steel Rod")).toBeInTheDocument();
    expect(screen.getByText("Steel Sheet")).toBeInTheDocument();
  });

  it("displays item count", () => {
    render(<PurchaseOrderPreview purchaseOrder={purchaseOrder} company={company} onClose={() => {}} />);
    expect(screen.getByText("Items (2)")).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    const onClose = vi.fn();
    render(<PurchaseOrderPreview purchaseOrder={purchaseOrder} company={company} onClose={onClose} />);
    fireEvent.click(screen.getByTitle("Close preview"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("displays notes section", () => {
    render(<PurchaseOrderPreview purchaseOrder={purchaseOrder} company={company} onClose={() => {}} />);
    expect(screen.getByText("Please deliver by noon")).toBeInTheDocument();
  });

  it("shows validation warnings when validation fails", () => {
    mockValidate.mockReturnValue({
      isValid: false,
      warnings: ["Missing supplier TRN", "No items added"],
    });
    render(<PurchaseOrderPreview purchaseOrder={purchaseOrder} company={company} onClose={() => {}} />);
    expect(screen.getByText("Missing supplier TRN")).toBeInTheDocument();
    expect(screen.getByText("No items added")).toBeInTheDocument();
    mockValidate.mockReturnValue({ isValid: true, warnings: [] });
  });

  it("shows no items message for empty items", () => {
    const emptyPO = { ...purchaseOrder, items: [] };
    render(<PurchaseOrderPreview purchaseOrder={emptyPO} company={company} onClose={() => {}} />);
    expect(screen.getByText("No items added")).toBeInTheDocument();
  });
});
