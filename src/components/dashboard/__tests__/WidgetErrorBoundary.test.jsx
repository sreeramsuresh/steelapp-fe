import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "../../../contexts/ThemeContext";
import WidgetErrorBoundaryWithTheme from "../WidgetErrorBoundary";

function renderWithTheme(ui) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

const ProblemChild = () => {
  throw new Error("Test error");
};

describe("WidgetErrorBoundary", () => {
  // Suppress React error boundary console errors in tests
  const originalError = console.error;
  beforeEach(() => {
    console.error = vi.fn();
  });
  afterEach(() => {
    console.error = originalError;
  });

  it("renders children when no error", () => {
    renderWithTheme(
      <WidgetErrorBoundaryWithTheme widgetName="Test">
        <div>Widget content</div>
      </WidgetErrorBoundaryWithTheme>
    );
    expect(screen.getByText("Widget content")).toBeInTheDocument();
  });

  it("renders error UI when child throws", () => {
    renderWithTheme(
      <WidgetErrorBoundaryWithTheme widgetName="Revenue">
        <ProblemChild />
      </WidgetErrorBoundaryWithTheme>
    );
    expect(screen.getByText("Revenue could not load")).toBeInTheDocument();
  });

  it("shows Try Again button on error", () => {
    renderWithTheme(
      <WidgetErrorBoundaryWithTheme widgetName="Test">
        <ProblemChild />
      </WidgetErrorBoundaryWithTheme>
    );
    expect(screen.getByText("Try Again")).toBeInTheDocument();
  });

  it("shows generic name when widgetName not provided", () => {
    renderWithTheme(
      <WidgetErrorBoundaryWithTheme>
        <ProblemChild />
      </WidgetErrorBoundaryWithTheme>
    );
    expect(screen.getByText("Widget could not load")).toBeInTheDocument();
  });
});
