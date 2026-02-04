/**
 * PriceValiditySelector Component Tests
 * Phase 5.3.2: Tier 1 Critical Business Component
 *
 * Tests price validity condition selector with custom option
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PriceValiditySelector from "../PriceValiditySelector";

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

describe("PriceValiditySelector", () => {
  let mockOnChange;

  beforeEach(() => {
    mockOnChange = vi.fn();
    vi.clearAllMocks();
  });

  it("should render price validity selector with label", () => {
    render(<PriceValiditySelector value="" onChange={mockOnChange} />);

    expect(screen.getByLabelText("Price Validity Condition")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("should render all predefined validity options", () => {
    render(<PriceValiditySelector value="" onChange={mockOnChange} />);

    expect(screen.getByText("No specific condition")).toBeInTheDocument();
    expect(screen.getByText("Subject to stock availability")).toBeInTheDocument();
    expect(screen.getByText("Subject to LME rates at time of order")).toBeInTheDocument();
    expect(screen.getByText("Valid for 7 days")).toBeInTheDocument();
    expect(screen.getByText("Valid for 14 days")).toBeInTheDocument();
    expect(screen.getByText("Valid for 30 days")).toBeInTheDocument();
    expect(screen.getByText("Custom")).toBeInTheDocument();
  });

  it("should call onChange when selection changes", async () => {
    const user = userEvent.setup();
    render(<PriceValiditySelector value="" onChange={mockOnChange} />);

    const select = screen.getByRole("combobox");
    await user.selectOption(select, "valid_7_days");

    expect(mockOnChange).toHaveBeenCalledWith("valid_7_days");
  });

  it("should display selected value", () => {
    render(<PriceValiditySelector value="valid_14_days" onChange={mockOnChange} />);

    expect(screen.getByRole("combobox")).toHaveValue("valid_14_days");
  });

  it("should show custom input field when Custom is selected", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<PriceValiditySelector value="" onChange={mockOnChange} />);

    const select = screen.getByRole("combobox");
    await user.selectOption(select, "custom");

    expect(mockOnChange).toHaveBeenCalledWith("custom");

    // Simulate selection of custom
    rerender(<PriceValiditySelector value="custom" onChange={mockOnChange} />);

    expect(screen.getByPlaceholderText("Enter custom condition")).toBeInTheDocument();
  });

  it("should hide custom input when non-custom option is selected", () => {
    const { rerender } = render(<PriceValiditySelector value="custom" onChange={mockOnChange} />);

    expect(screen.getByPlaceholderText("Enter custom condition")).toBeInTheDocument();

    rerender(<PriceValiditySelector value="valid_30_days" onChange={mockOnChange} />);

    expect(screen.queryByPlaceholderText("Enter custom condition")).not.toBeInTheDocument();
  });

  it("should handle custom condition text input", async () => {
    const user = userEvent.setup();
    render(<PriceValiditySelector value="custom" onChange={mockOnChange} />);

    const customInput = screen.getByPlaceholderText("Enter custom condition");
    await user.type(customInput, "Valid until end of quarter");

    expect(mockOnChange).toHaveBeenCalledWith("custom:Valid until end of quarter");
  });

  it("should extract and display custom condition text from value", () => {
    render(
      <PriceValiditySelector
        value="custom:Prices valid for 60 days from order"
        onChange={mockOnChange}
      />
    );

    const customInput = screen.getByPlaceholderText("Enter custom condition");
    expect(customInput).toHaveValue("Prices valid for 60 days from order");
  });

  it("should display helper text when value is set", () => {
    render(<PriceValiditySelector value="valid_7_days" onChange={mockOnChange} />);

    expect(
      screen.getByText("This condition will appear on the quotation PDF.")
    ).toBeInTheDocument();
  });

  it("should not display helper text when value is empty", () => {
    render(<PriceValiditySelector value="" onChange={mockOnChange} />);

    expect(
      screen.queryByText("This condition will appear on the quotation PDF.")
    ).not.toBeInTheDocument();
  });

  it("should handle null value gracefully", () => {
    render(<PriceValiditySelector value={null} onChange={mockOnChange} />);

    expect(screen.getByRole("combobox")).toHaveValue("");
  });

  it("should update when value prop changes", () => {
    const { rerender } = render(<PriceValiditySelector value="" onChange={mockOnChange} />);

    expect(screen.getByRole("combobox")).toHaveValue("");

    rerender(<PriceValiditySelector value="lme_rates" onChange={mockOnChange} />);

    expect(screen.getByRole("combobox")).toHaveValue("lme_rates");
  });

  it("should allow clearing selection", async () => {
    const user = userEvent.setup();
    render(<PriceValiditySelector value="valid_14_days" onChange={mockOnChange} />);

    const select = screen.getByRole("combobox");
    await user.selectOption(select, "");

    expect(mockOnChange).toHaveBeenCalledWith("");
  });

  it("should handle multiple custom condition updates", async () => {
    const user = userEvent.setup();
    render(<PriceValiditySelector value="custom:Initial text" onChange={mockOnChange} />);

    const customInput = screen.getByPlaceholderText("Enter custom condition");
    expect(customInput).toHaveValue("Initial text");

    await user.clear(customInput);
    await user.type(customInput, "Updated condition");

    expect(mockOnChange).toHaveBeenCalledWith("custom:Updated condition");
  });

  it("should display stock availability option", () => {
    render(<PriceValiditySelector value="stock_availability" onChange={mockOnChange} />);

    expect(screen.getByRole("combobox")).toHaveValue("stock_availability");
  });

  it("should handle special characters in custom condition", async () => {
    const user = userEvent.setup();
    render(<PriceValiditySelector value="custom" onChange={mockOnChange} />);

    const customInput = screen.getByPlaceholderText("Enter custom condition");
    await user.type(customInput, "Price: 50 AED/kg ± 5% (subject to market)");

    expect(mockOnChange).toHaveBeenCalledWith("custom:Price: 50 AED/kg ± 5% (subject to market)");
  });

  it("should not render custom input for predefined conditions", () => {
    const conditions = [
      "stock_availability",
      "lme_rates",
      "valid_7_days",
      "valid_14_days",
      "valid_30_days",
    ];

    conditions.forEach((condition) => {
      const { unmount } = render(
        <PriceValiditySelector value={condition} onChange={mockOnChange} />
      );

      expect(screen.queryByPlaceholderText("Enter custom condition")).not.toBeInTheDocument();
      unmount();
    });
  });
});
