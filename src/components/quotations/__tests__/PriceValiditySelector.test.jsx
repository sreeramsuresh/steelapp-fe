import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import PriceValiditySelector from "../PriceValiditySelector";
import { ThemeProvider } from "../../../contexts/ThemeContext";

function renderWithTheme(ui) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe("PriceValiditySelector", () => {
  it("renders label", () => {
    renderWithTheme(<PriceValiditySelector value="" onChange={vi.fn()} />);
    expect(screen.getByText("Price Validity Condition")).toBeInTheDocument();
  });

  it("renders select with default empty option", () => {
    renderWithTheme(<PriceValiditySelector value="" onChange={vi.fn()} />);
    expect(screen.getByText("No specific condition")).toBeInTheDocument();
  });

  it("renders all predefined options", () => {
    renderWithTheme(<PriceValiditySelector value="" onChange={vi.fn()} />);
    expect(screen.getByText("Valid for 7 days")).toBeInTheDocument();
    expect(screen.getByText("Valid for 14 days")).toBeInTheDocument();
    expect(screen.getByText("Valid for 30 days")).toBeInTheDocument();
    expect(screen.getByText("Subject to stock availability")).toBeInTheDocument();
  });

  it("shows PDF note when value is selected", () => {
    renderWithTheme(<PriceValiditySelector value="valid_7_days" onChange={vi.fn()} />);
    expect(screen.getByText(/quotation PDF/)).toBeInTheDocument();
  });

  it("hides PDF note when no value", () => {
    renderWithTheme(<PriceValiditySelector value="" onChange={vi.fn()} />);
    expect(screen.queryByText(/quotation PDF/)).not.toBeInTheDocument();
  });

  it("shows custom input when custom is selected", () => {
    renderWithTheme(<PriceValiditySelector value="custom" onChange={vi.fn()} />);
    expect(screen.getByPlaceholderText("Enter custom condition")).toBeInTheDocument();
  });
});
