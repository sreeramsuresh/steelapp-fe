import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import Textarea from "../InvoiceTextarea";
import { ThemeProvider } from "../../../contexts/ThemeContext";

function renderWithTheme(ui) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe("InvoiceTextarea", () => {
  it("renders textarea element", () => {
    renderWithTheme(<Textarea id="notes" />);
    expect(document.getElementById("notes")).toBeInTheDocument();
  });

  it("renders label when provided", () => {
    renderWithTheme(<Textarea label="Notes" />);
    expect(screen.getByText("Notes")).toBeInTheDocument();
  });

  it("displays error message", () => {
    renderWithTheme(<Textarea error="Too short" />);
    expect(screen.getByText("Too short")).toBeInTheDocument();
  });

  it("adds error border class when error present", () => {
    const { container } = renderWithTheme(<Textarea error="Bad" />);
    expect(container.querySelector("textarea").className).toContain("border-red");
  });

  it("calls onChange handler", () => {
    const onChange = vi.fn();
    renderWithTheme(<Textarea onChange={onChange} id="ta" />);
    const ta = document.getElementById("ta");
    ta.value = "hello";
    ta.dispatchEvent(new Event("change", { bubbles: true }));
    expect(onChange).toHaveBeenCalled();
  });

  it("applies autoGrow overflow-hidden class", () => {
    const { container } = renderWithTheme(<Textarea autoGrow />);
    expect(container.querySelector("textarea").className).toContain("overflow-hidden");
  });
});
