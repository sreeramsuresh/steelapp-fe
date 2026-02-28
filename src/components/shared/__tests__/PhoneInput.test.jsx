/**
 * PhoneInput Component Tests
 * Tests phone input with country selector, formatting, and validation
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PhoneInput from "../PhoneInput";

describe("PhoneInput", () => {
  it("renders without crashing", () => {
    const { container } = render(<PhoneInput />);
    expect(container).toBeTruthy();
  });

  it("renders with label", () => {
    render(<PhoneInput label="Phone Number" name="phone" />);
    expect(screen.getByText("Phone Number")).toBeInTheDocument();
  });

  it("renders required indicator when required", () => {
    render(<PhoneInput label="Phone" name="phone" required />);
    expect(screen.getByText("*")).toBeInTheDocument();
  });

  it("renders phone input element with tel type", () => {
    render(<PhoneInput label="Phone" name="phone" />);
    const input = screen.getByLabelText("Phone");
    expect(input).toHaveAttribute("type", "tel");
  });

  it("renders UAE country code by default", () => {
    render(<PhoneInput name="phone" />);
    expect(screen.getByText("AE")).toBeInTheDocument();
    expect(screen.getByText("+971")).toBeInTheDocument();
  });

  it("renders as disabled", () => {
    render(<PhoneInput label="Phone" name="phone" disabled />);
    expect(screen.getByLabelText("Phone")).toBeDisabled();
  });

  it("renders error message when error prop is provided", () => {
    render(<PhoneInput label="Phone" name="phone" error="Phone is required" />);
    expect(screen.getByText("Phone is required")).toBeInTheDocument();
  });

  it("renders placeholder from default country", () => {
    render(<PhoneInput name="phone" />);
    const input = screen.getByPlaceholderText("50 123 4567");
    expect(input).toBeInTheDocument();
  });
});
