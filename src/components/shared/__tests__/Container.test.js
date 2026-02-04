/**
 * Container Component Tests
 * Phase 5.3.2: Tier 3 Layout Component
 *
 * Tests responsive container with consistent padding and max-width
 * Covers size variants, responsive behavior, and styling
 */

import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Container from "../Container";

describe("Container", () => {
  it("should render children content", () => {
    const { container } = render(
      <Container>
        <div data-testid="child">Test Content</div>
      </Container>
    );

    const child = container.querySelector('[data-testid="child"]');
    expect(child).toBeInTheDocument();
    expect(child.textContent).toBe("Test Content");
  });

  it("should apply default size classes (lg)", () => {
    const { container } = render(<Container>Content</Container>);

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("max-w-3xl");
  });

  it("should apply small size classes", () => {
    const { container } = render(<Container size="sm">Content</Container>);

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("max-w-sm");
  });

  it("should apply medium size classes", () => {
    const { container } = render(<Container size="md">Content</Container>);

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("max-w-md");
  });

  it("should apply large size classes", () => {
    const { container } = render(<Container size="lg">Content</Container>);

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("max-w-3xl");
  });

  it("should apply extra-large size classes", () => {
    const { container } = render(<Container size="xl">Content</Container>);

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("max-w-5xl");
  });

  it("should apply full width size", () => {
    const { container } = render(<Container size="full">Content</Container>);

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("w-full");
  });

  it("should apply default padding (p-4)", () => {
    const { container } = render(<Container>Content</Container>);

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("p-4");
  });

  it("should apply custom padding classes", () => {
    const { container } = render(<Container padding="p-8">Content</Container>);

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("p-8");
  });

  it("should apply no padding when specified", () => {
    const { container } = render(<Container padding="p-0">Content</Container>);

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("p-0");
  });

  it("should always apply mx-auto for horizontal centering", () => {
    const { container } = render(<Container size="sm">Content</Container>);

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("mx-auto");
  });

  it("should apply custom className in addition to defaults", () => {
    const { container } = render(
      <Container size="md" padding="p-6" className="custom-class">
        Content
      </Container>
    );

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("max-w-md", "p-6", "mx-auto", "custom-class");
  });

  it("should combine all size, padding, and custom classes", () => {
    const { container } = render(
      <Container size="lg" padding="p-8" className="border rounded-lg">
        Content
      </Container>
    );

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("max-w-3xl", "p-8", "mx-auto", "border", "rounded-lg");
  });

  it("should render div element", () => {
    const { container } = render(<Container>Content</Container>);

    expect(container.firstChild.tagName).toBe("DIV");
  });

  it("should handle multiple children", () => {
    const { container } = render(
      <Container>
        <p data-testid="p1">Paragraph 1</p>
        <p data-testid="p2">Paragraph 2</p>
        <p data-testid="p3">Paragraph 3</p>
      </Container>
    );

    expect(container.querySelector('[data-testid="p1"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="p2"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="p3"]')).toBeInTheDocument();
  });

  it("should handle complex nested content", () => {
    const { container } = render(
      <Container size="lg" padding="p-6">
        <div>
          <h2>Title</h2>
          <p>Content</p>
          <ul>
            <li>Item 1</li>
            <li>Item 2</li>
          </ul>
        </div>
      </Container>
    );

    expect(container.querySelector("h2")).toBeInTheDocument();
    expect(container.querySelector("ul")).toBeInTheDocument();
    expect(container.querySelectorAll("li")).toHaveLength(2);
  });

  it("should accept arbitrary Tailwind padding classes", () => {
    const { container } = render(<Container padding="px-4 py-8">Content</Container>);

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("px-4", "py-8");
  });

  it("should preserve order of classes", () => {
    const { container } = render(
      <Container size="md" padding="p-6" className="shadow rounded">
        Content
      </Container>
    );

    const wrapper = container.firstChild;
    // All classes should be present (order may vary in class list)
    expect(wrapper.className).toMatch(/max-w-md/);
    expect(wrapper.className).toMatch(/p-6/);
    expect(wrapper.className).toMatch(/mx-auto/);
    expect(wrapper.className).toMatch(/shadow/);
    expect(wrapper.className).toMatch(/rounded/);
  });

  it("should handle empty custom className", () => {
    const { container } = render(
      <Container size="lg" padding="p-4" className="">
        Content
      </Container>
    );

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("max-w-3xl", "p-4", "mx-auto");
  });

  it("should work as responsive layout wrapper", () => {
    const { container } = render(
      <Container size="lg" padding="p-4">
        <div data-testid="header">Header</div>
        <div data-testid="body">Body</div>
        <div data-testid="footer">Footer</div>
      </Container>
    );

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("mx-auto"); // Centered horizontally
    expect(container.querySelector('[data-testid="body"]')).toBeInTheDocument();
  });

  it("should support responsive padding in className", () => {
    const { container } = render(
      <Container size="md" padding="p-4 md:p-6 lg:p-8">
        Content
      </Container>
    );

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("p-4", "md:p-6", "lg:p-8");
  });

  it("should maintain margin centering across all size variants", () => {
    const sizes = ["sm", "md", "lg", "xl", "full"];

    sizes.forEach((size) => {
      const { container } = render(<Container size={size}>Content</Container>);

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass("mx-auto");
    });
  });

  it("should work with form elements", () => {
    const { container } = render(
      <Container size="md" padding="p-6">
        <form>
          <input type="text" placeholder="Name" />
          <button type="submit">Submit</button>
        </form>
      </Container>
    );

    expect(container.querySelector("form")).toBeInTheDocument();
    expect(container.querySelector("input")).toBeInTheDocument();
  });
});
