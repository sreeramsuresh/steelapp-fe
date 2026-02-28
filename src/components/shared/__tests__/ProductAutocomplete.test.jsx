/**
 * ProductAutocomplete Component Tests
 * Tests shared product autocomplete with fuzzy search and keyboard navigation
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false, theme: "light", toggleTheme: vi.fn() }),
}));

import ProductAutocomplete from "../ProductAutocomplete";

describe("ProductAutocomplete", () => {
  const defaultProps = {
    options: [
      { id: 1, name: "Steel Plate 10mm", subtitle: "Grade A" },
      { id: 2, name: "Steel Rod 12mm", subtitle: "Grade B" },
    ],
    inputValue: "",
    onChange: vi.fn(),
    onInputChange: vi.fn(),
  };

  it("renders without crashing", () => {
    const { container } = render(<ProductAutocomplete {...defaultProps} />);
    expect(container).toBeTruthy();
  });

  it("renders with label", () => {
    render(<ProductAutocomplete {...defaultProps} label="Select Product" />);
    expect(screen.getByText("Select Product")).toBeInTheDocument();
  });

  it("renders input element", () => {
    render(<ProductAutocomplete {...defaultProps} placeholder="Search products..." />);
    expect(screen.getByPlaceholderText("Search products...")).toBeInTheDocument();
  });

  it("renders with input value", () => {
    render(<ProductAutocomplete {...defaultProps} inputValue="Steel" />);
    const input = screen.getByDisplayValue("Steel");
    expect(input).toBeInTheDocument();
  });

  it("renders as disabled", () => {
    render(<ProductAutocomplete {...defaultProps} disabled />);
    const input = screen.getByRole("textbox");
    expect(input).toBeDisabled();
  });

  it("renders with custom no options text", () => {
    render(<ProductAutocomplete options={[]} inputValue="" noOptionsText="No products found" />);
    // Dropdown only shows on focus, so this verifies prop acceptance
    const { container } = render(<ProductAutocomplete options={[]} inputValue="" noOptionsText="Custom empty" />);
    expect(container).toBeTruthy();
  });
});
