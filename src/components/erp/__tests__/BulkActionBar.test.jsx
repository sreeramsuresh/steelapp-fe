import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import BulkActionBar from "../BulkActionBar";
import { ThemeProvider } from "../../../contexts/ThemeContext";

function renderWithTheme(ui) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe("BulkActionBar", () => {
  it("returns null when selectedCount is 0", () => {
    const { container } = renderWithTheme(
      <BulkActionBar selectedCount={0} onClearAll={vi.fn()}>
        <button type="button">Delete</button>
      </BulkActionBar>
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders when items are selected", () => {
    renderWithTheme(
      <BulkActionBar selectedCount={5} onClearAll={vi.fn()}>
        <button type="button">Delete</button>
      </BulkActionBar>
    );
    expect(screen.getByText("5 selected")).toBeInTheDocument();
  });

  it("renders children action buttons", () => {
    renderWithTheme(
      <BulkActionBar selectedCount={3} onClearAll={vi.fn()}>
        <button type="button">Export</button>
      </BulkActionBar>
    );
    expect(screen.getByText("Export")).toBeInTheDocument();
  });

  it("renders Clear button", () => {
    renderWithTheme(
      <BulkActionBar selectedCount={2} onClearAll={vi.fn()}>
        <span>Action</span>
      </BulkActionBar>
    );
    expect(screen.getByText("Clear")).toBeInTheDocument();
  });

  it("calls onClearAll when Clear clicked", () => {
    const onClear = vi.fn();
    renderWithTheme(
      <BulkActionBar selectedCount={2} onClearAll={onClear}>
        <span>Action</span>
      </BulkActionBar>
    );
    screen.getByText("Clear").click();
    expect(onClear).toHaveBeenCalledTimes(1);
  });
});
