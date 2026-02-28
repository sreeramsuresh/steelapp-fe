import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import PeriodCard from "../PeriodCard";

const basePeriod = {
  periodType: "MONTHLY",
  year: 2025,
  month: 6,
  status: "OPEN",
  startDate: "2025-06-01",
  endDate: "2025-06-30",
};

describe("PeriodCard", () => {
  it("renders period label for MONTHLY type", () => {
    render(<PeriodCard period={basePeriod} />);
    expect(screen.getByText("June 2025")).toBeInTheDocument();
  });

  it("renders period label for QUARTERLY type", () => {
    const period = { ...basePeriod, periodType: "QUARTERLY", month: 3 };
    render(<PeriodCard period={period} />);
    expect(screen.getByText("Q1 2025")).toBeInTheDocument();
  });

  it("renders period label for YEARLY type", () => {
    const period = { ...basePeriod, periodType: "YEARLY" };
    render(<PeriodCard period={period} />);
    expect(screen.getByText("2025")).toBeInTheDocument();
  });

  it("shows Close Period button for OPEN status", () => {
    render(<PeriodCard period={basePeriod} />);
    expect(screen.getByText("Close Period")).toBeInTheDocument();
  });

  it("shows Lock Period button for REVIEW status", () => {
    const period = { ...basePeriod, status: "REVIEW" };
    render(<PeriodCard period={period} />);
    expect(screen.getByText("Lock Period")).toBeInTheDocument();
  });

  it("shows View Data button for non-OPEN statuses", () => {
    const period = { ...basePeriod, status: "LOCKED" };
    render(<PeriodCard period={period} />);
    expect(screen.getByText("View Data")).toBeInTheDocument();
  });

  it("does not show View Data for OPEN status", () => {
    render(<PeriodCard period={basePeriod} />);
    expect(screen.queryByText("View Data")).not.toBeInTheDocument();
  });

  it("calls onClose when Close Period clicked", () => {
    const onClose = vi.fn();
    render(<PeriodCard period={basePeriod} onClose={onClose} />);
    screen.getByText("Close Period").click();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("disables Close button when isClosing", () => {
    render(<PeriodCard period={basePeriod} isClosing={true} />);
    expect(screen.getByText("Closing...")).toBeInTheDocument();
  });

  it("shows period hash when present", () => {
    const period = { ...basePeriod, periodHash: "abc123def456" };
    render(<PeriodCard period={period} />);
    expect(screen.getByText("abc123def456")).toBeInTheDocument();
  });

  it("shows locked date when present", () => {
    const period = { ...basePeriod, status: "LOCKED", lockedAt: "2025-07-01" };
    render(<PeriodCard period={period} />);
    expect(screen.getByText("Locked At")).toBeInTheDocument();
  });

  it("supports snake_case field names", () => {
    const period = {
      period_type: "MONTHLY",
      period_year: 2025,
      period_month: 3,
      status: "OPEN",
      period_start_date: "2025-03-01",
      period_end_date: "2025-03-31",
    };
    render(<PeriodCard period={period} />);
    expect(screen.getByText("March 2025")).toBeInTheDocument();
  });
});
