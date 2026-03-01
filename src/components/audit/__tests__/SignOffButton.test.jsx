import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SignOffButton from "../SignOffButton";

describe("SignOffButton", () => {
  it("renders disabled button when canUserSignOff is false", () => {
    render(<SignOffButton stage="PREPARED" label="Sign Off" canUserSignOff={false} />);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("title", expect.stringContaining("don't have permission"));
  });

  it("renders enabled button when canUserSignOff is true", () => {
    render(<SignOffButton stage="PREPARED" label="Sign Off" canUserSignOff={true} onClick={vi.fn()} />);
    const button = screen.getByRole("button");
    expect(button).not.toBeDisabled();
    expect(screen.getByText("Sign Off")).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    render(<SignOffButton stage="PREPARED" label="Sign Off" canUserSignOff={true} onClick={onClick} />);
    screen.getByRole("button").click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("shows loading state", () => {
    render(<SignOffButton stage="PREPARED" label="Sign Off" canUserSignOff={true} loading={true} />);
    expect(screen.getByText("Signing off...")).toBeInTheDocument();
  });

  it("is disabled when loading", () => {
    render(<SignOffButton stage="PREPARED" label="Sign Off" canUserSignOff={true} loading={true} />);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("is disabled when disabled prop is true", () => {
    render(<SignOffButton stage="PREPARED" label="Sign Off" canUserSignOff={true} disabled={true} />);
    expect(screen.getByRole("button")).toBeDisabled();
  });
});
