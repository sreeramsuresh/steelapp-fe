import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../../test/component-setup";
import ChartSkeleton from "../ChartSkeleton";

describe("ChartSkeleton", () => {
  it("renders without crashing", () => {
    const { container } = renderWithProviders(<ChartSkeleton />);
    expect(container).toBeTruthy();
  });

  it("displays loading text", () => {
    const { container } = renderWithProviders(<ChartSkeleton />);
    expect(container.textContent).toContain("Loading chart...");
  });

  it("renders with default height of 300px", () => {
    const { container } = renderWithProviders(<ChartSkeleton />);
    const skeleton = container.querySelector(".animate-pulse");
    expect(skeleton).toBeTruthy();
    expect(skeleton.style.height).toBe("300px");
  });

  it("renders with custom height", () => {
    const { container } = renderWithProviders(<ChartSkeleton height={500} />);
    const skeleton = container.querySelector(".animate-pulse");
    expect(skeleton).toBeTruthy();
    expect(skeleton.style.height).toBe("500px");
  });

  it("renders with full width", () => {
    const { container } = renderWithProviders(<ChartSkeleton />);
    const skeleton = container.querySelector(".animate-pulse");
    expect(skeleton.style.width).toBe("100%");
  });

  it("has rounded corners styling", () => {
    const { container } = renderWithProviders(<ChartSkeleton />);
    const skeleton = container.querySelector(".animate-pulse");
    expect(skeleton.classList.contains("rounded-lg")).toBe(true);
  });
});
