import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import Card from "../InvoiceCard";
import { ThemeProvider } from "../../../contexts/ThemeContext";

function renderWithTheme(ui) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe("InvoiceCard", () => {
  it("renders children content", () => {
    renderWithTheme(<Card>Card content</Card>);
    expect(screen.getByText("Card content")).toBeInTheDocument();
  });

  it("applies rounded and shadow classes", () => {
    const { container } = renderWithTheme(<Card>Styled</Card>);
    expect(container.firstChild.className).toContain("rounded-xl");
    expect(container.firstChild.className).toContain("shadow-sm");
  });

  it("applies custom className", () => {
    const { container } = renderWithTheme(<Card className="p-4">Custom</Card>);
    expect(container.firstChild.className).toContain("p-4");
  });
});
