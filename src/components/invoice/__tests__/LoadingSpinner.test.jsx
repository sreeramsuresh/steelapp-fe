import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ThemeProvider } from "../../../contexts/ThemeContext";
import LoadingSpinner from "../LoadingSpinner";

function renderWithTheme(ui) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe("LoadingSpinner", () => {
  it("renders spinner element", () => {
    const { container } = renderWithTheme(<LoadingSpinner />);
    expect(container.firstChild).toBeTruthy();
    expect(container.firstChild.className).toContain("animate-spin");
  });

  it("defaults to md size", () => {
    const { container } = renderWithTheme(<LoadingSpinner />);
    expect(container.firstChild.className).toContain("h-6");
    expect(container.firstChild.className).toContain("w-6");
  });

  it("applies sm size", () => {
    const { container } = renderWithTheme(<LoadingSpinner size="sm" />);
    expect(container.firstChild.className).toContain("h-4");
  });

  it("applies lg size", () => {
    const { container } = renderWithTheme(<LoadingSpinner size="lg" />);
    expect(container.firstChild.className).toContain("h-8");
  });
});
