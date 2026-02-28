import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../services/creditNoteService", () => ({
  creditNoteService: {
    getAllowedTransitions: vi.fn(),
    issueCreditNote: vi.fn(),
    markItemsReceived: vi.fn(),
    applyCreditNote: vi.fn(),
    completeCreditNote: vi.fn(),
    cancelCreditNote: vi.fn(),
  },
}));

vi.mock("../../../services/notificationService", () => ({
  notificationService: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("../../ConfirmDialog", () => ({
  default: ({ title, onConfirm, onCancel }) => (
    <div data-testid="confirm-dialog">
      <p>{title}</p>
      <button type="button" onClick={onConfirm}>
        Confirm
      </button>
      <button type="button" onClick={onCancel}>
        Cancel
      </button>
    </div>
  ),
}));

vi.mock("lucide-react", () => ({
  Banknote: (props) => <svg {...props} />,
  CheckCircle: (props) => <svg {...props} />,
  ClipboardCheck: (props) => <svg {...props} />,
  CreditCard: (props) => <svg {...props} />,
  Loader2: (props) => <svg {...props} />,
  Package: (props) => <svg {...props} />,
  Send: (props) => <svg {...props} />,
  XCircle: (props) => <svg {...props} />,
}));

import { creditNoteService } from "../../../services/creditNoteService";
import CreditNoteStatusActions from "../CreditNoteStatusActions";

describe("CreditNoteStatusActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state initially", () => {
    creditNoteService.getAllowedTransitions.mockReturnValue(new Promise(() => {}));
    render(<CreditNoteStatusActions creditNoteId={1} />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders nothing when no transitions are allowed", async () => {
    creditNoteService.getAllowedTransitions.mockResolvedValue({ allowed_transitions: [] });
    const { container } = render(<CreditNoteStatusActions creditNoteId={1} />);
    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });
    expect(container.textContent).toBe("");
  });

  it("renders action buttons for allowed transitions", async () => {
    creditNoteService.getAllowedTransitions.mockResolvedValue({
      allowed_transitions: ["issued", "cancelled"],
    });
    render(<CreditNoteStatusActions creditNoteId={1} />);
    await waitFor(() => {
      expect(screen.getByText("Issue")).toBeInTheDocument();
      expect(screen.getByText("Cancel")).toBeInTheDocument();
    });
  });

  it("renders compact buttons when compact is true", async () => {
    creditNoteService.getAllowedTransitions.mockResolvedValue({
      allowed_transitions: ["issued"],
    });
    render(<CreditNoteStatusActions creditNoteId={1} compact />);
    await waitFor(() => {
      expect(screen.getByText("Issue")).toBeInTheDocument();
    });
  });

  it("does not fetch transitions when creditNoteId is falsy", () => {
    render(<CreditNoteStatusActions creditNoteId={null} />);
    expect(creditNoteService.getAllowedTransitions).not.toHaveBeenCalled();
  });

  it("handles API error gracefully", async () => {
    creditNoteService.getAllowedTransitions.mockRejectedValue(new Error("Network error"));
    const { container } = render(<CreditNoteStatusActions creditNoteId={1} />);
    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });
    // Should render nothing on error
    expect(container.textContent).toBe("");
  });
});
