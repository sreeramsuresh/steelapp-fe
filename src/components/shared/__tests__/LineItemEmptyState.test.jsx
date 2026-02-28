import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import LineItemEmptyState from "../LineItemEmptyState";
import { ThemeProvider } from "../../../contexts/ThemeContext";

function renderWithTheme(ui) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe("LineItemEmptyState", () => {
  it("renders default title", () => {
    renderWithTheme(<LineItemEmptyState onAdd={vi.fn()} />);
    expect(screen.getByText("No line items yet")).toBeInTheDocument();
  });

  it("renders default description", () => {
    renderWithTheme(<LineItemEmptyState onAdd={vi.fn()} />);
    expect(
      screen.getByText(/Search for products or click the button/)
    ).toBeInTheDocument();
  });

  it("renders default button text", () => {
    renderWithTheme(<LineItemEmptyState onAdd={vi.fn()} />);
    expect(screen.getByText("Add First Item")).toBeInTheDocument();
  });

  it("renders custom title", () => {
    renderWithTheme(
      <LineItemEmptyState title="Nothing here" onAdd={vi.fn()} />
    );
    expect(screen.getByText("Nothing here")).toBeInTheDocument();
  });

  it("calls onAdd when button clicked", () => {
    const onAdd = vi.fn();
    renderWithTheme(<LineItemEmptyState onAdd={onAdd} />);
    screen.getByText("Add First Item").click();
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it("renders custom button text", () => {
    renderWithTheme(
      <LineItemEmptyState buttonText="Add Product" onAdd={vi.fn()} />
    );
    expect(screen.getByText("Add Product")).toBeInTheDocument();
  });
});
