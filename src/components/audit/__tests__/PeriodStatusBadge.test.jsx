import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PeriodStatusBadge from "../PeriodStatusBadge";

describe("PeriodStatusBadge", () => {
  it("renders Open label for OPEN status", () => {
    render(<PeriodStatusBadge status="OPEN" />);
    expect(screen.getByText("Open")).toBeInTheDocument();
  });

  it("renders In Review label for REVIEW status", () => {
    render(<PeriodStatusBadge status="REVIEW" />);
    expect(screen.getByText("In Review")).toBeInTheDocument();
  });

  it("renders Locked label for LOCKED status", () => {
    render(<PeriodStatusBadge status="LOCKED" />);
    expect(screen.getByText("Locked")).toBeInTheDocument();
  });

  it("renders Finalized label for FINALIZED status", () => {
    render(<PeriodStatusBadge status="FINALIZED" />);
    expect(screen.getByText("Finalized")).toBeInTheDocument();
  });

  it("renders Amended label for AMENDED status", () => {
    render(<PeriodStatusBadge status="AMENDED" />);
    expect(screen.getByText("Amended")).toBeInTheDocument();
  });

  it("falls back to Open for unknown status", () => {
    render(<PeriodStatusBadge status="UNKNOWN_STATUS" />);
    expect(screen.getByText("Open")).toBeInTheDocument();
  });
});
