/**
 * StatusBadge Component Tests
 * Phase 5.3.2: Shared Component
 *
 * Tests status badge with variants and sizes (Bug #21 fix)
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import StatusBadge from "../StatusBadge";

describe("StatusBadge", () => {
  it("should render status text", () => {
    render(<StatusBadge status="ACTIVE" variant="active" />);

    expect(screen.getByText("ACTIVE")).toBeInTheDocument();
  });

  it("should apply default variant styles", () => {
    const { container } = render(<StatusBadge status="DEFAULT" variant="draft" />);

    const badge = container.firstChild;
    expect(badge).toHaveClass("inline-flex", "rounded-full", "font-medium", "border");
  });

  it("should apply draft variant styling", () => {
    const { container } = render(<StatusBadge status="DRAFT" variant="draft" />);

    const badge = container.firstChild;
    expect(badge).toHaveClass("bg-gray-100", "text-gray-800");
  });

  it("should apply active variant styling", () => {
    const { container } = render(<StatusBadge status="ACTIVE" variant="active" />);

    const badge = container.firstChild;
    expect(badge).toHaveClass("bg-green-100", "text-green-800");
  });

  it("should apply inactive variant styling", () => {
    const { container } = render(<StatusBadge status="INACTIVE" variant="inactive" />);

    const badge = container.firstChild;
    expect(badge).toHaveClass("bg-gray-100", "text-gray-800");
  });

  it("should apply pending variant styling", () => {
    const { container } = render(<StatusBadge status="PENDING" variant="pending" />);

    const badge = container.firstChild;
    expect(badge).toHaveClass("bg-yellow-100", "text-yellow-800");
  });

  it("should apply success variant styling", () => {
    const { container } = render(<StatusBadge status="SUCCESS" variant="success" />);

    const badge = container.firstChild;
    expect(badge).toHaveClass("bg-green-100", "text-green-800");
  });

  it("should apply danger variant styling", () => {
    const { container } = render(<StatusBadge status="FAILED" variant="danger" />);

    const badge = container.firstChild;
    expect(badge).toHaveClass("bg-red-100", "text-red-800");
  });

  it("should apply warning variant styling", () => {
    const { container } = render(<StatusBadge status="WARNING" variant="warning" />);

    const badge = container.firstChild;
    expect(badge).toHaveClass("bg-orange-100", "text-orange-800");
  });

  it("should apply info variant styling", () => {
    const { container } = render(<StatusBadge status="INFO" variant="info" />);

    const badge = container.firstChild;
    expect(badge).toHaveClass("bg-blue-100", "text-blue-800");
  });

  it("should apply small size styling", () => {
    const { container } = render(<StatusBadge status="DRAFT" variant="draft" size="sm" />);

    const badge = container.firstChild;
    expect(badge).toHaveClass("px-2", "py-0.5", "text-xs");
  });

  it("should apply medium size styling (default)", () => {
    const { container } = render(<StatusBadge status="ACTIVE" variant="active" size="md" />);

    const badge = container.firstChild;
    expect(badge).toHaveClass("px-2.5", "py-1", "text-sm");
  });

  it("should apply large size styling", () => {
    const { container } = render(<StatusBadge status="SUCCESS" variant="success" size="lg" />);

    const badge = container.firstChild;
    expect(badge).toHaveClass("px-3", "py-1.5", "text-base");
  });

  it("should apply custom className", () => {
    const { container } = render(<StatusBadge status="ACTIVE" variant="active" className="custom-class" />);

    const badge = container.firstChild;
    expect(badge).toHaveClass("custom-class");
  });

  it("should apply dark mode styles for draft", () => {
    const { container } = render(<StatusBadge status="DRAFT" variant="draft" />);

    const badge = container.firstChild;
    expect(badge).toHaveClass("dark:bg-gray-900/30", "dark:text-gray-300");
  });

  it("should apply dark mode styles for active", () => {
    const { container } = render(<StatusBadge status="ACTIVE" variant="active" />);

    const badge = container.firstChild;
    expect(badge).toHaveClass("dark:bg-green-900/30", "dark:text-green-300");
  });

  it("should apply dark mode styles for danger", () => {
    const { container } = render(<StatusBadge status="ERROR" variant="danger" />);

    const badge = container.firstChild;
    expect(badge).toHaveClass("dark:bg-red-900/30", "dark:text-red-300");
  });

  it("should handle uppercase and lowercase status text", () => {
    const { rerender } = render(<StatusBadge status="Active" variant="active" />);

    expect(screen.getByText("Active")).toBeInTheDocument();

    rerender(<StatusBadge status="INACTIVE" variant="inactive" />);

    expect(screen.getByText("INACTIVE")).toBeInTheDocument();
  });

  it("should combine multiple variants and sizes", () => {
    const { container } = render(<StatusBadge status="PENDING" variant="warning" size="lg" />);

    const badge = container.firstChild;
    expect(badge).toHaveClass("bg-orange-100", "text-orange-800", "px-3", "py-1.5");
  });

  it("should handle special status text", () => {
    render(<StatusBadge status="AWAITING_APPROVAL" variant="pending" />);

    expect(screen.getByText("AWAITING_APPROVAL")).toBeInTheDocument();
  });

  it("should render with status and variant props", () => {
    render(<StatusBadge status="TEST" variant="info" />);

    expect(screen.getByText("TEST")).toBeInTheDocument();
  });
});
