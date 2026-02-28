import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

vi.mock("../../services/api", () => ({
  default: {
    get: vi.fn().mockResolvedValue({ batches: [] }),
  },
}));

vi.mock("../../services/axiosAuthService", () => ({
  authService: {
    hasPermission: vi.fn(() => true),
  },
}));

vi.mock("lucide-react", () => ({
  AlertTriangle: (props) => <span data-testid="alert-triangle" {...props} />,
  Check: (props) => <span data-testid="check-icon" {...props} />,
  Loader2: (props) => <span data-testid="loader" {...props} />,
  Package: (props) => <span data-testid="package-icon" {...props} />,
  RefreshCw: (props) => <span data-testid="refresh-icon" {...props} />,
  Ship: (props) => <span data-testid="ship-icon" {...props} />,
}));

vi.mock("../ui/badge", () => ({
  Badge: ({ children, ...props }) => <span {...props}>{children}</span>,
}));

vi.mock("../ui/button", () => ({
  Button: ({ children, onClick, ...props }) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

vi.mock("../ui/table", () => ({
  Table: ({ children }) => <table>{children}</table>,
  TableBody: ({ children }) => <tbody>{children}</tbody>,
  TableCell: ({ children, ...props }) => <td {...props}>{children}</td>,
  TableFooter: ({ children }) => <tfoot>{children}</tfoot>,
  TableHead: ({ children, ...props }) => <th {...props}>{children}</th>,
  TableHeader: ({ children }) => <thead>{children}</thead>,
  TableRow: ({ children, ...props }) => <tr {...props}>{children}</tr>,
}));

import api from "../../services/api";
import BatchPicker from "../BatchPicker";

describe("BatchPicker", () => {
  const defaultProps = {
    productId: 1,
    warehouseId: 2,
    requiredQty: 100,
    onSelectAllocations: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows no batches message when API returns empty", async () => {
    api.get.mockResolvedValueOnce({ batches: [] });
    render(<BatchPicker {...defaultProps} />);
    const msg = await screen.findByText(/No available batches found/);
    expect(msg).toBeTruthy();
  });

  it("renders batches table when data is available", async () => {
    api.get.mockResolvedValueOnce({
      batches: [
        {
          id: 1,
          batchNumber: "B-001",
          quantityAvailable: 50,
          unitCost: 10,
          procurementChannel: "LOCAL",
        },
        {
          id: 2,
          batchNumber: "B-002",
          quantityAvailable: 80,
          unitCost: 12,
          procurementChannel: "IMPORTED",
        },
      ],
    });
    render(<BatchPicker {...defaultProps} />);
    expect(await screen.findByText("B-001")).toBeTruthy();
    expect(screen.getByText("B-002")).toBeTruthy();
    expect(screen.getByText("Select Batches (Manual Allocation)")).toBeTruthy();
  });

  it("shows Auto-Fill FIFO and Clear buttons when not disabled", async () => {
    api.get.mockResolvedValueOnce({
      batches: [{ id: 1, batchNumber: "B-001", quantityAvailable: 100, unitCost: 10 }],
    });
    render(<BatchPicker {...defaultProps} />);
    expect(await screen.findByText("Auto-Fill FIFO")).toBeTruthy();
    expect(screen.getByText("Clear")).toBeTruthy();
  });

  it("hides action buttons when disabled", async () => {
    api.get.mockResolvedValueOnce({
      batches: [{ id: 1, batchNumber: "B-001", quantityAvailable: 100, unitCost: 10 }],
    });
    render(<BatchPicker {...defaultProps} disabled={true} />);
    await screen.findByText("B-001");
    expect(screen.queryByText("Auto-Fill FIFO")).toBeNull();
  });

  it("shows help text about FIFO", async () => {
    api.get.mockResolvedValueOnce({
      batches: [{ id: 1, batchNumber: "B-001", quantityAvailable: 100, unitCost: 10 }],
    });
    render(<BatchPicker {...defaultProps} />);
    expect(await screen.findByText(/Enter quantities for each batch you want to allocate/)).toBeTruthy();
  });

  it("shows error state when API fails", async () => {
    api.get.mockRejectedValueOnce({
      response: { data: { error: "Server error" } },
    });
    render(<BatchPicker {...defaultProps} />);
    expect(await screen.findByText("Server error")).toBeTruthy();
  });
});
