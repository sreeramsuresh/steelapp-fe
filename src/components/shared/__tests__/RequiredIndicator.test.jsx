/**
 * RequiredIndicator Component Tests
 * Tests the red asterisk indicator for required fields
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import RequiredIndicator from "../RequiredIndicator";

describe("RequiredIndicator", () => {
  it("renders without crashing", () => {
    const { container } = render(<RequiredIndicator />);
    expect(container).toBeTruthy();
  });

  it("renders an asterisk", () => {
    render(<RequiredIndicator />);
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("has aria-hidden attribute for accessibility", () => {
    render(<RequiredIndicator />);
    const indicator = screen.getByText("*");
    expect(indicator).toHaveAttribute("aria-hidden", "true");
  });

  it("applies red color styling", () => {
    render(<RequiredIndicator />);
    const indicator = screen.getByText("*");
    expect(indicator.className).toContain("text-red");
  });
});
