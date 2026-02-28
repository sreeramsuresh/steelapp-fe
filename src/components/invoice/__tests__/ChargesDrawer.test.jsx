import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("lucide-react", () => ({
  X: (props) => <span data-testid="x-icon" {...props} />,
}));

vi.mock("@/components/ui/form-select", () => ({
  FormSelect: ({ children, label, ...props }) => (
    <div>
      <label>{label}</label>
      <select value={props.value} onChange={(e) => props.onValueChange(e.target.value)}>
        {children}
      </select>
    </div>
  ),
}));

vi.mock("@/components/ui/select", () => ({
  SelectItem: ({ children, value }) => <option value={value}>{children}</option>,
}));

vi.mock("../invoiceStyles", () => ({
  DRAWER_OVERLAY_CLASSES: (isOpen) => (isOpen ? "overlay-open" : "overlay-closed"),
  DRAWER_PANEL_CLASSES: (isDark, isOpen) => (isOpen ? "panel-open" : "panel-closed"),
}));

import ChargesDrawer from "../ChargesDrawer";

describe("ChargesDrawer", () => {
  const MockInput = ({ label, ...props }) => (
    <div>
      <label>{label}</label>
      <input {...props} />
    </div>
  );

  const MockVatHelpIcon = ({ heading }) => <span data-testid="vat-help-icon">{heading}</span>;

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    isDarkMode: false,
    invoice: {
      discountType: "amount",
      discountAmount: "",
      discountPercentage: "",
    },
    setInvoice: vi.fn(),
    formatCurrency: (v) => `AED ${v}`,
    computedSubtotal: 1000,
    showFreightCharges: false,
    setShowFreightCharges: vi.fn(),
    Input: MockInput,
    VatHelpIcon: MockVatHelpIcon,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders without crashing when open", () => {
    render(<ChargesDrawer {...defaultProps} />);
    expect(screen.getByText("Charges & Discount")).toBeTruthy();
  });

  it("shows discount section", () => {
    render(<ChargesDrawer {...defaultProps} />);
    expect(screen.getByText("Discount")).toBeTruthy();
  });

  it("shows Discount Applied summary", () => {
    render(<ChargesDrawer {...defaultProps} />);
    expect(screen.getByText("Discount Applied")).toBeTruthy();
  });

  it("shows Freight & Loading Charges section", () => {
    render(<ChargesDrawer {...defaultProps} />);
    expect(screen.getByText(/Freight & Loading Charges/)).toBeTruthy();
  });

  it("toggles freight charges visibility", () => {
    render(<ChargesDrawer {...defaultProps} />);
    const toggleBtn = screen.getByText("OFF");
    fireEvent.click(toggleBtn);
    expect(defaultProps.setShowFreightCharges).toHaveBeenCalledWith(true);
  });

  it("shows freight charge fields when showFreightCharges is true", () => {
    render(<ChargesDrawer {...defaultProps} showFreightCharges={true} />);
    expect(screen.getByText("Packing")).toBeTruthy();
    expect(screen.getByText("Freight")).toBeTruthy();
    expect(screen.getByText("Insurance")).toBeTruthy();
    expect(screen.getByText("Loading")).toBeTruthy();
    expect(screen.getByText("Other Charges")).toBeTruthy();
  });

  it("calls onClose when Close button is clicked", () => {
    render(<ChargesDrawer {...defaultProps} />);
    fireEvent.click(screen.getByText("Close"));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("calls onClose on Escape key", () => {
    render(<ChargesDrawer {...defaultProps} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
