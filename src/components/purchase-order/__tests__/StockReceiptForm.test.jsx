import { render, screen } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

vi.mock("../../../contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: 1, name: "Test User" } }),
}));

vi.mock("../../../services/stockMovementService", () => ({
  stockMovementService: {
    receiveStock: vi.fn(),
  },
}));

vi.mock("../../../services/warehouseService", () => ({
  warehouseService: {
    getAll: vi.fn().mockResolvedValue({ data: [{ id: 1, name: "Main Warehouse" }] }),
  },
}));

vi.mock("../../../utils/inventorySyncUtils", () => ({
  clearInventoryCache: vi.fn(),
}));

vi.mock("lucide-react", () => ({
  AlertCircle: (props) => <svg {...props} />,
  AlertTriangle: (props) => <svg {...props} />,
  CheckCircle: (props) => <svg {...props} />,
  ChevronDown: (props) => <svg {...props} />,
  FileText: (props) => <svg {...props} />,
  Package: (props) => <svg {...props} />,
  Shield: (props) => <svg {...props} />,
  Truck: (props) => <svg {...props} />,
  Warehouse: (props) => <svg {...props} />,
  X: (props) => <svg {...props} />,
}));

import StockReceiptForm from "../StockReceiptForm";

const purchaseOrder = {
  id: 1,
  poNumber: "PO-2025-001",
  items: [
    { id: 10, productName: "Steel Rod", quantity: 100, receivedQuantity: 0, unit: "KG" },
    { id: 11, productName: "Steel Sheet", quantity: 50, receivedQuantity: 20, unit: "KG" },
  ],
};

describe("StockReceiptForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when not open", () => {
    const { container } = render(
      <StockReceiptForm isOpen={false} onClose={() => {}} purchaseOrder={purchaseOrder} />
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders modal header when open", () => {
    render(
      <StockReceiptForm isOpen={true} onClose={() => {}} purchaseOrder={purchaseOrder} />
    );
    expect(screen.getByText(/Receive Stock/i)).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    const onClose = vi.fn();
    render(
      <StockReceiptForm isOpen={true} onClose={onClose} purchaseOrder={purchaseOrder} />
    );
    // Find the X close button
    const closeBtn = screen.getByLabelText(/close/i);
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalled();
  });

  it("renders PO number in header", () => {
    render(
      <StockReceiptForm isOpen={true} onClose={() => {}} purchaseOrder={purchaseOrder} />
    );
    expect(screen.getByText("PO-2025-001")).toBeInTheDocument();
  });

  it("displays product names for PO items", () => {
    render(
      <StockReceiptForm isOpen={true} onClose={() => {}} purchaseOrder={purchaseOrder} />
    );
    expect(screen.getByText("Steel Rod")).toBeInTheDocument();
    expect(screen.getByText("Steel Sheet")).toBeInTheDocument();
  });
});
