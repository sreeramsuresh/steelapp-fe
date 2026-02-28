import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../../test/component-setup";
import LoadingSpinner from "../LoadingSpinner";

describe("LoadingSpinner (shared)", () => {
  it("should render inline spinner by default", () => {
    const { container } = renderWithProviders(<LoadingSpinner />);
    expect(container).toBeInTheDocument();
    expect(container.querySelector(".animate-spin")).toBeTruthy();
  });

  it("should render fullscreen mode with message", () => {
    const { container } = renderWithProviders(<LoadingSpinner mode="fullscreen" message="Please wait..." />);
    expect(container).toBeInTheDocument();
    expect(container.textContent).toContain("Please wait...");
  });

  it("should render block mode", () => {
    const { container } = renderWithProviders(<LoadingSpinner mode="block" />);
    expect(container).toBeInTheDocument();
    expect(container.textContent).toContain("Loading...");
  });

  it("should support different sizes", () => {
    const { container } = renderWithProviders(<LoadingSpinner size="lg" />);
    expect(container.querySelector(".w-12")).toBeTruthy();
  });
});
