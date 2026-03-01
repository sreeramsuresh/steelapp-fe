import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

vi.mock("../InvoiceInput", () => ({
  default: ({ label, value, onChange, onFocus, onBlur, onKeyDown, placeholder, disabled, ...props }) => (
    <div>
      {label && <label htmlFor={`autocomplete-${label}`}>{label}</label>}
      <input
        id={`autocomplete-${label}`}
        value={value}
        onChange={onChange}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        data-testid={props["data-testid"]}
      />
    </div>
  ),
}));

import Autocomplete from "../InvoiceAutocomplete";

describe("InvoiceAutocomplete", () => {
  const options = [
    { id: 1, name: "Steel Bar 10mm", subtitle: "Grade 60" },
    { id: 2, name: "Steel Bar 12mm", subtitle: "Grade 40" },
    { id: 3, name: "Rebar 16mm", subtitle: "Grade 60" },
  ];

  const defaultProps = {
    options,
    value: null,
    onChange: vi.fn(),
    onInputChange: vi.fn(),
    inputValue: "",
    placeholder: "Search products...",
    label: "Product",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders input with label", () => {
    render(<Autocomplete {...defaultProps} />);
    expect(screen.getByText("Product")).toBeTruthy();
  });

  it("renders input with placeholder", () => {
    render(<Autocomplete {...defaultProps} />);
    expect(screen.getByPlaceholderText("Search products...")).toBeTruthy();
  });

  it("opens dropdown on focus", () => {
    render(<Autocomplete {...defaultProps} />);
    fireEvent.focus(screen.getByPlaceholderText("Search products..."));
    expect(screen.getByRole("listbox")).toBeTruthy();
  });

  it("shows options in dropdown", () => {
    render(<Autocomplete {...defaultProps} />);
    fireEvent.focus(screen.getByPlaceholderText("Search products..."));
    expect(screen.getByText("Steel Bar 10mm")).toBeTruthy();
    expect(screen.getByText("Steel Bar 12mm")).toBeTruthy();
    expect(screen.getByText("Rebar 16mm")).toBeTruthy();
  });

  it("shows no options text when empty", () => {
    render(<Autocomplete {...defaultProps} options={[]} noOptionsText="Nothing found" />);
    fireEvent.focus(screen.getByPlaceholderText("Search products..."));
    expect(screen.getByText("Nothing found")).toBeTruthy();
  });

  it("calls onInputChange when typing", () => {
    render(<Autocomplete {...defaultProps} />);
    const input = screen.getByPlaceholderText("Search products...");
    fireEvent.change(input, { target: { value: "Steel" } });
    expect(defaultProps.onInputChange).toHaveBeenCalled();
  });

  it("renders disabled state", () => {
    render(<Autocomplete {...defaultProps} disabled={true} />);
    expect(screen.getByPlaceholderText("Search products...")).toHaveProperty("disabled", true);
  });
});
