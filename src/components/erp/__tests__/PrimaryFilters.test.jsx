import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import PrimaryFilters, { AdvancedFilterField } from "../PrimaryFilters";
import { ThemeProvider } from "../../../contexts/ThemeContext";

function renderWithTheme(ui) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe("PrimaryFilters", () => {
  it("renders Apply button", () => {
    renderWithTheme(<PrimaryFilters onApply={vi.fn()} />);
    expect(screen.getByText("Apply")).toBeInTheDocument();
  });

  it("renders search input when search prop provided", () => {
    renderWithTheme(
      <PrimaryFilters
        onApply={vi.fn()}
        search={{ value: "", onChange: vi.fn(), placeholder: "Search invoices..." }}
      />
    );
    expect(screen.getByPlaceholderText("Search invoices...")).toBeInTheDocument();
  });

  it("renders date range inputs when dateRange provided", () => {
    renderWithTheme(
      <PrimaryFilters
        onApply={vi.fn()}
        dateRange={{
          start: "2025-01-01",
          end: "2025-01-31",
          onStartChange: vi.fn(),
          onEndChange: vi.fn(),
        }}
      />
    );
    expect(screen.getByLabelText("Start date")).toBeInTheDocument();
    expect(screen.getByLabelText("End date")).toBeInTheDocument();
  });

  it("calls onApply when Apply clicked", () => {
    const onApply = vi.fn();
    renderWithTheme(<PrimaryFilters onApply={onApply} />);
    screen.getByText("Apply").click();
    expect(onApply).toHaveBeenCalledTimes(1);
  });

  it("renders Export button when onExport provided", () => {
    renderWithTheme(<PrimaryFilters onApply={vi.fn()} onExport={vi.fn()} />);
    expect(screen.getByText("Export")).toBeInTheDocument();
  });

  it("renders More button when onToggleAdvanced provided", () => {
    renderWithTheme(
      <PrimaryFilters onApply={vi.fn()} onToggleAdvanced={vi.fn()} />
    );
    expect(screen.getByText("More")).toBeInTheDocument();
  });

  it("renders advanced content when showAdvanced is true", () => {
    renderWithTheme(
      <PrimaryFilters
        onApply={vi.fn()}
        showAdvanced={true}
        onToggleAdvanced={vi.fn()}
        advancedContent={<div>Advanced options</div>}
      />
    );
    expect(screen.getByText("Advanced options")).toBeInTheDocument();
  });

  it("disables Apply when loading", () => {
    renderWithTheme(<PrimaryFilters onApply={vi.fn()} loading={true} />);
    expect(screen.getByText("Apply").closest("button")).toBeDisabled();
  });
});

describe("AdvancedFilterField", () => {
  it("renders label and children", () => {
    render(
      <AdvancedFilterField label="Status" htmlFor="status-select">
        <select id="status-select"><option>All</option></select>
      </AdvancedFilterField>
    );
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("All")).toBeInTheDocument();
  });
});
