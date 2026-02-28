import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import PricingWarningBanner from "../PricingWarningBanner";
import { ThemeProvider } from "../../../contexts/ThemeContext";

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
    expect(
      screen.getByText("Set selling price to add to default pricelist")
    ).toBeInTheDocument();
  });

  it("respects isDarkMode override", () => {
    const { container } = renderWithTheme(
      <PricingWarningBanner isDarkMode={true} />
    );
    expect(container.querySelector(".bg-yellow-900\\/20")).toBeInTheDocument();
  });
});
