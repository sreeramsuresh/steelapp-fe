import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import KPIBar from "../KPIBar";
import { ThemeProvider } from "../../../contexts/ThemeContext";

function renderWithTheme(ui) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe("KPIBar", () => {
  const items = [
    { label: "Total", value: "AED 1,000", filterValue: "all", color: "teal" },
    { label: "Paid", value: "AED 800", filterValue: "paid", color: "green" },
    { label: "Static", value: "5" },
  ];

  it("renders all KPI items", () => {
    renderWithTheme(<KPIBar items={items} activeFilter="" onFilter={vi.fn()} />);
    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getByText("Paid")).toBeInTheDocument();
    expect(screen.getByText("Static")).toBeInTheDocument();
  });

  it("renders values", () => {
    renderWithTheme(<KPIBar items={items} activeFilter="" onFilter={vi.fn()} />);
    expect(screen.getByText("AED 1,000")).toBeInTheDocument();
    expect(screen.getByText("AED 800")).toBeInTheDocument();
  });

  it("renders clickable items as buttons", () => {
    renderWithTheme(<KPIBar items={items} activeFilter="" onFilter={vi.fn()} />);
    const buttons = screen.getAllByRole("button");
    expect(buttons.length).toBe(2); // Only items with filterValue
  });

  it("calls onFilter when clickable KPI clicked", () => {
    const onFilter = vi.fn();
    renderWithTheme(<KPIBar items={items} activeFilter="" onFilter={onFilter} />);
    screen.getByText("Total").closest("button").click();
    expect(onFilter).toHaveBeenCalledWith("all");
  });

  it("renders empty when no items", () => {
    const { container } = renderWithTheme(
      <KPIBar items={[]} activeFilter="" onFilter={vi.fn()} />
    );
    expect(container.querySelector("button")).toBeNull();
  });

  it("applies custom columns class", () => {
    const { container } = renderWithTheme(
      <KPIBar items={items} activeFilter="" onFilter={vi.fn()} columns="grid-cols-3" />
    );
    expect(container.firstChild.className).toContain("grid-cols-3");
  });
});
