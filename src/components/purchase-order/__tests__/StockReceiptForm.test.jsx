import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

const poItems = [
  { id: 10, productId: 101, productName: "Steel Rod", quantity: 100, receivedQuantity: 0, unit: "KG" },
  { id: 11, productId: 102, productName: "Steel Sheet", quantity: 50, receivedQuantity: 20, unit: "KG" },
];

describe("StockReceiptForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when not open", () => {
    const { container } = render(
      <StockReceiptForm open={false} onClose={() => {}} purchaseOrderId={1} poNumber="PO-2025-001" poItems={poItems} />
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders modal header when open", () => {
    render(
      <StockReceiptForm open={true} onClose={() => {}} purchaseOrderId={1} poNumber="PO-2025-001" poItems={poItems} />
    );
    expect(screen.getByText(/Receive Stock/i)).toBeInTheDocument();
  });

  it("renders PO number in header", () => {
    render(
      <StockReceiptForm open={true} onClose={() => {}} purchaseOrderId={1} poNumber="PO-2025-001" poItems={poItems} />
    );
    expect(screen.getByText(/PO-2025-001/)).toBeInTheDocument();
  });

  it("displays product names for PO items", () => {
    render(
      <StockReceiptForm open={true} onClose={() => {}} purchaseOrderId={1} poNumber="PO-2025-001" poItems={poItems} />
    );
    expect(screen.getByText("Steel Rod")).toBeInTheDocument();
    expect(screen.getByText("Steel Sheet")).toBeInTheDocument();
  });
});
