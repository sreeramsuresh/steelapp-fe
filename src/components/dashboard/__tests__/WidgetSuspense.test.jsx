import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "../../../contexts/ThemeContext";
import WidgetSuspense, { withWidgetSuspense } from "../WidgetSuspense";

vi.mock("../WidgetSkeleton", () => ({
  default: ({ variant }) => <div data-testid="skeleton">Loading {variant}</div>,
}));

function renderWithTheme(ui) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe("WidgetSuspense", () => {
  it("renders children when no error", () => {
    renderWithTheme(
      <WidgetSuspense widgetName="Test">
        <div>Widget content</div>
      </WidgetSuspense>
    );
    expect(screen.getByText("Widget content")).toBeInTheDocument();
  });

  it("renders error UI when child throws", () => {
    const originalError = console.error;
    console.error = vi.fn();

    const ProblemChild = () => {
      throw new Error("Crash");
    };

    renderWithTheme(
      <WidgetSuspense widgetName="Revenue">
        <ProblemChild />
      </WidgetSuspense>
    );
    expect(screen.getByText(/Failed to load Revenue/)).toBeInTheDocument();

    console.error = originalError;
  });
});

describe("withWidgetSuspense", () => {
  it("wraps component with suspense boundary", () => {
    const Inner = () => <div>Inner widget</div>;
    const Wrapped = withWidgetSuspense(Inner, { widgetName: "Test" });
    renderWithTheme(<Wrapped />);
    expect(screen.getByText("Inner widget")).toBeInTheDocument();
  });

  it("sets displayName", () => {
    const Inner = () => <div>Test</div>;
    Inner.displayName = "MyWidget";
    const Wrapped = withWidgetSuspense(Inner);
    expect(Wrapped.displayName).toBe("WithSuspense(MyWidget)");
  });
});
