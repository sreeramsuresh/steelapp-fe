import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ThemeProvider } from "../../../contexts/ThemeContext";
import PricingWarningBanner from "../PricingWarningBanner";

function renderWithTheme(ui) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe("PricingWarningBanner", () => {
  it("renders warning message", () => {
    renderWithTheme(<PricingWarningBanner />);
    expect(screen.getByText("Product has no base price")).toBeInTheDocument();
  });

  it("renders help text", () => {
    renderWithTheme(<PricingWarningBanner />);
    expect(screen.getByText("Set selling price to add to default pricelist")).toBeInTheDocument();
  });

  it("respects isDarkMode override", () => {
    const { container } = renderWithTheme(<PricingWarningBanner isDarkMode={true} />);
    expect(container.querySelector(".bg-yellow-900\\/20")).toBeInTheDocument();
  });
});
