import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

vi.mock("lucide-react", () => ({
  Plus: (props) => <span data-testid="plus-icon" {...props} />,
  Trash2: (props) => <span data-testid="trash-icon" {...props} />,
  X: (props) => <span data-testid="x-icon" {...props} />,
}));

import VolumeDiscountTiersModal from "../VolumeDiscountTiersModal";

describe("VolumeDiscountTiersModal", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    tiers: [],
    onSave: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns null when not open", () => {
    const { container } = render(<VolumeDiscountTiersModal {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it("renders modal header", () => {
    render(<VolumeDiscountTiersModal {...defaultProps} />);
    expect(screen.getByText("Volume Discount Tiers")).toBeTruthy();
  });

  it("shows description text", () => {
    render(<VolumeDiscountTiersModal {...defaultProps} />);
    expect(screen.getByText(/Define pricing breaks based on order quantity/)).toBeTruthy();
  });

  it("shows requirements section", () => {
    render(<VolumeDiscountTiersModal {...defaultProps} />);
    expect(screen.getByText("Requirements:")).toBeTruthy();
  });

  it("shows Add Tier button", () => {
    render(<VolumeDiscountTiersModal {...defaultProps} />);
    expect(screen.getByText("Add Tier")).toBeTruthy();
  });

  it("adds a tier when Add Tier is clicked", () => {
    render(<VolumeDiscountTiersModal {...defaultProps} />);
    fireEvent.click(screen.getByText("Add Tier"));
    expect(screen.getByText("Min Quantity (pcs)")).toBeTruthy();
    expect(screen.getByText("Discount %")).toBeTruthy();
  });

  it("shows Save Tiers and Cancel buttons", () => {
    render(<VolumeDiscountTiersModal {...defaultProps} />);
    expect(screen.getByText("Save Tiers")).toBeTruthy();
    expect(screen.getByText("Cancel")).toBeTruthy();
  });

  it("calls onClose when Cancel is clicked", () => {
    render(<VolumeDiscountTiersModal {...defaultProps} />);
    fireEvent.click(screen.getByText("Cancel"));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("calls onSave with sorted tiers when Save is clicked", () => {
    render(
      <VolumeDiscountTiersModal
        {...defaultProps}
        tiers={[
          { minQuantity: 100, discountPercentage: 5, description: "Bulk" },
          { minQuantity: 50, discountPercentage: 3, description: "Medium" },
        ]}
      />
    );
    fireEvent.click(screen.getByText("Save Tiers"));
    expect(defaultProps.onSave).toHaveBeenCalled();
    const savedTiers = defaultProps.onSave.mock.calls[0][0];
    // Should be sorted by minQuantity ascending
    expect(savedTiers[0].minQuantity).toBeLessThanOrEqual(savedTiers[1].minQuantity);
  });

  it("renders existing tiers", () => {
    render(
      <VolumeDiscountTiersModal
        {...defaultProps}
        tiers={[{ minQuantity: 100, discountPercentage: 5, description: "Bulk" }]}
      />
    );
    expect(screen.getByDisplayValue("100")).toBeTruthy();
    expect(screen.getByDisplayValue("5")).toBeTruthy();
    expect(screen.getByDisplayValue("Bulk")).toBeTruthy();
  });
});
