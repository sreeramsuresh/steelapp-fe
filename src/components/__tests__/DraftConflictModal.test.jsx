/**
 * DraftConflictModal Component Tests
 */
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/component-setup";

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: "/" }),
}));

vi.mock("../../hooks/useCreditNoteDrafts", () => ({
  getDraftStatusMessage: vi.fn().mockReturnValue("Draft saved 5 minutes ago"),
}));

vi.mock("../../utils/invoiceUtils", () => ({
  formatCurrency: (val) => `$${val}`,
}));

import DraftConflictModal from "../DraftConflictModal";

describe("DraftConflictModal", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    conflict: {
      type: "same_invoice",
      existingDraft: {
        invoiceId: 1,
        invoiceNumber: "INV-001",
        customerName: "Test Customer",
        data: { totalCredit: 500 },
      },
      allDrafts: [],
    },
    onResume: vi.fn(),
    onDiscard: vi.fn(),
    onStartFresh: vi.fn(),
    isLoading: false,
    isDarkMode: false,
  };

  it("renders without crashing when open", () => {
    const { container } = renderWithProviders(<DraftConflictModal {...defaultProps} />);
    expect(container).toBeTruthy();
  });

  it("returns null when not open", () => {
    const { container } = renderWithProviders(<DraftConflictModal {...defaultProps} isOpen={false} />);
    expect(container.querySelector(".fixed")).toBeFalsy();
  });

  it("displays Resume Draft title for same invoice", () => {
    const { container } = renderWithProviders(<DraftConflictModal {...defaultProps} />);
    expect(container.textContent).toContain("Resume Draft?");
  });

  it("displays Existing Draft Found for different invoice", () => {
    const props = {
      ...defaultProps,
      conflict: { ...defaultProps.conflict, type: "different_invoice" },
    };
    const { container } = renderWithProviders(<DraftConflictModal {...props} />);
    expect(container.textContent).toContain("Existing Draft Found");
  });

  it("shows resume and discard buttons", () => {
    const { container } = renderWithProviders(<DraftConflictModal {...defaultProps} />);
    expect(container.textContent).toContain("Resume Draft");
    expect(container.textContent).toContain("Discard");
  });
});
