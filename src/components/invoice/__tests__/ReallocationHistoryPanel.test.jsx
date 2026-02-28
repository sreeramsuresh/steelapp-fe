import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

vi.mock("../../../services/api", () => ({
  default: {
    get: vi.fn().mockResolvedValue({ history: [] }),
  },
}));

vi.mock("lucide-react", () => ({
  AlertCircle: (props) => <span data-testid="alert-circle" {...props} />,
  ChevronDown: (props) => <span data-testid="chevron-down" {...props} />,
  ChevronRight: (props) => <span data-testid="chevron-right" {...props} />,
  History: (props) => <span data-testid="history-icon" {...props} />,
  TrendingDown: (props) => <span data-testid="trending-down" {...props} />,
  TrendingUp: (props) => <span data-testid="trending-up" {...props} />,
}));

vi.mock("../../ui/badge", () => ({
  Badge: ({ children, ...props }) => <span {...props}>{children}</span>,
}));

vi.mock("../../ui/table", () => ({
  Table: ({ children }) => <table>{children}</table>,
  TableBody: ({ children }) => <tbody>{children}</tbody>,
  TableCell: ({ children, ...props }) => <td {...props}>{children}</td>,
  TableHead: ({ children, ...props }) => <th {...props}>{children}</th>,
  TableHeader: ({ children }) => <thead>{children}</thead>,
  TableRow: ({ children, ...props }) => <tr {...props}>{children}</tr>,
}));

import apiClient from "../../../services/api";
import ReallocationHistoryPanel from "../ReallocationHistoryPanel";

describe("ReallocationHistoryPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when no invoiceId or invoiceItemId", () => {
    const { container } = render(<ReallocationHistoryPanel />);
    expect(container.firstChild).toBeNull();
  });

  it("renders collapsed by default with header", () => {
    render(<ReallocationHistoryPanel invoiceId={1} />);
    expect(screen.getByText("Batch Reallocation History")).toBeTruthy();
  });

  it("does not fetch data while collapsed", () => {
    render(<ReallocationHistoryPanel invoiceId={1} />);
    expect(apiClient.get).not.toHaveBeenCalled();
  });

  it("fetches data when expanded", async () => {
    apiClient.get.mockResolvedValueOnce({ history: [] });
    render(<ReallocationHistoryPanel invoiceId={1} collapsed={false} />);
    expect(apiClient.get).toHaveBeenCalledWith("/invoices/1/reallocation-history");
  });

  it("expands on header click", async () => {
    apiClient.get.mockResolvedValueOnce({ history: [] });
    render(<ReallocationHistoryPanel invoiceId={1} />);
    fireEvent.click(screen.getByText("Batch Reallocation History"));
    expect(apiClient.get).toHaveBeenCalled();
  });

  it("shows empty message when no history", async () => {
    apiClient.get.mockResolvedValueOnce({ history: [] });
    render(<ReallocationHistoryPanel invoiceId={1} collapsed={false} />);
    expect(await screen.findByText("No reallocation history found")).toBeTruthy();
  });

  it("shows error on API failure", async () => {
    apiClient.get.mockRejectedValueOnce({
      response: { data: { message: "Server error" } },
    });
    render(<ReallocationHistoryPanel invoiceId={1} collapsed={false} />);
    expect(await screen.findByText("Server error")).toBeTruthy();
  });

  it("fetches by invoiceItemId when provided", async () => {
    apiClient.get.mockResolvedValueOnce({ history: [] });
    render(<ReallocationHistoryPanel invoiceItemId={5} collapsed={false} />);
    expect(apiClient.get).toHaveBeenCalledWith("/invoices/items/5/reallocation-history");
  });
});
