import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import Input from "../InvoiceInput";
import { ThemeProvider } from "../../../contexts/ThemeContext";

vi.mock("../../forms/ValidatedInput", () => ({
  getValidationClasses: () => "",
}));

function renderWithTheme(ui) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe("InvoiceInput", () => {
  it("renders input element", () => {
    renderWithTheme(<Input data-testid="test-input" />);
    expect(screen.getByTestId("test-input")).toBeInTheDocument();
  });

  it("renders label when provided", () => {
    renderWithTheme(<Input label="Email" />);
    expect(screen.getByText("Email")).toBeInTheDocument();
  });

  it("hides label when not provided", () => {
    const { container } = renderWithTheme(<Input />);
    expect(container.querySelector("label")).toBeNull();
  });

  it("displays error message", () => {
    renderWithTheme(<Input error="Required field" />);
    expect(screen.getByText("Required field")).toBeInTheDocument();
  });

  it("marks required fields with asterisk indicator", () => {
    const { container } = renderWithTheme(<Input label="Name" required />);
    expect(container.innerHTML).toContain("after:content-");
  });

  it("associates label with input via htmlFor", () => {
    renderWithTheme(<Input label="Phone" id="phone-input" />);
    const label = screen.getByText("Phone");
    expect(label).toHaveAttribute("for", "phone-input");
  });
});
