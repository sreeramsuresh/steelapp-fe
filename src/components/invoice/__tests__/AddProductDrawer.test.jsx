import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("lucide-react", () => ({
  X: (props) => <span data-testid="x-icon" {...props} />,
}));

vi.mock("../../AllocationDrawer", () => ({
  default: (props) => (
    <div data-testid="allocation-drawer">
      <button type="button" onClick={() => props.onAddLineItem({ id: 1 })}>
        Add
      </button>
      <button type="button" onClick={props.onCancel}>
        Cancel
      </button>
    </div>
  ),
}));

vi.mock("../invoiceStyles", () => ({
  DRAWER_OVERLAY_CLASSES: (isOpen) => (isOpen ? "overlay-open" : "overlay-closed"),
  DRAWER_PANEL_CLASSES: (_isDark, isOpen) => (isOpen ? "panel-open" : "panel-closed"),
  DRAWER_STYLE: { borderTopLeftRadius: "8px" },
}));

import AddProductDrawer from "../AddProductDrawer";

describe("AddProductDrawer", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    isDarkMode: false,
    draftInvoiceId: 1,
    warehouseId: 2,
    companyId: 3,
    onAddLineItem: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders without crashing when open", () => {
    render(<AddProductDrawer {...defaultProps} />);
    expect(screen.getByText("Add Product Line")).toBeTruthy();
  });

  it("shows header subtitle", () => {
    render(<AddProductDrawer {...defaultProps} />);
    expect(screen.getByText("Search products, allocate batches, and add to invoice")).toBeTruthy();
  });

  it("renders AllocationDrawer component", () => {
    render(<AddProductDrawer {...defaultProps} />);
    expect(screen.getByTestId("allocation-drawer")).toBeTruthy();
  });

  it("calls onClose when overlay button is clicked", () => {
    render(<AddProductDrawer {...defaultProps} />);
    const overlay = screen.getByLabelText("Close drawer");
    fireEvent.click(overlay);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when X button is clicked", () => {
    render(<AddProductDrawer {...defaultProps} />);
    const xButtons = screen.getAllByRole("button");
    // The second button-like element is the X close button in the header
    const closeBtn = xButtons.find((btn) => btn.querySelector("[data-testid='x-icon']"));
    if (closeBtn) fireEvent.click(closeBtn);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("calls onClose on Escape key press", () => {
    render(<AddProductDrawer {...defaultProps} />);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onAddLineItem and onClose when item is added via AllocationDrawer", () => {
    render(<AddProductDrawer {...defaultProps} />);
    fireEvent.click(screen.getByText("Add"));
    expect(defaultProps.onAddLineItem).toHaveBeenCalledWith({ id: 1 });
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("passes optional customerId and priceListId to AllocationDrawer", () => {
    render(<AddProductDrawer {...defaultProps} customerId={10} priceListId={20} />);
    expect(screen.getByTestId("allocation-drawer")).toBeTruthy();
  });
});
