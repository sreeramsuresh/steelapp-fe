import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("lucide-react", () => ({
  X: (props) => <span data-testid="x-icon" {...props} />,
}));

vi.mock("../invoiceStyles", () => ({
  DRAWER_OVERLAY_CLASSES: (isOpen) => (isOpen ? "overlay-open" : "overlay-closed"),
  DRAWER_PANEL_CLASSES: (_isDark, isOpen) => (isOpen ? "panel-open" : "panel-closed"),
}));

import NotesDrawer from "../NotesDrawer";

describe("NotesDrawer", () => {
  const MockTextarea = ({ value, onChange, placeholder, ...props }) => (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      data-testid={`textarea-${placeholder?.substring(0, 10)}`}
      {...props}
    />
  );

  const MockVatHelpIcon = ({ content: _content }) => <span data-testid="vat-help-icon">help</span>;

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    isDarkMode: false,
    invoice: { notes: "", taxNotes: "", terms: "" },
    setInvoice: vi.fn(),
    Textarea: MockTextarea,
    VatHelpIcon: MockVatHelpIcon,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders without crashing when open", () => {
    render(<NotesDrawer {...defaultProps} />);
    expect(screen.getByText("Notes & Terms")).toBeTruthy();
  });

  it("shows subtitle text", () => {
    render(<NotesDrawer {...defaultProps} />);
    expect(screen.getByText("Add invoice notes, VAT notes, and payment terms")).toBeTruthy();
  });

  it("renders Invoice Notes section", () => {
    render(<NotesDrawer {...defaultProps} />);
    expect(screen.getByText("Invoice Notes")).toBeTruthy();
  });

  it("renders VAT Tax Notes section", () => {
    render(<NotesDrawer {...defaultProps} />);
    expect(screen.getByText("VAT Tax Notes")).toBeTruthy();
  });

  it("renders Payment Terms section", () => {
    render(<NotesDrawer {...defaultProps} />);
    expect(screen.getByText("Payment Terms & Conditions")).toBeTruthy();
  });

  it("calls onClose when Close button is clicked", () => {
    render(<NotesDrawer {...defaultProps} />);
    fireEvent.click(screen.getByText("Close"));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("calls onClose on Escape key", () => {
    render(<NotesDrawer {...defaultProps} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("calls onClose when overlay is clicked", () => {
    render(<NotesDrawer {...defaultProps} />);
    fireEvent.click(screen.getByLabelText("Close drawer"));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
