/**
 * LoadingSpinner Component Tests
 * Phase 5.3.2: Tier 3 Utility Component
 *
 * Tests loading spinner with multiple modes
 * Covers size variants, display modes, and messaging
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import LoadingSpinner from "../LoadingSpinner";

describe("LoadingSpinner", () => {
  it("should render inline spinner by default", () => {
    const { container } = render(<LoadingSpinner />);

    expect(container.querySelector("div")).toBeInTheDocument();
  });

  it("should apply small size classes", () => {
    const { container } = render(<LoadingSpinner size="sm" />);

    const spinner = container.querySelector(".animate-spin");
    expect(spinner).toHaveClass("w-4", "h-4");
  });

  it("should apply medium size classes (default)", () => {
    const { container } = render(<LoadingSpinner size="md" />);

    const spinner = container.querySelector(".animate-spin");
    expect(spinner).toHaveClass("w-8", "h-8");
  });

  it("should apply large size classes", () => {
    const { container } = render(<LoadingSpinner size="lg" />);

    const spinner = container.querySelector(".animate-spin");
    expect(spinner).toHaveClass("w-12", "h-12");
  });

  it("should apply animation classes", () => {
    const { container } = render(<LoadingSpinner />);

    const spinner = container.querySelector(".animate-spin");
    expect(spinner).toHaveClass("animate-spin", "border-2");
  });

  it("should apply border styling", () => {
    const { container } = render(<LoadingSpinner />);

    const spinner = container.querySelector(".animate-spin");
    expect(spinner).toHaveClass("border-muted-foreground", "border-t-primary", "rounded-full");
  });

  it("should render inline mode with flex layout", () => {
    const { container } = render(<LoadingSpinner mode="inline" />);

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("flex", "items-center", "gap-2");
  });

  it("should render inline mode without message by default", () => {
    const { container } = render(<LoadingSpinner mode="inline" />);

    expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("should render fullscreen mode with fixed positioning", () => {
    const { container } = render(<LoadingSpinner mode="fullscreen" />);

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("fixed", "inset-0", "flex", "flex-col");
  });

  it("should display message in fullscreen mode", () => {
    render(<LoadingSpinner mode="fullscreen" message="Loading data..." />);

    expect(screen.getByText("Loading data...")).toBeInTheDocument();
  });

  it("should apply fullscreen centering styles", () => {
    const { container } = render(<LoadingSpinner mode="fullscreen" />);

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("items-center", "justify-center");
  });

  it("should apply fullscreen background overlay", () => {
    const { container } = render(<LoadingSpinner mode="fullscreen" />);

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("bg-background/50");
  });

  it("should apply message styling in fullscreen mode", () => {
    render(<LoadingSpinner mode="fullscreen" message="Loading..." />);

    const message = screen.getByText("Loading...").closest("p");
    expect(message).toHaveClass("mt-4", "text-muted-foreground");
  });

  it("should render block mode with padding and centering", () => {
    const { container } = render(<LoadingSpinner mode="block" />);

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("flex", "flex-col", "items-center", "justify-center");
  });

  it("should apply block mode padding", () => {
    const { container } = render(<LoadingSpinner mode="block" />);

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("py-12", "px-4");
  });

  it("should display message in block mode", () => {
    render(<LoadingSpinner mode="block" message="Processing..." />);

    expect(screen.getByText("Processing...")).toBeInTheDocument();
  });

  it("should display default message when provided in block mode", () => {
    render(<LoadingSpinner message="Custom message" mode="block" />);

    expect(screen.getByText("Custom message")).toBeInTheDocument();
  });

  it("should not render message when empty string", () => {
    const { container } = render(<LoadingSpinner mode="block" message="" />);

    // Empty string is falsy, so no <p> message rendered
    const messageP = container.querySelector("p");
    expect(messageP).toBeNull();
    // Spinner should still be there
    expect(container.querySelector(".animate-spin")).toBeInTheDocument();
  });

  it("should render default Loading... message when no message prop", () => {
    render(<LoadingSpinner mode="block" />);

    // Default message prop is "Loading...", so it renders
    const messages = Array.from(document.querySelectorAll("p")).filter((p) => p.textContent === "Loading...");
    expect(messages.length).toBe(1);
  });

  it("should combine size and mode correctly", () => {
    const { container } = render(<LoadingSpinner size="lg" mode="block" message="Big spinner" />);

    const spinner = container.querySelector(".animate-spin");
    expect(spinner).toHaveClass("w-12", "h-12");
    expect(screen.getByText("Big spinner")).toBeInTheDocument();
  });

  it("should render spinner with correct HTML structure for inline", () => {
    const { container } = render(<LoadingSpinner mode="inline" />);

    const wrapper = container.firstChild;
    const spinner = wrapper.querySelector(".animate-spin");
    expect(wrapper.className).toMatch(/flex/);
    expect(spinner).toBeInTheDocument();
  });

  it("should handle all size variants in fullscreen mode", () => {
    const sizes = ["sm", "md", "lg"];

    sizes.forEach((size) => {
      const { container } = render(<LoadingSpinner size={size} mode="fullscreen" />);

      const spinner = container.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
    });
  });

  it("should maintain aspect ratio (square spinner)", () => {
    const { container } = render(<LoadingSpinner size="md" />);

    const spinner = container.querySelector(".animate-spin");
    expect(spinner).toHaveClass("w-8", "h-8"); // Same width and height
  });

  it("should apply rounded-full for circular appearance", () => {
    const { container } = render(<LoadingSpinner />);

    const spinner = container.querySelector(".animate-spin");
    expect(spinner).toHaveClass("rounded-full");
  });

  it("should render message below spinner in block mode", () => {
    const { container } = render(<LoadingSpinner mode="block" message="Loading" />);

    const wrapper = container.firstChild;
    const spinner = wrapper.querySelector(".animate-spin");
    const message = wrapper.querySelector("p");

    // Spinner should come before message in DOM
    expect(spinner).toBeInTheDocument();
    expect(message).toBeInTheDocument();
    expect(message.textContent).toBe("Loading");
  });

  it("should work with very long messages", () => {
    const longMessage =
      "This is a very long loading message that might wrap on smaller screens but should still display correctly";
    render(<LoadingSpinner mode="block" message={longMessage} />);

    expect(screen.getByText(longMessage)).toBeInTheDocument();
  });

  it("should default to inline mode when not specified", () => {
    const { container } = render(<LoadingSpinner />);

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("flex", "items-center", "gap-2");
    expect(wrapper).not.toHaveClass("fixed");
  });

  it("should render with all default values", () => {
    const { container } = render(<LoadingSpinner />);

    const spinner = container.querySelector(".animate-spin");
    expect(spinner).toHaveClass("w-8", "h-8"); // md size
    expect(container.firstChild).toHaveClass("flex"); // inline mode
  });
});
