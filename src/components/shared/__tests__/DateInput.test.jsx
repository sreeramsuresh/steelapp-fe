/**
 * DateInput Component Tests
 * Tests accessible date input with label, validation, and required indicator
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DateInput from "../DateInput";

describe("DateInput", () => {
  it("renders without crashing", () => {
    const { container } = render(<DateInput />);
    expect(container).toBeTruthy();
  });

  it("renders with label", () => {
    render(<DateInput label="Invoice Date" name="invoiceDate" />);
    expect(screen.getByText("Invoice Date")).toBeInTheDocument();
  });

  it("renders date input element", () => {
    render(<DateInput label="Due Date" name="dueDate" />);
    const input = screen.getByLabelText("Due Date");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("type", "date");
  });

  it("renders required indicator when required", () => {
    render(<DateInput label="Start Date" name="startDate" required />);
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("does not render required indicator when not required", () => {
    render(<DateInput label="End Date" name="endDate" />);
    expect(screen.queryByText("*")).not.toBeInTheDocument();
  });

  it("renders with value", () => {
    render(<DateInput label="Date" name="date" value="2025-01-15" onChange={vi.fn()} />);
    const input = screen.getByLabelText("Date");
    expect(input).toHaveValue("2025-01-15");
  });

  it("renders error message when error prop is provided", () => {
    render(<DateInput label="Date" name="date" error="Date is required" />);
    expect(screen.getByText("Date is required")).toBeInTheDocument();
  });

  it("renders help text when provided and no error", () => {
    render(<DateInput label="Date" name="date" helpText="Select a valid date" />);
    expect(screen.getByText(/Select a valid date/)).toBeInTheDocument();
  });

  it("does not render help text when error is present", () => {
    render(<DateInput label="Date" name="date" helpText="Help" error="Error" />);
    expect(screen.queryByText(/Help/)).not.toBeInTheDocument();
    expect(screen.getByText("Error")).toBeInTheDocument();
  });

  it("renders as disabled", () => {
    render(<DateInput label="Date" name="date" disabled />);
    expect(screen.getByLabelText("Date")).toBeDisabled();
  });

  it("applies min and max attributes", () => {
    render(<DateInput label="Date" name="date" min="2025-01-01" max="2025-12-31" />);
    const input = screen.getByLabelText("Date");
    expect(input).toHaveAttribute("min", "2025-01-01");
    expect(input).toHaveAttribute("max", "2025-12-31");
  });
});
