/**
 * LeadTimeInput Component Tests
 * Phase 5.3.2: Tier 1 Critical Business Component
 *
 * Tests lead time input field for quotation items with procurement
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LeadTimeInput from "../LeadTimeInput";

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

describe("LeadTimeInput", () => {
  let mockOnUpdate;

  beforeEach(() => {
    mockOnUpdate = vi.fn();
    vi.clearAllMocks();
  });

  it("should render lead time input when sourceType is TO_BE_PROCURED", () => {
    const item = {
      sourceType: "TO_BE_PROCURED",
      productId: "prod-1",
      estimatedLeadTimeDays: 5,
    };

    render(<LeadTimeInput item={item} index={0} onUpdate={mockOnUpdate} />);

    expect(screen.getByLabelText(/Lead time in days/)).toBeInTheDocument();
    expect(screen.getByDisplayValue("5")).toBeInTheDocument();
  });

  it("should render lead time input when productId is missing", () => {
    const item = {
      sourceType: "WAREHOUSE_STOCK",
      productId: null,
      estimatedLeadTimeDays: 3,
    };

    render(<LeadTimeInput item={item} index={0} onUpdate={mockOnUpdate} />);

    expect(screen.getByLabelText(/Lead time in days/)).toBeInTheDocument();
  });

  it("should not render when sourceType is not TO_BE_PROCURED and productId exists", () => {
    const item = {
      sourceType: "WAREHOUSE_STOCK",
      productId: "prod-1",
      estimatedLeadTimeDays: 2,
    };

    const { container } = render(<LeadTimeInput item={item} index={0} onUpdate={mockOnUpdate} />);

    expect(container.firstChild).toBeNull();
  });

  it("should handle input change and call onUpdate with integer value", async () => {
    const user = userEvent.setup();
    const item = {
      sourceType: "TO_BE_PROCURED",
      productId: null,
      estimatedLeadTimeDays: null,
    };

    render(<LeadTimeInput item={item} index={0} onUpdate={mockOnUpdate} />);

    const input = screen.getByLabelText(/Lead time in days/);
    await user.clear(input);
    await user.type(input, "10");

    expect(mockOnUpdate).toHaveBeenCalledWith(0, "estimatedLeadTimeDays", 10);
  });

  it("should call onUpdate with null when input is empty", async () => {
    const user = userEvent.setup();
    const item = {
      sourceType: "TO_BE_PROCURED",
      productId: null,
      estimatedLeadTimeDays: 5,
    };

    render(<LeadTimeInput item={item} index={0} onUpdate={mockOnUpdate} />);

    const input = screen.getByLabelText(/Lead time in days/);
    await user.clear(input);

    expect(mockOnUpdate).toHaveBeenCalledWith(0, "estimatedLeadTimeDays", null);
  });

  it("should handle zero as valid lead time", async () => {
    const _user = userEvent.setup();
    const item = {
      sourceType: "TO_BE_PROCURED",
      productId: null,
      estimatedLeadTimeDays: 0,
    };

    render(<LeadTimeInput item={item} index={0} onUpdate={mockOnUpdate} />);

    const input = screen.getByLabelText(/Lead time in days/);
    expect(input).toHaveValue(0);
  });

  it("should display correct index in aria-label", () => {
    const item = {
      sourceType: "TO_BE_PROCURED",
      productId: null,
      estimatedLeadTimeDays: 2,
    };

    render(<LeadTimeInput item={item} index={3} onUpdate={mockOnUpdate} />);

    expect(screen.getByLabelText(/for item 4/)).toBeInTheDocument();
  });

  it("should ignore non-numeric input and treat as null", async () => {
    const user = userEvent.setup();
    const item = {
      sourceType: "TO_BE_PROCURED",
      productId: null,
      estimatedLeadTimeDays: null,
    };

    render(<LeadTimeInput item={item} index={0} onUpdate={mockOnUpdate} />);

    const input = screen.getByLabelText(/Lead time in days/);
    await user.type(input, "abc");

    expect(mockOnUpdate).toHaveBeenCalledWith(0, "estimatedLeadTimeDays", null);
  });

  it("should display helper text about procurement duration", () => {
    const item = {
      sourceType: "TO_BE_PROCURED",
      productId: null,
      estimatedLeadTimeDays: 5,
    };

    render(<LeadTimeInput item={item} index={0} onUpdate={mockOnUpdate} />);

    expect(screen.getByText(/Expected days for supplier to deliver/)).toBeInTheDocument();
  });

  it("should respect minimum value of 0", async () => {
    const _user = userEvent.setup();
    const item = {
      sourceType: "TO_BE_PROCURED",
      productId: null,
      estimatedLeadTimeDays: null,
    };

    render(<LeadTimeInput item={item} index={0} onUpdate={mockOnUpdate} />);

    const input = screen.getByLabelAttribute(/Lead time in days/);
    expect(input).toHaveAttribute("min", "0");
  });

  it("should update when props change", () => {
    const item1 = {
      sourceType: "TO_BE_PROCURED",
      productId: null,
      estimatedLeadTimeDays: 5,
    };

    const { rerender } = render(<LeadTimeInput item={item1} index={0} onUpdate={mockOnUpdate} />);

    expect(screen.getByDisplayValue("5")).toBeInTheDocument();

    const item2 = {
      sourceType: "TO_BE_PROCURED",
      productId: null,
      estimatedLeadTimeDays: 10,
    };

    rerender(<LeadTimeInput item={item2} index={0} onUpdate={mockOnUpdate} />);

    expect(screen.getByDisplayValue("10")).toBeInTheDocument();
  });
});
