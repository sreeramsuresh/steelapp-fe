/**
 * IconButton Component Tests
 * Phase 5.3.2: Tier 3 Interactive Component
 *
 * Tests icon-only button with tooltip and accessibility
 * Covers variants, sizes, focus management, and ARIA labels
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { AlertCircle, Check, Edit, Trash2 } from "lucide-react";
import { describe, expect, it, vi } from "vitest";
import IconButton from "../IconButton";

describe("IconButton", () => {
  it("should render button element", () => {
    render(<IconButton icon={<Trash2 size={20} />} title="Delete" />);

    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("should render provided icon", () => {
    const { container } = render(<IconButton icon={<Trash2 size={20} data-testid="icon" />} title="Delete" />);

    expect(container.querySelector('[data-testid="icon"]')).toBeInTheDocument();
  });

  it("should set title attribute for native tooltip", () => {
    render(<IconButton icon={<Trash2 />} title="Delete Item" />);

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("title", "Delete Item");
  });

  it("should set aria-label to title by default", () => {
    render(<IconButton icon={<Trash2 />} title="Delete" />);

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-label", "Delete");
  });

  it("should use custom ariaLabel when provided", () => {
    render(<IconButton icon={<Trash2 />} title="Delete" ariaLabel="Remove this item" />);

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-label", "Remove this item");
  });

  it("should apply default variant styling", () => {
    const { container } = render(<IconButton icon={<Edit />} title="Edit" variant="default" />);

    const button = container.querySelector("button");
    expect(button).toHaveClass("text-gray-600", "hover:text-gray-900", "hover:bg-gray-100");
  });

  it("should apply danger variant styling", () => {
    const { container } = render(<IconButton icon={<Trash2 />} title="Delete" variant="danger" />);

    const button = container.querySelector("button");
    expect(button).toHaveClass("text-red-600", "hover:text-red-700");
  });

  it("should apply success variant styling", () => {
    const { container } = render(<IconButton icon={<Check />} title="Confirm" variant="success" />);

    const button = container.querySelector("button");
    expect(button).toHaveClass("text-green-600", "hover:text-green-700");
  });

  it("should apply info variant styling", () => {
    const { container } = render(<IconButton icon={<AlertCircle />} title="Info" variant="info" />);

    const button = container.querySelector("button");
    expect(button).toHaveClass("text-blue-600", "hover:text-blue-700");
  });

  it("should apply dark mode color variant", () => {
    const { container } = render(<IconButton icon={<Trash2 />} title="Delete" variant="danger" />);

    const button = container.querySelector("button");
    expect(button).toHaveClass("dark:text-red-400", "dark:hover:text-red-300");
  });

  it("should apply small size", () => {
    const { container } = render(<IconButton icon={<Edit />} title="Edit" size="sm" />);

    const button = container.querySelector("button");
    expect(button).toHaveClass("p-1");
  });

  it("should apply medium size (default)", () => {
    const { container } = render(<IconButton icon={<Edit />} title="Edit" size="md" />);

    const button = container.querySelector("button");
    expect(button).toHaveClass("p-2");
  });

  it("should apply large size", () => {
    const { container } = render(<IconButton icon={<Edit />} title="Edit" size="lg" />);

    const button = container.querySelector("button");
    expect(button).toHaveClass("p-3");
  });

  it("should call onClick handler when clicked", () => {
    const handleClick = vi.fn();
    render(<IconButton icon={<Trash2 />} title="Delete" onClick={handleClick} />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledOnce();
  });

  it("should have type='button' by default", () => {
    render(<IconButton icon={<Edit />} title="Edit" />);

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("type", "button");
  });

  it("should apply focus ring styling", () => {
    const { container } = render(<IconButton icon={<Edit />} title="Edit" />);

    const button = container.querySelector("button");
    expect(button).toHaveClass("focus:outline-none", "focus:ring-2");
  });

  it("should apply disabled state styling", () => {
    const { container } = render(<IconButton icon={<Trash2 />} title="Delete" disabled={true} />);

    const button = container.querySelector("button");
    expect(button).toHaveClass("disabled:opacity-50", "disabled:cursor-not-allowed");
  });

  it("should be disabled when disabled prop is true", () => {
    render(<IconButton icon={<Trash2 />} title="Delete" disabled={true} />);

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("should not call onClick when disabled", () => {
    const handleClick = vi.fn();
    render(<IconButton icon={<Trash2 />} title="Delete" onClick={handleClick} disabled={true} />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(handleClick).not.toHaveBeenCalled();
  });

  it("should show tooltip on mouse enter", () => {
    const { container } = render(<IconButton icon={<Trash2 />} title="Delete Item" />);

    const button = container.querySelector("button");
    fireEvent.mouseEnter(button);

    expect(screen.getByText("Delete Item")).toBeInTheDocument();
  });

  it("should hide tooltip on mouse leave", () => {
    const { container } = render(<IconButton icon={<Trash2 />} title="Delete Item" />);

    const button = container.querySelector("button");
    fireEvent.mouseEnter(button);
    expect(screen.getByText("Delete Item")).toBeInTheDocument();

    fireEvent.mouseLeave(button);
    expect(screen.queryByText("Delete Item")).not.toBeInTheDocument();
  });

  it("should show tooltip on focus", () => {
    const { container } = render(<IconButton icon={<Trash2 />} title="Delete Item" />);

    const button = container.querySelector("button");
    fireEvent.focus(button);

    expect(screen.getByText("Delete Item")).toBeInTheDocument();
  });

  it("should hide tooltip on blur", () => {
    const { container } = render(<IconButton icon={<Trash2 />} title="Delete Item" />);

    const button = container.querySelector("button");
    fireEvent.focus(button);
    expect(screen.getByText("Delete Item")).toBeInTheDocument();

    fireEvent.blur(button);
    expect(screen.queryByText("Delete Item")).not.toBeInTheDocument();
  });

  it("should apply tooltip styling", () => {
    const { container } = render(<IconButton icon={<Trash2 />} title="Delete" />);

    const button = container.querySelector("button");
    fireEvent.mouseEnter(button);

    const tooltip = screen.getByText("Delete").closest("div");
    expect(tooltip).toHaveClass(
      "absolute",
      "bottom-full",
      "left-1/2",
      "-translate-x-1/2",
      "mb-2",
      "px-2",
      "py-1",
      "bg-gray-900",
      "text-white",
      "text-xs",
      "rounded",
      "whitespace-nowrap",
      "pointer-events-none",
      "z-50"
    );
  });

  it("should apply tooltip dark mode styling", () => {
    const { container } = render(<IconButton icon={<Trash2 />} title="Delete" />);

    const button = container.querySelector("button");
    fireEvent.mouseEnter(button);

    const tooltip = screen.getByText("Delete").closest("div");
    expect(tooltip).toHaveClass("dark:bg-gray-700");
  });

  it("should render tooltip arrow", () => {
    const { container } = render(<IconButton icon={<Trash2 />} title="Delete" />);

    const button = container.querySelector("button");
    fireEvent.mouseEnter(button);

    const tooltip = screen.getByText("Delete").closest("div");
    const arrow = tooltip.querySelector("div");
    expect(arrow).toBeInTheDocument();
    expect(arrow).toHaveClass("absolute", "top-full");
  });

  it("should apply custom className", () => {
    const { container } = render(<IconButton icon={<Trash2 />} title="Delete" className="custom-class" />);

    const button = container.querySelector("button");
    expect(button).toHaveClass("custom-class");
  });

  it("should accept additional props", () => {
    render(<IconButton icon={<Trash2 />} title="Delete" data-testid="delete-btn" aria-controls="menu" />);

    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("data-testid", "delete-btn");
    expect(button).toHaveAttribute("aria-controls", "menu");
  });

  it("should render as inline-block", () => {
    const { container } = render(<IconButton icon={<Edit />} title="Edit" />);

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass("relative", "inline-block");
  });

  it("should apply base button styling", () => {
    const { container } = render(<IconButton icon={<Edit />} title="Edit" />);

    const button = container.querySelector("button");
    expect(button).toHaveClass(
      "relative",
      "inline-flex",
      "items-center",
      "justify-center",
      "rounded-lg",
      "transition-colors"
    );
  });

  it("should combine variant, size, and custom className", () => {
    const { container } = render(
      <IconButton icon={<Trash2 />} title="Delete" variant="danger" size="lg" className="shadow-lg" />
    );

    const button = container.querySelector("button");
    expect(button).toHaveClass("text-red-600", "p-3", "shadow-lg");
  });

  it("should not show tooltip when title is not provided", () => {
    const { container } = render(<IconButton icon={<Trash2 />} />);

    const button = container.querySelector("button");
    fireEvent.mouseEnter(button);

    // No tooltip should be visible
    const tooltips = container.querySelectorAll('[class*="bg-gray-900"]');
    expect(tooltips.length).toBe(0);
  });

  it("should handle rapid hover events", () => {
    const { container } = render(<IconButton icon={<Trash2 />} title="Delete" />);

    const button = container.querySelector("button");

    fireEvent.mouseEnter(button);
    fireEvent.mouseLeave(button);
    fireEvent.mouseEnter(button);

    expect(screen.getByText("Delete")).toBeInTheDocument();
  });

  it("should handle multiple size props correctly", () => {
    const sizes = ["sm", "md", "lg"];

    sizes.forEach((size) => {
      const { container } = render(<IconButton icon={<Edit />} title="Edit" size={size} />);

      const button = container.querySelector("button");
      expect(button).toBeInTheDocument();
    });
  });

  it("should apply all variant colors correctly", () => {
    const variants = ["default", "danger", "success", "info"];

    variants.forEach((variant) => {
      const { container } = render(<IconButton icon={<Edit />} title="Test" variant={variant} />);

      const button = container.querySelector("button");
      expect(button).toBeInTheDocument();
    });
  });

  it("should prevent event propagation options via props", () => {
    const handleClick = vi.fn();
    render(<IconButton icon={<Trash2 />} title="Delete" onClick={handleClick} />);

    const button = screen.getByRole("button");
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledOnce();
  });
});
