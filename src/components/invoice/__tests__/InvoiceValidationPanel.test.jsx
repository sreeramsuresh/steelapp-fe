import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import InvoiceValidationPanel from "../InvoiceValidationPanel";

describe("InvoiceValidationPanel", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    criticalIssues: [],
    warnings: [],
    isDarkMode: false,
    onProceed: vi.fn(),
    isLoading: false,
  };

  it("returns null when not open", () => {
    const { container } = render(<InvoiceValidationPanel {...defaultProps} isOpen={false} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders header when open", () => {
    render(<InvoiceValidationPanel {...defaultProps} />);
    expect(screen.getByText("Invoice Validation")).toBeInTheDocument();
  });

  it("shows ready state when no issues or warnings", () => {
    render(<InvoiceValidationPanel {...defaultProps} />);
    expect(screen.getByText("Ready to Finalize")).toBeInTheDocument();
  });

  it("shows critical issues section", () => {
    const issues = [{ type: "price", message: "Missing price for item A" }];
    render(<InvoiceValidationPanel {...defaultProps} criticalIssues={issues} />);
    expect(screen.getByText("Cannot Finalize - Fix These Issues First")).toBeInTheDocument();
    expect(screen.getByText("Missing price for item A")).toBeInTheDocument();
  });

  it("disables Finalize button when critical issues exist", () => {
    const issues = [{ type: "price", message: "No price" }];
    render(<InvoiceValidationPanel {...defaultProps} criticalIssues={issues} />);
    expect(screen.getByText("Finalize Invoice")).toBeDisabled();
  });

  it("shows warnings section", () => {
    const warnings = [{ type: "default", message: "Using default price" }];
    render(<InvoiceValidationPanel {...defaultProps} warnings={warnings} />);
    expect(screen.getByText("Review These Warnings")).toBeInTheDocument();
    expect(screen.getByText("Using default price")).toBeInTheDocument();
  });

  it("enables Finalize after acknowledging warnings", () => {
    const warnings = [{ type: "default", message: "Using default price" }];
    render(<InvoiceValidationPanel {...defaultProps} warnings={warnings} />);
    // Initially disabled
    expect(screen.getByText("Finalize Invoice")).toBeDisabled();
    // Acknowledge checkbox
    screen.getByRole("checkbox").click();
    expect(screen.getByText("Finalize Invoice")).not.toBeDisabled();
  });

  it("calls onClose when Cancel clicked", () => {
    render(<InvoiceValidationPanel {...defaultProps} />);
    screen.getByText("Cancel").click();
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("shows Processing text when loading", () => {
    render(<InvoiceValidationPanel {...defaultProps} isLoading={true} />);
    expect(screen.getByText("Processing...")).toBeInTheDocument();
  });
});
