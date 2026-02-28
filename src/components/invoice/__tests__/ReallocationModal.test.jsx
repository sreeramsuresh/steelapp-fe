import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

vi.mock("../../../services/api", () => ({
  default: {
    get: vi.fn().mockResolvedValue({ batches: [] }),
    post: vi.fn().mockResolvedValue({ success: true, newAllocations: [] }),
  },
}));

vi.mock("lucide-react", () => ({
  AlertTriangle: (props) => <span data-testid="alert-triangle" {...props} />,
  ArrowRight: (props) => <span data-testid="arrow-right" {...props} />,
  Loader2: (props) => <span data-testid="loader" {...props} />,
  Package: (props) => <span data-testid="package" {...props} />,
  Ship: (props) => <span data-testid="ship" {...props} />,
  X: (props) => <span data-testid="x-icon" {...props} />,
}));

vi.mock("../../ui/badge", () => ({
  Badge: ({ children, ...props }) => <span {...props}>{children}</span>,
}));

vi.mock("../../ui/button", () => ({
  Button: ({ children, onClick, disabled, ...props }) => (
    <button onClick={onClick} disabled={disabled} {...props}>
      {children}
    </button>
  ),
}));

vi.mock("../../ui/table", () => ({
  Table: ({ children }) => <table>{children}</table>,
  TableBody: ({ children }) => <tbody>{children}</tbody>,
  TableCell: ({ children, ...props }) => <td {...props}>{children}</td>,
  TableHead: ({ children, ...props }) => <th {...props}>{children}</th>,
  TableHeader: ({ children }) => <thead>{children}</thead>,
  TableRow: ({ children, ...props }) => <tr {...props}>{children}</tr>,
}));

import ReallocationModal from "../ReallocationModal";

describe("ReallocationModal", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    invoiceItemId: 1,
    productId: 2,
    warehouseId: 3,
    currentAllocations: [],
    requiredQty: 100,
    onReallocationComplete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when not open", () => {
    const { container } = render(<ReallocationModal {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders modal header when open", () => {
    render(<ReallocationModal {...defaultProps} />);
    expect(screen.getByText("Reallocate Batches")).toBeTruthy();
  });

  it("shows reason code dropdown", () => {
    render(<ReallocationModal {...defaultProps} />);
    expect(screen.getByText("Select a reason...")).toBeTruthy();
    expect(screen.getByText("Reason for Reallocation")).toBeTruthy();
  });

  it("shows Auto-Fill FIFO button", () => {
    render(<ReallocationModal {...defaultProps} />);
    expect(screen.getByText("Auto-Fill FIFO")).toBeTruthy();
  });

  it("shows Cancel and Apply Changes buttons", () => {
    render(<ReallocationModal {...defaultProps} />);
    expect(screen.getByText("Cancel")).toBeTruthy();
    expect(screen.getByText("Apply Changes")).toBeTruthy();
  });

  it("shows reallocation guidance text", () => {
    render(<ReallocationModal {...defaultProps} />);
    expect(screen.getByText("About Reallocation:")).toBeTruthy();
  });

  it("displays reason code options", () => {
    render(<ReallocationModal {...defaultProps} />);
    expect(screen.getByText(/Customer Request/)).toBeTruthy();
    expect(screen.getByText(/Quality Issue/)).toBeTruthy();
    expect(screen.getByText(/Entry Error/)).toBeTruthy();
  });
});
