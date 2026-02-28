import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

vi.mock("../../../services/creditNoteService", () => ({
  creditNoteService: {
    getCreditNote: vi.fn(),
    markItemsInspected: vi.fn(),
  },
}));

vi.mock("../../../services/notificationService", () => ({
  notificationService: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("../../../services/warehouseService", () => ({
  warehouseService: {
    getAll: vi.fn().mockResolvedValue({ data: [{ id: 1, name: "Main Warehouse" }] }),
  },
}));

vi.mock("lucide-react", () => ({
  ClipboardCheck: (props) => <svg {...props} />,
  Loader2: (props) => <svg {...props} />,
  Package: (props) => <svg {...props} />,
  Warehouse: (props) => <svg {...props} />,
  X: (props) => <svg {...props} />,
}));

import QCInspectionModal from "../QCInspectionModal";

const creditNote = {
  id: 1,
  items: [
    { id: 10, productName: "Steel Rod", quantityReturned: 5 },
    { id: 11, productName: "Steel Sheet", quantityReturned: 3 },
  ],
};

describe("QCInspectionModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when not open", () => {
    const { container } = render(<QCInspectionModal isOpen={false} onClose={() => {}} creditNote={creditNote} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders modal header when open", async () => {
    render(<QCInspectionModal isOpen={true} onClose={() => {}} creditNote={creditNote} />);
    expect(screen.getByText("QC Inspection")).toBeInTheDocument();
  });

  it("renders cancel and submit buttons", async () => {
    render(<QCInspectionModal isOpen={true} onClose={() => {}} creditNote={creditNote} />);
    await waitFor(() => {
      expect(screen.getByText("Cancel")).toBeInTheDocument();
      expect(screen.getByText("Complete Inspection")).toBeInTheDocument();
    });
  });

  it("calls onClose when cancel button is clicked", async () => {
    const onClose = vi.fn();
    render(<QCInspectionModal isOpen={true} onClose={onClose} creditNote={creditNote} />);
    await waitFor(() => {
      fireEvent.click(screen.getByText("Cancel"));
    });
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when close X button is clicked", async () => {
    const onClose = vi.fn();
    render(<QCInspectionModal isOpen={true} onClose={onClose} creditNote={creditNote} />);
    fireEvent.click(screen.getByLabelText("Close"));
    expect(onClose).toHaveBeenCalled();
  });

  it("displays QC result radio options after items load", async () => {
    render(<QCInspectionModal isOpen={true} onClose={() => {}} creditNote={creditNote} />);
    await waitFor(() => {
      expect(screen.getByText(/Good - All items can be restocked/)).toBeInTheDocument();
      expect(screen.getByText(/Bad - All items defective/)).toBeInTheDocument();
      expect(screen.getByText(/Partial - Some good/)).toBeInTheDocument();
    });
  });

  it("shows item names after loading", async () => {
    render(<QCInspectionModal isOpen={true} onClose={() => {}} creditNote={creditNote} />);
    await waitFor(() => {
      expect(screen.getByText("Steel Rod")).toBeInTheDocument();
      expect(screen.getByText("Steel Sheet")).toBeInTheDocument();
    });
  });
});
