import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import PriceInheritanceIndicator from "../PriceInheritanceIndicator";

describe("PriceInheritanceIndicator", () => {
  it("shows Override badge when isOverride is true", () => {
    render(<PriceInheritanceIndicator isOverride={true} isDarkMode={false} />);
    expect(screen.getByText(/Override/)).toBeInTheDocument();
    expect(screen.getByTitle("Customer-specific price override")).toBeInTheDocument();
  });

  it("shows Inherited badge when isOverride is false", () => {
    render(<PriceInheritanceIndicator isOverride={false} isDarkMode={false} />);
    expect(screen.getByText(/Inherited/)).toBeInTheDocument();
    expect(screen.getByTitle("Using company default price")).toBeInTheDocument();
  });

  it("renders with dark mode styles", () => {
    const { container } = render(
      <PriceInheritanceIndicator isOverride={true} isDarkMode={true} />
    );
    expect(container.querySelector(".bg-green-900")).toBeInTheDocument();
  });

  it("renders with light mode styles", () => {
    const { container } = render(
      <PriceInheritanceIndicator isOverride={true} isDarkMode={false} />
    );
    expect(container.querySelector(".bg-green-100")).toBeInTheDocument();
  });
});
