/**
 * VolumeDiscountTiersModal Component Tests
 * Phase 5.3.2: Tier 1 Critical Business Component
 *
 * Tests volume discount tier configuration modal
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import sinon from "sinon";
import { beforeEach, describe, expect, it, vi } from "vitest";
import VolumeDiscountTiersModal from "../VolumeDiscountTiersModal";

// sinon.stub() // "../../../contexts/ThemeContext", () => ({
useTheme: () => ({ isDarkMode: false }),
}))

describe("VolumeDiscountTiersModal", () =>
{
  let mockOnClose;
  let mockOnSave;

  beforeEach(() => {
    mockOnClose = sinon.stub();
    mockOnSave = sinon.stub();
    sinon.restore();
  });

  it("should not render when isOpen is false", () => {
    const { container } = render(
      <VolumeDiscountTiersModal isOpen={false} onClose={mockOnClose} tiers={[]} onSave={mockOnSave} />
    );

    expect(container.firstChild).toBeNull();
  });

  it("should render modal when isOpen is true", () => {
    render(<VolumeDiscountTiersModal isOpen={true} onClose={mockOnClose} tiers={[]} onSave={mockOnSave} />);

    expect(screen.getByText("Volume Discount Tiers")).toBeInTheDocument();
  });

  it("should display existing tiers on open", () => {
    const tiers = [
      { minQuantity: 100, discountPercentage: 5, description: "Bulk discount" },
      { minQuantity: 500, discountPercentage: 10, description: "Large order" },
    ];

    render(<VolumeDiscountTiersModal isOpen={true} onClose={mockOnClose} tiers={tiers} onSave={mockOnSave} />);

    expect(screen.getByDisplayValue("100")).toBeInTheDocument();
    expect(screen.getByDisplayValue("5")).toBeInTheDocument();
    expect(screen.getByDisplayValue("500")).toBeInTheDocument();
    expect(screen.getByDisplayValue("10")).toBeInTheDocument();
  });

  it("should add a new tier when Add button is clicked", async () => {
    const user = userEvent.setup();
    render(<VolumeDiscountTiersModal isOpen={true} onClose={mockOnClose} tiers={[]} onSave={mockOnSave} />);

    const addButton = screen.getByRole("button", { name: /Add/ });
    await user.click(addButton);

    // New tier input fields should appear
    const inputs = screen.getAllByRole("spinbutton");
    expect(inputs.length).toBeGreaterThanOrEqual(2);
  });

  it("should remove a tier when delete button is clicked", async () => {
    const user = userEvent.setup();
    const tiers = [
      { minQuantity: 100, discountPercentage: 5, description: "Tier 1" },
      { minQuantity: 500, discountPercentage: 10, description: "Tier 2" },
    ];

    render(<VolumeDiscountTiersModal isOpen={true} onClose={mockOnClose} tiers={tiers} onSave={mockOnSave} />);

    const deleteButtons = screen.getAllByRole("button", { name: /Delete/ });
    await user.click(deleteButtons[0]);

    // After delete, one tier should remain
    const remainingInputs = screen.getAllByRole("spinbutton");
    expect(remainingInputs.length).toBeLessThan(4);
  });

  it("should update tier values when inputs are changed", async () => {
    const user = userEvent.setup();
    const tiers = [{ minQuantity: 100, discountPercentage: 5, description: "Tier 1" }];

    render(<VolumeDiscountTiersModal isOpen={true} onClose={mockOnClose} tiers={tiers} onSave={mockOnSave} />);

    const quantityInput = screen.getByDisplayValue("100");
    await user.clear(quantityInput);
    await user.type(quantityInput, "200");

    expect(quantityInput).toHaveValue(200);
  });

  it("should sort tiers by minQuantity before saving", async () => {
    const user = userEvent.setup();
    const tiers = [
      { minQuantity: 500, discountPercentage: 10, description: "Large" },
      { minQuantity: 100, discountPercentage: 5, description: "Small" },
    ];

    render(<VolumeDiscountTiersModal isOpen={true} onClose={mockOnClose} tiers={tiers} onSave={mockOnSave} />);

    const saveButton = screen.getByRole("button", { name: /Save/ });
    await user.click(saveButton);

    const savedTiers = mockOnSave.mock.calls[0][0];
    expect(savedTiers[0].minQuantity).toBe(100);
    expect(savedTiers[1].minQuantity).toBe(500);
  });

  it("should filter out tiers with minQuantity of 0 when saving", async () => {
    const user = userEvent.setup();
    const tiers = [
      { minQuantity: 0, discountPercentage: 0, description: "" },
      { minQuantity: 100, discountPercentage: 5, description: "Tier 1" },
    ];

    render(<VolumeDiscountTiersModal isOpen={true} onClose={mockOnClose} tiers={tiers} onSave={mockOnSave} />);

    const saveButton = screen.getByRole("button", { name: /Save/ });
    await user.click(saveButton);

    const savedTiers = mockOnSave.mock.calls[0][0];
    expect(savedTiers.length).toBe(1);
    expect(savedTiers[0].minQuantity).toBe(100);
  });

  it("should close modal after saving", async () => {
    const user = userEvent.setup();
    const tiers = [{ minQuantity: 100, discountPercentage: 5, description: "Tier 1" }];

    render(<VolumeDiscountTiersModal isOpen={true} onClose={mockOnClose} tiers={tiers} onSave={mockOnSave} />);

    const saveButton = screen.getByRole("button", { name: /Save/ });
    await user.click(saveButton);

    expect(mockOnSave).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("should close modal when X button is clicked", async () => {
    const user = userEvent.setup();
    render(<VolumeDiscountTiersModal isOpen={true} onClose={mockOnClose} tiers={[]} onSave={mockOnSave} />);

    const closeButton = screen.getByRole("button", { name: /Close/ });
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("should display requirements section", () => {
    render(<VolumeDiscountTiersModal isOpen={true} onClose={mockOnClose} tiers={[]} onSave={mockOnSave} />);

    expect(screen.getByText(/Requirements:/)).toBeInTheDocument();
    expect(screen.getByText(/Minimum quantity must be greater than 0/)).toBeInTheDocument();
    expect(screen.getByText(/Discount percentage must be between 0 and 100/)).toBeInTheDocument();
    expect(screen.getByText(/Tiers are automatically sorted/)).toBeInTheDocument();
  });

  it("should handle multiple tiers correctly", async () => {
    const user = userEvent.setup();
    render(<VolumeDiscountTiersModal isOpen={true} onClose={mockOnClose} tiers={[]} onSave={mockOnSave} />);

    const addButton = screen.getByRole("button", { name: /Add/ });

    // Add three tiers
    await user.click(addButton);
    await user.click(addButton);
    await user.click(addButton);

    // Should have 6 spinbutton inputs (minQuantity and discountPercentage for each tier)
    const inputs = screen.getAllByRole("spinbutton");
    expect(inputs.length).toBeGreaterThanOrEqual(6);
  });

  it("should allow text input for tier description", async () => {
    const user = userEvent.setup();
    const tiers = [{ minQuantity: 100, discountPercentage: 5, description: "" }];

    render(<VolumeDiscountTiersModal isOpen={true} onClose={mockOnClose} tiers={tiers} onSave={mockOnSave} />);

    const descriptionInput = screen.getByPlaceholderText(/Optional description/);
    await user.type(descriptionInput, "Bulk purchase discount");

    expect(descriptionInput).toHaveValue("Bulk purchase discount");
  });
}
)
