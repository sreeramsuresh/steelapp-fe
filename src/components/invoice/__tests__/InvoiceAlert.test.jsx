import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "../../../contexts/ThemeContext";
import Alert from "../InvoiceAlert";

function renderWithTheme(ui) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe("InvoiceAlert", () => {
  it("renders children content", () => {
    renderWithTheme(<Alert>Test message</Alert>);
    expect(screen.getByText("Test message")).toBeInTheDocument();
  });

  it("defaults to info variant", () => {
    const { container } = renderWithTheme(<Alert>Info</Alert>);
    expect(container.innerHTML).toContain("blue");
  });

  it("renders warning variant", () => {
    const { container } = renderWithTheme(<Alert variant="warning">Warn</Alert>);
    expect(container.innerHTML).toContain("yellow");
  });

  it("renders error variant", () => {
    const { container } = renderWithTheme(<Alert variant="error">Error</Alert>);
    expect(container.innerHTML).toContain("red");
  });

  it("renders success variant", () => {
    const { container } = renderWithTheme(<Alert variant="success">OK</Alert>);
    expect(container.innerHTML).toContain("green");
  });

  it("shows close button when onClose provided", () => {
    const onClose = vi.fn();
    renderWithTheme(<Alert onClose={onClose}>Closable</Alert>);
    const btn = screen.getByRole("button");
    btn.click();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("hides close button when no onClose", () => {
    renderWithTheme(<Alert>No close</Alert>);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("applies custom className", () => {
    const { container } = renderWithTheme(<Alert className="my-custom">Styled</Alert>);
    expect(container.innerHTML).toContain("my-custom");
  });
});
