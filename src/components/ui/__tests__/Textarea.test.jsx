import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";
import { Textarea } from "../textarea";

describe("Textarea", () => {
  it("renders a textarea element", () => {
    render(<Textarea data-testid="ta" />);
    expect(screen.getByTestId("ta").tagName).toBe("TEXTAREA");
  });

  it("applies placeholder", () => {
    render(<Textarea placeholder="Enter text" />);
    expect(screen.getByPlaceholderText("Enter text")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<Textarea data-testid="ta" className="custom" />);
    expect(screen.getByTestId("ta")).toHaveClass("custom");
  });

  it("handles value changes", () => {
    const { getByTestId } = render(<Textarea data-testid="ta" />);
    fireEvent.change(getByTestId("ta"), { target: { value: "Hello" } });
    expect(getByTestId("ta").value).toBe("Hello");
  });

  it("supports disabled state", () => {
    render(<Textarea data-testid="ta" disabled />);
    expect(screen.getByTestId("ta")).toBeDisabled();
  });

  it("forwards ref", () => {
    const ref = React.createRef();
    render(<Textarea ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLTextAreaElement);
  });
});
