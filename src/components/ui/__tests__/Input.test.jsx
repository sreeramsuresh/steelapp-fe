import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Input } from "../Input";

describe("Input", () => {
  it("should render input", () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText("Enter text")).toBeInTheDocument();
  });

  it("should accept value", () => {
    render(<Input value="hello" readOnly />);
    expect(screen.getByDisplayValue("hello")).toBeInTheDocument();
  });

  it("should handle change", () => {
    const onChange = vi.fn();
    render(<Input onChange={onChange} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "new" } });
    expect(onChange).toHaveBeenCalled();
  });

  it("should validate input", () => {
    render(<Input type="email" required />);
    const input = screen.getByRole("textbox");
    expect(input).toHaveAttribute("type", "email");
    expect(input).toBeRequired();
  });
});
