import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../../test/component-setup";
import ChartSkeleton from "../ChartSkeleton";

describe("ChartSkeleton", () => {
  it("should render loading placeholder", () => {
    const { container } = renderWithProviders(<ChartSkeleton />);
    expect(container).toBeInTheDocument();
    expect(container.textContent).toContain("Loading chart...");
  });

  it("should render with custom height", () => {
    const { container } = renderWithProviders(<ChartSkeleton height={500} />);
    expect(container).toBeInTheDocument();
    const skeleton = container.querySelector(".animate-pulse");
    expect(skeleton).toBeTruthy();
    expect(skeleton.style.height).toBe("500px");
  });

  it("should render with default height of 300px", () => {
    const { container } = renderWithProviders(<ChartSkeleton />);
    const skeleton = container.querySelector(".animate-pulse");
    expect(skeleton.style.height).toBe("300px");
  });
});
