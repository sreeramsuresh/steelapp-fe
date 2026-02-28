import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import LineItemPricingStatus from "../LineItemPricingStatus";

describe("LineItemPricingStatus", () => {
  it("renders priced badge", () => {
    render(<LineItemPricingStatus status="priced" isDarkMode={false} />);
    expect(screen.getByText("Priced")).toBeInTheDocument();
  });

  it("renders default price badge", () => {
    render(<LineItemPricingStatus status="using_default" isDarkMode={false} />);
    expect(screen.getByText("Default Price")).toBeInTheDocument();
  });

  it("renders missing price badge", () => {
    render(<LineItemPricingStatus status="missing_price" isDarkMode={false} />);
    expect(screen.getByText("Missing Price")).toBeInTheDocument();
  });

  it("returns null for unknown status", () => {
    const { container } = render(
      <LineItemPricingStatus status="unknown" isDarkMode={false} />
    );
    expect(container.innerHTML).toBe("");
  });

  it("applies green styling for priced", () => {
    const { container } = render(
      <LineItemPricingStatus status="priced" isDarkMode={false} />
    );
    expect(container.innerHTML).toContain("green");
  });

  it("applies red styling for missing_price", () => {
    const { container } = render(
      <LineItemPricingStatus status="missing_price" isDarkMode={false} />
    );
    expect(container.innerHTML).toContain("red");
  });
});
