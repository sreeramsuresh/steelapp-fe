/**
 * Label Component Tests
 * Tests Radix UI Label primitive wrapper
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Label } from "../label";

describe("Label", () => {
  it("renders without crashing", () => {
    const { container } = render(<Label>Test Label</Label>);
    expect(container).toBeTruthy();
  });

  it("renders text content", () => {
    render(<Label>Email Address</Label>);
    expect(screen.getByText("Email Address")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = render(<Label className="custom-label">Label</Label>);
    const label = container.querySelector("label");
    expect(label.className).toContain("custom-label");
  });

  it("applies default styling", () => {
    const { container } = render(<Label>Label</Label>);
    const label = container.querySelector("label");
    expect(label.className).toContain("text-sm");
    expect(label.className).toContain("font-medium");
  });

  it("passes htmlFor to underlying element", () => {
    const { container } = render(<Label htmlFor="email-input">Email</Label>);
    const label = container.querySelector("label");
    expect(label).toHaveAttribute("for", "email-input");
  });
});
