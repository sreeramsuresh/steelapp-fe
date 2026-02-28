import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../../test/component-setup";
import ChartSkeleton from "../ChartSkeleton";

describe("ChartSkeleton (LineChart placeholder)", () => {
  it("should render loading placeholder with default height", () => {
    const { container } = renderWithProviders(<ChartSkeleton />);
    expect(container).toBeInTheDocument();
    const skeleton = container.querySelector(".animate-pulse");
    expect(skeleton).toBeTruthy();
  });

  it("should display loading text", () => {
    const { container } = renderWithProviders(<ChartSkeleton />);
    expect(container.textContent).toContain("Loading chart...");
  });

  it("should use full width", () => {
    const { container } = renderWithProviders(<ChartSkeleton />);
    const skeleton = container.querySelector(".animate-pulse");
    expect(skeleton.style.width).toBe("100%");
  });
});
