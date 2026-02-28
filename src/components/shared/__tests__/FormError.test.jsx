/**
 * FormError Component Tests
 * Phase 5.3.2: Shared Component
 *
 * Tests form error message display with icon (Bug #12 fix)
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import FormError from "../FormError";

describe("FormError", () => {
  it("should render error message with icon", () => {
    const { container } = render(<FormError message="This field is required" />);

    expect(screen.getByText("This field is required")).toBeInTheDocument();
    // AlertCircle icon renders as SVG
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("should not render when message is not provided", () => {
    const { container } = render(<FormError />);

    expect(container.firstChild).toBeNull();
  });

  it("should not render when message is empty string", () => {
    const { container } = render(<FormError message="" />);

    expect(container.firstChild).toBeNull();
  });

  it("should not render when message is null", () => {
    const { container } = render(<FormError message={null} />);

    expect(container.firstChild).toBeNull();
  });

  it("should not render when message is undefined", () => {
    const { container } = render(<FormError message={undefined} />);

    expect(container.firstChild).toBeNull();
  });

  it("should apply custom className", () => {
    const { container } = render(<FormError message="Error" className="custom-class" />);

    const errorDiv = container.firstChild;
    expect(errorDiv).toHaveClass("custom-class");
  });

  it("should have correct styling classes", () => {
    const { container } = render(<FormError message="Error message" />);

    const errorDiv = container.firstChild;
    expect(errorDiv).toHaveClass("flex", "items-start", "gap-2", "text-red-600", "text-sm");
  });

  it("should display multiple line error messages", () => {
    const multiLineMessage = "Error on line 1\nError on line 2";
    const { container } = render(<FormError message={multiLineMessage} />);

    expect(container.textContent).toContain("Error on line 1");
    expect(container.textContent).toContain("Error on line 2");
  });

  it("should handle special characters in error messages", () => {
    const specialMessage = 'Email format must be: "name@example.com" (with @ symbol)';
    render(<FormError message={specialMessage} />);

    expect(screen.getByText(specialMessage)).toBeInTheDocument();
  });

  it("should handle very long error messages", () => {
    const longMessage =
      "This field validation failed because the input provided does not match any of the required criteria and patterns.";
    render(<FormError message={longMessage} />);

    expect(screen.getByText(longMessage)).toBeInTheDocument();
  });

  it("should have AlertCircle icon", () => {
    render(<FormError message="Error" />);

    const icon = screen.getByText("Error").previousSibling;
    expect(icon).toBeInTheDocument();
  });

  it("should apply dark mode classes", () => {
    const { container } = render(<FormError message="Error" />);

    const errorDiv = container.firstChild;
    expect(errorDiv).toHaveClass("dark:text-red-400");
  });
});
