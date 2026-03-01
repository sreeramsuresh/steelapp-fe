import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

vi.mock("../../../services/axiosAuthService", () => ({
  authService: {
    getUserRole: vi.fn(() => "admin"),
  },
}));

vi.mock("lucide-react", () => ({
  AlertTriangle: (props) => <span data-testid="alert-triangle" {...props} />,
  CheckCircle: (props) => <span data-testid="check-circle" {...props} />,
  Lock: (props) => <span data-testid="lock-icon" {...props} />,
  Package: (props) => <span data-testid="package-icon" {...props} />,
  RefreshCw: (props) => <span data-testid="refresh-icon" {...props} />,
  Ship: (props) => <span data-testid="ship-icon" {...props} />,
  Unlock: (props) => <span data-testid="unlock-icon" {...props} />,
}));

vi.mock("../../ui/badge", () => ({
  Badge: ({ children, ...props }) => <span {...props}>{children}</span>,
}));

vi.mock("../../ui/button", () => ({
  Button: ({ children, ...props }) => <button {...props}>{children}</button>,
}));

vi.mock("../../ui/table", () => ({
  Table: ({ children }) => <table>{children}</table>,
  TableBody: ({ children }) => <tbody>{children}</tbody>,
  TableCell: ({ children, ...props }) => <td {...props}>{children}</td>,
  TableFooter: ({ children }) => <tfoot>{children}</tfoot>,
  TableHead: ({ children, ...props }) => <th {...props}>{children}</th>,
  TableHeader: ({ children }) => <thead>{children}</thead>,
  TableRow: ({ children, ...props }) => <tr {...props}>{children}</tr>,
}));

vi.mock("./ReallocationModal", () => ({
  default: () => <div data-testid="reallocation-modal" />,
}));

import AllocationPanel from "../AllocationPanel";

describe("AllocationPanel", () => {
  const baseProps = {
    productId: 1,
    warehouseId: 2,
    requiredQty: 100,
    allocations: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null for new invoice with no allocations", () => {
    const { container } = render(<AllocationPanel {...baseProps} isNewInvoice={true} />);
    expect(container.firstChild).toBeNull();
  });

  it("shows empty message for existing invoice with no allocations", () => {
    render(<AllocationPanel {...baseProps} isNewInvoice={false} />);
    expect(screen.getByText("No batch allocations found. Contact warehouse team if this is unexpected.")).toBeTruthy();
  });

  it("renders allocation table with data", () => {
    const allocations = [
      {
        batchId: 1,
        batchNumber: "B-001",
        quantity: 60,
        unitCost: 10,
        procurementChannel: "LOCAL",
        availableQty: 100,
      },
      {
        batchId: 2,
        batchNumber: "B-002",
        quantity: 40,
        unitCost: 12,
        procurementChannel: "IMPORTED",
        availableQty: 50,
      },
    ];
    render(<AllocationPanel {...baseProps} allocations={allocations} />);
    expect(screen.getByText("Batch Allocations (FIFO)")).toBeTruthy();
    expect(screen.getByText("B-001")).toBeTruthy();
    expect(screen.getByText("B-002")).toBeTruthy();
  });

  it("shows Fully Allocated when total matches required", () => {
    const allocations = [{ batchId: 1, batchNumber: "B-001", quantity: 100, unitCost: 10 }];
    render(<AllocationPanel {...baseProps} allocations={allocations} />);
    expect(screen.getByText("Fully Allocated")).toBeTruthy();
  });

  it("shows shortfall warning when allocation is insufficient", () => {
    const allocations = [{ batchId: 1, batchNumber: "B-001", quantity: 60, unitCost: 10 }];
    render(<AllocationPanel {...baseProps} allocations={allocations} />);
    expect(screen.getByText("Insufficient Stock")).toBeTruthy();
  });

  it("shows lock banner when isLocked is true", () => {
    const allocations = [{ batchId: 1, batchNumber: "B-001", quantity: 100, unitCost: 10 }];
    render(<AllocationPanel {...baseProps} allocations={allocations} isLocked={true} deliveryNoteNumber="DN-001" />);
    expect(screen.getByText("DN-001")).toBeTruthy();
  });

  it("shows FIFO info note", () => {
    const allocations = [{ batchId: 1, batchNumber: "B-001", quantity: 100, unitCost: 10 }];
    render(<AllocationPanel {...baseProps} allocations={allocations} />);
    expect(screen.getByText(/Allocations are computed automatically using FIFO/)).toBeTruthy();
  });
});
