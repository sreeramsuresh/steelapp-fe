import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import PeriodFilters from "../PeriodFilters";

describe("PeriodFilters", () => {
  const defaultFilters = { year: 2025, status: null };

  it("renders year and status filter dropdowns", () => {
    render(
      <PeriodFilters filters={defaultFilters} onFilterChange={vi.fn()} />
    );
    expect(screen.getByLabelText("Year")).toBeInTheDocument();
    expect(screen.getByLabelText("Status")).toBeInTheDocument();
  });

  it("displays current year in filter options", () => {
    const currentYear = new Date().getFullYear();
    render(
      <PeriodFilters filters={defaultFilters} onFilterChange={vi.fn()} />
    );
    expect(
      screen.getByRole("option", { name: String(currentYear) })
    ).toBeInTheDocument();
  });

  it("displays all status options", () => {
    render(
      <PeriodFilters filters={defaultFilters} onFilterChange={vi.fn()} />
    );
    expect(screen.getByRole("option", { name: "All Status" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Open" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "In Review" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Locked" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Finalized" })).toBeInTheDocument();
  });

  it("calls onFilterChange with new year", () => {
    const onChange = vi.fn();
    render(
      <PeriodFilters filters={defaultFilters} onFilterChange={onChange} />
    );
    const currentYear = new Date().getFullYear();
    fireEvent.change(screen.getByLabelText("Year"), {
      target: { value: String(currentYear - 1) },
    });
    expect(onChange).toHaveBeenCalledWith({
      year: currentYear - 1,
      status: null,
    });
  });

  it("calls onFilterChange with new status", () => {
    const onChange = vi.fn();
    render(
      <PeriodFilters filters={defaultFilters} onFilterChange={onChange} />
    );
    fireEvent.change(screen.getByLabelText("Status"), {
      target: { value: "LOCKED" },
    });
    expect(onChange).toHaveBeenCalledWith({ year: 2025, status: "LOCKED" });
  });

  it("shows tip text", () => {
    render(
      <PeriodFilters filters={defaultFilters} onFilterChange={vi.fn()} />
    );
    expect(screen.getByText(/Use these filters/)).toBeInTheDocument();
  });
});
