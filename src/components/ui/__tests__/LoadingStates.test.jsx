import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import {
  Spinner,
  PulsingDots,
  Skeleton,
  TableRowSkeleton,
  CardSkeleton,
  PageLoader,
  InlineLoader,
  ProgressBar,
  SavingIndicator,
} from "../LoadingStates";

describe("LoadingStates", () => {
  describe("Spinner", () => {
    it("renders SVG spinner", () => {
      const { container } = render(<Spinner />);
      expect(container.querySelector("svg")).toBeInTheDocument();
    });

    it("applies size class", () => {
      const { container } = render(<Spinner size="lg" />);
      expect(container.querySelector("svg")).toHaveClass("w-8");
    });
  });

  describe("PulsingDots", () => {
    it("renders three dots", () => {
      const { container } = render(<PulsingDots />);
      expect(container.querySelectorAll(".rounded-full")).toHaveLength(3);
    });
  });

  describe("Skeleton", () => {
    it("renders with default full width", () => {
      const { container } = render(<Skeleton />);
      expect(container.firstChild).toHaveClass("w-full");
    });

    it("renders with numeric width", () => {
      const { container } = render(<Skeleton width={200} />);
      expect(container.firstChild.style.width).toBe("200px");
    });
  });

  describe("TableRowSkeleton", () => {
    it("renders specified number of columns", () => {
      const { container } = render(
        <table>
          <tbody>
            <TableRowSkeleton columns={3} />
          </tbody>
        </table>
      );
      expect(container.querySelectorAll("td")).toHaveLength(3);
    });
  });

  describe("CardSkeleton", () => {
    it("renders skeleton card", () => {
      const { container } = render(<CardSkeleton />);
      expect(container.querySelector(".rounded-lg")).toBeInTheDocument();
    });
  });

  describe("PageLoader", () => {
    it("renders message", () => {
      render(<PageLoader message="Please wait..." />);
      expect(screen.getByText("Please wait...")).toBeInTheDocument();
    });

    it("uses default message", () => {
      render(<PageLoader />);
      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });
  });

  describe("InlineLoader", () => {
    it("renders inline loader with message", () => {
      render(<InlineLoader message="Fetching data..." />);
      expect(screen.getByText("Fetching data...")).toBeInTheDocument();
    });
  });

  describe("ProgressBar", () => {
    it("renders progress bar with correct aria value", () => {
      render(<ProgressBar progress={75} />);
      expect(screen.getByRole("progressbar")).toHaveAttribute(
        "aria-valuenow",
        "75"
      );
    });

    it("shows percentage text", () => {
      render(<ProgressBar progress={42} />);
      expect(screen.getByText("42%")).toBeInTheDocument();
    });

    it("hides percentage when showPercentage is false", () => {
      render(<ProgressBar progress={42} showPercentage={false} />);
      expect(screen.queryByText("42%")).not.toBeInTheDocument();
    });
  });

  describe("SavingIndicator", () => {
    it("shows idle state", () => {
      render(<SavingIndicator status="idle" />);
      expect(screen.getByText("Not saved")).toBeInTheDocument();
    });

    it("shows saving state", () => {
      render(<SavingIndicator status="saving" />);
      expect(screen.getByText("Saving...")).toBeInTheDocument();
    });

    it("shows saved state", () => {
      render(<SavingIndicator status="saved" />);
      expect(screen.getByText("Saved")).toBeInTheDocument();
    });

    it("shows error state", () => {
      render(<SavingIndicator status="error" />);
      expect(screen.getByText("Error saving")).toBeInTheDocument();
    });

    it("shows last saved time in idle", () => {
      render(<SavingIndicator status="idle" lastSaved="5 min ago" />);
      expect(screen.getByText("Last saved 5 min ago")).toBeInTheDocument();
    });
  });
});
