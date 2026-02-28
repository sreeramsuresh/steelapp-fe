import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import Button from "../InvoiceButton";
import { ThemeProvider } from "../../../contexts/ThemeContext";

function renderWithTheme(ui) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe("InvoiceButton", () => {
  it("renders children text", () => {
    renderWithTheme(<Button>Click Me</Button>);
    expect(screen.getByText("Click Me")).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    renderWithTheme(<Button onClick={onClick}>Go</Button>);
    screen.getByText("Go").click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("renders as disabled", () => {
    renderWithTheme(<Button disabled>Disabled</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("applies primary variant by default", () => {
    const { container } = renderWithTheme(<Button>Primary</Button>);
    expect(container.innerHTML).toContain("teal");
  });

  it("applies secondary variant", () => {
    const { container } = renderWithTheme(<Button variant="secondary">Sec</Button>);
    expect(container.innerHTML).not.toContain("teal-600");
  });

  it("applies outline variant", () => {
    const { container } = renderWithTheme(<Button variant="outline">Out</Button>);
    expect(container.innerHTML).toContain("border");
  });

  it("applies size classes", () => {
    const { container } = renderWithTheme(<Button size="sm">Small</Button>);
    expect(container.innerHTML).toContain("text-xs");
  });

  it("applies custom className", () => {
    const { container } = renderWithTheme(<Button className="extra">Cls</Button>);
    expect(container.innerHTML).toContain("extra");
  });
});
