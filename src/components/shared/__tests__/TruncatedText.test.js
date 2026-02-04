/**
 * TruncatedText Component Tests
 * Phase 5.3.2: Tier 3 Typography Component
 *
 * Tests text truncation with hover tooltip
 * Covers responsive behavior, dark mode, and positioning
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import TruncatedText from "../TruncatedText";

describe("TruncatedText", () => {
  it("should render null when text is empty", () => {
    const { container } = render(<TruncatedText text="" />);

    expect(container.firstChild).toBeNull();
  });

  it("should render null when text is null", () => {
    const { container } = render(<TruncatedText text={null} />);

    expect(container.firstChild).toBeNull();
  });

  it("should render null when text is undefined", () => {
    const { container } = render(<TruncatedText />);

    expect(container.firstChild).toBeNull();
  });

  it("should render text in span by default", () => {
    const { container } = render(<TruncatedText text="Sample text" />);

    const span = container.querySelector("span");
    expect(span).toBeInTheDocument();
    expect(span.textContent).toBe("Sample text");
  });

  it("should render text in custom tag", () => {
    const { container } = render(<TruncatedText text="Sample" tag="div" />);

    const div = container.querySelector("div");
    expect(div).toBeInTheDocument();
    expect(div.textContent).toBe("Sample");
  });

  it("should apply default max-width (w-40)", () => {
    const { container } = render(<TruncatedText text="Very long text that should be truncated" />);

    const text = container.querySelector("span");
    expect(text).toHaveClass("w-40");
  });

  it("should apply custom maxWidth", () => {
    const { container } = render(<TruncatedText text="Text" maxWidth="w-60" />);

    const text = container.querySelector("span");
    expect(text).toHaveClass("w-60");
  });

  it("should apply truncate class", () => {
    const { container } = render(<TruncatedText text="Long text" />);

    const text = container.querySelector("span");
    expect(text).toHaveClass("truncate");
  });

  it("should have title attribute for native tooltip", () => {
    const { container } = render(<TruncatedText text="Sample text" />);

    const text = container.querySelector("span");
    expect(text).toHaveAttribute("title", "Sample text");
  });

  it("should apply custom className to text element", () => {
    const { container } = render(
      <TruncatedText text="Text" className="custom-class font-bold" />
    );

    const text = container.querySelector("span");
    expect(text).toHaveClass("custom-class", "font-bold");
  });

  it("should show tooltip on mouse enter", () => {
    const { container } = render(<TruncatedText text="Hover me" />);

    const text = container.querySelector("span");
    fireEvent.mouseEnter(text);

    const tooltip = container.querySelector('[class*="bg-gray-900"]');
    expect(tooltip).toBeInTheDocument();
    expect(tooltip.textContent).toContain("Hover me");
  });

  it("should hide tooltip on mouse leave", () => {
    const { container } = render(<TruncatedText text="Hover me" />);

    const text = container.querySelector("span");
    fireEvent.mouseEnter(text);
    expect(container.querySelector('[class*="bg-gray-900"]')).toBeInTheDocument();

    fireEvent.mouseLeave(text);
    expect(container.querySelector('[class*="bg-gray-900"]')).not.toBeInTheDocument();
  });

  it("should render tooltip with correct text content", () => {
    const { container } = render(
      <TruncatedText text="Analytics Test Customer - 33156-1768915870210-1ufjwz" />
    );

    const text = container.querySelector("span");
    fireEvent.mouseEnter(text);

    const tooltip = container.querySelector('[class*="bg-gray-900"]');
    expect(tooltip.textContent).toContain("Analytics Test Customer");
  });

  it("should apply top tooltip positioning by default", () => {
    const { container } = render(<TruncatedText text="Text" />);

    const text = container.querySelector("span");
    fireEvent.mouseEnter(text);

    const tooltip = container.querySelector('[class*="bg-gray-900"]');
    expect(tooltip).toHaveClass("bottom-full", "mb-2");
  });

  it("should apply bottom tooltip positioning", () => {
    const { container } = render(
      <TruncatedText text="Text" tooltipPosition="bottom" />
    );

    const text = container.querySelector("span");
    fireEvent.mouseEnter(text);

    const tooltip = container.querySelector('[class*="bg-gray-900"]');
    expect(tooltip).toHaveClass("top-full", "mt-2");
  });

  it("should apply left tooltip positioning", () => {
    const { container } = render(
      <TruncatedText text="Text" tooltipPosition="left" />
    );

    const text = container.querySelector("span");
    fireEvent.mouseEnter(text);

    const tooltip = container.querySelector('[class*="bg-gray-900"]');
    expect(tooltip).toHaveClass("right-full", "mr-2");
  });

  it("should apply right tooltip positioning", () => {
    const { container } = render(
      <TruncatedText text="Text" tooltipPosition="right" />
    );

    const text = container.querySelector("span");
    fireEvent.mouseEnter(text);

    const tooltip = container.querySelector('[class*="bg-gray-900"]');
    expect(tooltip).toHaveClass("left-full", "ml-2");
  });

  it("should apply tooltip styling classes", () => {
    const { container } = render(<TruncatedText text="Text" />);

    const text = container.querySelector("span");
    fireEvent.mouseEnter(text);

    const tooltip = container.querySelector('[class*="bg-gray-900"]');
    expect(tooltip).toHaveClass(
      "px-2",
      "py-1",
      "text-white",
      "text-xs",
      "rounded",
      "whitespace-nowrap",
      "pointer-events-none",
      "z-50"
    );
  });

  it("should apply dark mode styling to tooltip", () => {
    const { container } = render(<TruncatedText text="Text" />);

    const text = container.querySelector("span");
    fireEvent.mouseEnter(text);

    const tooltip = container.querySelector('[class*="bg-gray-900"]');
    expect(tooltip).toHaveClass("dark:bg-gray-700");
  });

  it("should apply max-width to tooltip", () => {
    const { container } = render(<TruncatedText text="Text" />);

    const text = container.querySelector("span");
    fireEvent.mouseEnter(text);

    const tooltip = container.querySelector('[class*="bg-gray-900"]');
    expect(tooltip).toHaveClass("max-w-xs");
  });

  it("should render tooltip arrow element", () => {
    const { container } = render(<TruncatedText text="Text" />);

    const text = container.querySelector("span");
    fireEvent.mouseEnter(text);

    const arrow = container.querySelector('[class*="border"]');
    expect(arrow).toBeInTheDocument();
  });

  it("should render wrapper div with relative positioning", () => {
    const { container } = render(<TruncatedText text="Text" />);

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("relative", "inline-block");
  });

  it("should handle very long text", () => {
    const longText =
      "This is an extremely long text that contains a lot of characters and should be properly truncated when displayed in the component with a limited width";
    const { container } = render(<TruncatedText text={longText} />);

    const text = container.querySelector("span");
    expect(text.textContent).toBe(longText);
  });

  it("should handle special characters in text", () => {
    const specialText = "Test & Demo <> Special | Characters";
    const { container } = render(<TruncatedText text={specialText} />);

    const text = container.querySelector("span");
    expect(text.textContent).toBe(specialText);
  });

  it("should handle unicode characters", () => {
    const unicodeText = "测试文本 - テキスト - نص اختبار";
    const { container } = render(<TruncatedText text={unicodeText} />);

    const text = container.querySelector("span");
    expect(text.textContent).toBe(unicodeText);
  });

  it("should render custom tag correctly", () => {
    const { container } = render(
      <TruncatedText text="Paragraph text" tag="p" className="text-base" />
    );

    const p = container.querySelector("p");
    expect(p).toBeInTheDocument();
    expect(p.textContent).toBe("Paragraph text");
  });

  it("should combine all width and truncation classes", () => {
    const { container } = render(
      <TruncatedText text="Text" maxWidth="w-64" className="font-semibold"
      />
    );

    const text = container.querySelector("span");
    expect(text).toHaveClass("w-64", "truncate", "font-semibold");
  });

  it("should handle rapid hover events", () => {
    const { container } = render(<TruncatedText text="Text" />);

    const text = container.querySelector("span");

    // Rapid enter/leave
    fireEvent.mouseEnter(text);
    fireEvent.mouseLeave(text);
    fireEvent.mouseEnter(text);

    const tooltip = container.querySelector('[class*="bg-gray-900"]');
    expect(tooltip).toBeInTheDocument();
  });

  it("should handle tag as any valid HTML element", () => {
    const tags = ["span", "div", "p", "strong", "em"];

    tags.forEach(tag => {
      const { container } = render(<TruncatedText text="Text" tag={tag} />);

      const element = container.querySelector(tag);
      expect(element).toBeInTheDocument();
    });
  });

  it("should preserve text exactly as provided", () => {
    const exactText = "  Spaces  And  Text  ";
    const { container } = render(<TruncatedText text={exactText} />);

    const text = container.querySelector("span");
    expect(text.textContent).toBe(exactText);
  });

  it("should not render tooltip until mouse enters", () => {
    const { container } = render(<TruncatedText text="Text" />);

    // Initially no tooltip
    expect(container.querySelector('[class*="bg-gray-900"]')).not.toBeInTheDocument();

    // After mouse enter
    const text = container.querySelector("span");
    fireEvent.mouseEnter(text);
    expect(container.querySelector('[class*="bg-gray-900"]')).toBeInTheDocument();
  });

  it("should render with arrow pointing in correct direction", () => {
    const { container } = render(
      <TruncatedText text="Text" tooltipPosition="top" />
    );

    const text = container.querySelector("span");
    fireEvent.mouseEnter(text);

    const arrow = container.querySelector('[class*="border"]');
    expect(arrow).toHaveClass("top-full"); // Arrow points down (tooltip above)
  });

  it("should handle multiple instances independently", () => {
    const { container } = render(
      <>
        <TruncatedText text="First text" />
        <TruncatedText text="Second text" />
      </>
    );

    const texts = container.querySelectorAll("span");
    expect(texts).toHaveLength(2);

    fireEvent.mouseEnter(texts[0]);
    const tooltips = container.querySelectorAll('[class*="bg-gray-900"]');
    expect(tooltips).toHaveLength(1);
  });
});
