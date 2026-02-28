import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import WidgetSkeleton from "../WidgetSkeleton";
import { ThemeProvider } from "../../../contexts/ThemeContext";

function renderWithTheme(ui) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe("WidgetSkeleton", () => {
  it("renders card skeleton by default", () => {
    renderWithTheme(<WidgetSkeleton />);
    expect(screen.getByLabelText("Loading widget")).toBeInTheDocument();
  });

  it("renders chart skeleton", () => {
    renderWithTheme(<WidgetSkeleton variant="chart" />);
    expect(screen.getByLabelText("Loading chart")).toBeInTheDocument();
  });

  it("renders list skeleton", () => {
    renderWithTheme(<WidgetSkeleton variant="list" />);
    expect(screen.getByLabelText("Loading list")).toBeInTheDocument();
  });

  it("renders table skeleton", () => {
    renderWithTheme(<WidgetSkeleton variant="table" />);
    expect(screen.getByLabelText("Loading table")).toBeInTheDocument();
  });

  it("applies size classes for sm", () => {
    const { container } = renderWithTheme(<WidgetSkeleton size="sm" />);
    expect(container.innerHTML).toContain("min-h-[120px]");
  });

  it("applies size classes for lg", () => {
    const { container } = renderWithTheme(<WidgetSkeleton size="lg" />);
    expect(container.innerHTML).toContain("min-h-[240px]");
  });
});
