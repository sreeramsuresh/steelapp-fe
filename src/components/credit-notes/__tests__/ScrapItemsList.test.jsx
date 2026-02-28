import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

vi.mock("../../../services/creditNoteService", () => ({
  creditNoteService: {
    getScrapItems: vi.fn(),
    getScrapItemsByCreditNote: vi.fn(),
  },
}));

vi.mock("../../../utils/invoiceUtils", () => ({
  formatCurrency: (val) => `AED ${parseFloat(val || 0).toFixed(2)}`,
}));

vi.mock("lucide-react", () => ({
  AlertTriangle: (props) => <svg {...props} />,
  Package: (props) => <svg {...props} />,
  RefreshCw: (props) => <svg {...props} />,
  Search: (props) => <svg {...props} />,
  Trash2: (props) => <svg {...props} />,
}));

import { creditNoteService } from "../../../services/creditNoteService";
import ScrapItemsList from "../ScrapItemsList";

const mockItems = [
  { id: 1, productName: "Steel Rod", quantity: 5, scrapReason: "MANUFACTURING_DEFECT", scrapValue: 100 },
  { id: 2, productName: "Steel Sheet", quantity: 3, scrapReason: "DAMAGED_IN_TRANSIT", scrapValue: 200 },
];

describe("ScrapItemsList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state", () => {
    creditNoteService.getScrapItems.mockReturnValue(new Promise(() => {}));
    render(<ScrapItemsList />);
    expect(screen.getByText("Loading scrap items...")).toBeInTheDocument();
  });

  it("renders scrap items after loading", async () => {
    creditNoteService.getScrapItems.mockResolvedValue({ items: mockItems });
    render(<ScrapItemsList />);
    await waitFor(() => {
      expect(screen.getByText("Steel Rod")).toBeInTheDocument();
      expect(screen.getByText("Steel Sheet")).toBeInTheDocument();
    });
  });

  it("shows item count badge", async () => {
    creditNoteService.getScrapItems.mockResolvedValue({ items: mockItems });
    render(<ScrapItemsList />);
    await waitFor(() => {
      expect(screen.getByText("2")).toBeInTheDocument();
    });
  });

  it("shows empty state when no items", async () => {
    creditNoteService.getScrapItems.mockResolvedValue({ items: [] });
    render(<ScrapItemsList />);
    await waitFor(() => {
      expect(screen.getByText("No scrap items recorded")).toBeInTheDocument();
    });
  });

  it("shows error state and retry button", async () => {
    creditNoteService.getScrapItems.mockRejectedValue(new Error("Network error"));
    render(<ScrapItemsList />);
    await waitFor(() => {
      expect(screen.getByText("Failed to load scrap items")).toBeInTheDocument();
      expect(screen.getByText("Retry")).toBeInTheDocument();
    });
  });

  it("fetches by credit note ID when provided", async () => {
    creditNoteService.getScrapItemsByCreditNote.mockResolvedValue({ items: mockItems });
    render(<ScrapItemsList creditNoteId={42} />);
    await waitFor(() => {
      expect(creditNoteService.getScrapItemsByCreditNote).toHaveBeenCalledWith(42);
    });
  });

  it("filters items by search term", async () => {
    creditNoteService.getScrapItems.mockResolvedValue({ items: mockItems });
    render(<ScrapItemsList />);
    await waitFor(() => {
      expect(screen.getByText("Steel Rod")).toBeInTheDocument();
    });
    const searchInput = screen.getByPlaceholderText("Search by product, code, or reason...");
    fireEvent.change(searchInput, { target: { value: "Rod" } });
    expect(screen.getByText("Steel Rod")).toBeInTheDocument();
    expect(screen.queryByText("Steel Sheet")).not.toBeInTheDocument();
  });

  it("displays scrap reason labels", async () => {
    creditNoteService.getScrapItems.mockResolvedValue({ items: mockItems });
    render(<ScrapItemsList />);
    await waitFor(() => {
      expect(screen.getByText("Manufacturing Defect")).toBeInTheDocument();
      expect(screen.getByText("Damaged in Transit")).toBeInTheDocument();
    });
  });
});
