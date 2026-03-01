import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CardSkeleton, FormSkeleton, ListSkeleton, Skeleton, TableSkeleton } from "../Skeleton";

describe("Skeleton components", () => {
  describe("Skeleton", () => {
    it("renders a pulsing div", () => {
      const { container } = render(<Skeleton />);
      expect(container.firstChild).toHaveClass("animate-pulse");
    });

    it("applies custom width and height", () => {
      const { container } = render(<Skeleton width="w-1/2" height="h-8" />);
      expect(container.firstChild).toHaveClass("w-1/2");
      expect(container.firstChild).toHaveClass("h-8");
    });

    it("applies custom className", () => {
      const { container } = render(<Skeleton className="my-custom" />);
      expect(container.firstChild).toHaveClass("my-custom");
    });
  });

  describe("TableSkeleton", () => {
    it("renders specified number of rows", () => {
      const { container } = render(<TableSkeleton rows={3} cols={2} />);
      const rows = container.querySelectorAll(".flex.gap-4");
      expect(rows).toHaveLength(3);
    });
  });

  describe("CardSkeleton", () => {
    it("renders card skeleton with skeleton lines", () => {
      const { container } = render(<CardSkeleton />);
      expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
    });
  });

  describe("ListSkeleton", () => {
    it("renders specified number of items", () => {
      const { container } = render(<ListSkeleton items={4} />);
      const items = container.querySelectorAll(".rounded-lg");
      expect(items).toHaveLength(4);
    });
  });

  describe("FormSkeleton", () => {
    it("renders form skeleton with input placeholders", () => {
      const { container } = render(<FormSkeleton />);
      expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
    });
  });
});
