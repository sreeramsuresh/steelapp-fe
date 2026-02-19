/**
 * NewBadge Component Tests
 * Phase 5.3.2: Tier 3 Utility Component
 *
 * Tests "NEW" badge display for recently created records
 * Covers timestamp parsing, dark mode, and conditional rendering
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import NewBadge, { isNewRecord } from "../NewBadge";

describe("NewBadge - isNewRecord Utility", () => {
  it("should return false for null/undefined createdAt", () => {
    expect(isNewRecord(null)).toBe(false);
    expect(isNewRecord(undefined)).toBe(false);
  });

  it("should return true for ISO string within threshold", () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    expect(isNewRecord(oneHourAgo, 2)).toBe(true);
  });

  it("should return false for ISO string outside threshold", () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    expect(isNewRecord(threeHoursAgo, 2)).toBe(false);
  });

  it("should handle Date objects correctly", () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    expect(isNewRecord(oneHourAgo, 2)).toBe(true);
  });

  it("should handle Firestore-style timestamp objects", () => {
    const oneHourAgoSeconds = Math.floor((Date.now() - 60 * 60 * 1000) / 1000);
    const firestoreTimestamp = { seconds: oneHourAgoSeconds, nanos: 0 };
    expect(isNewRecord(firestoreTimestamp, 2)).toBe(true);
  });

  it("should return false for NaN timestamps", () => {
    expect(isNewRecord("invalid-date")).toBe(false);
    expect(isNewRecord({})).toBe(false);
  });

  it("should respect custom hoursThreshold parameter", () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    expect(isNewRecord(twoHoursAgo, 1)).toBe(false); // Outside 1-hour threshold
    expect(isNewRecord(twoHoursAgo, 3)).toBe(true); // Inside 3-hour threshold
  });

  it("should use default 2-hour threshold", () => {
    const oneDotNineHoursAgo = new Date(Date.now() - 1.9 * 60 * 60 * 1000).toISOString();
    expect(isNewRecord(oneDotNineHoursAgo)).toBe(true); // Default is 2 hours
  });
});

describe("NewBadge Component", () => {
  it("should render null when createdAt is not recent", () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
    const { container } = render(<NewBadge createdAt={threeHoursAgo} />);

    expect(container.firstChild).toBeNull();
  });

  it("should render NEW text when within threshold", () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    render(<NewBadge createdAt={oneHourAgo} />);

    expect(screen.getByText("NEW")).toBeInTheDocument();
  });

  it("should have NEW styling classes", () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const { container } = render(<NewBadge createdAt={oneHourAgo} />);

    const badge = container.querySelector("span");
    expect(badge).toHaveClass("text-teal-700", "font-semibold", "uppercase");
  });

  it("should apply dark mode styling", () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const { container } = render(<NewBadge createdAt={oneHourAgo} />);

    const badge = container.querySelector("span");
    expect(badge).toHaveClass("dark:text-teal-400");
  });

  it("should accept custom className prop", () => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const { container } = render(<NewBadge createdAt={oneHourAgo} className="custom-class" />);

    const badge = container.querySelector("span");
    expect(badge).toHaveClass("custom-class");
  });

  it("should work with ISO string timestamps", () => {
    const oneHourAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    render(<NewBadge createdAt={oneHourAgo} hoursThreshold={2} />);

    expect(screen.getByText("NEW")).toBeInTheDocument();
  });

  it("should handle custom hoursThreshold prop", () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000 - 5 * 60 * 1000);

    const { rerender } = render(<NewBadge createdAt={twoHoursAgo} hoursThreshold={2} />);
    expect(screen.queryByText("NEW")).not.toBeInTheDocument();

    rerender(<NewBadge createdAt={twoHoursAgo} hoursThreshold={3} />);
    expect(screen.getByText("NEW")).toBeInTheDocument();
  });

  it("should handle Firestore timestamp objects", () => {
    const oneHourAgoSeconds = Math.floor((Date.now() - 30 * 60 * 1000) / 1000);
    const firestoreTimestamp = { seconds: oneHourAgoSeconds, nanos: 0 };

    render(<NewBadge createdAt={firestoreTimestamp} />);
    expect(screen.getByText("NEW")).toBeInTheDocument();
  });

  it("should render null when createdAt is null", () => {
    const { container } = render(<NewBadge createdAt={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("should render null when createdAt is undefined", () => {
    const { container } = render(<NewBadge />);
    expect(container.firstChild).toBeNull();
  });

  it("should have proper spacing applied", () => {
    const now = new Date();
    const { container } = render(<NewBadge createdAt={now} />);

    const badge = container.querySelector("span");
    expect(badge).toHaveClass("ml-1.5");
  });

  it("should use text sizing for badge", () => {
    const now = new Date();
    const { container } = render(<NewBadge createdAt={now} />);

    const badge = container.querySelector("span");
    expect(badge).toHaveClass("text-[0.625rem]", "tracking-wide");
  });

  it("should combine custom className with default classes", () => {
    const now = new Date();
    const { container } = render(<NewBadge createdAt={now} className="extra" />);

    const badge = container.querySelector("span");
    expect(badge).toHaveClass("text-teal-700", "extra");
  });
});
