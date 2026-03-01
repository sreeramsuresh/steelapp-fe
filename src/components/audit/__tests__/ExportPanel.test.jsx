import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ExportPanel from "../ExportPanel";

// Mock dependencies
vi.mock("react-hot-toast", () => ({
  default: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("../../../services/auditHubService", () => ({
  default: {
    generateExcelExport: vi.fn().mockResolvedValue({}),
  },
}));

describe("ExportPanel", () => {
  const defaultProps = {
    datasetId: 1,
    onExportGenerated: vi.fn(),
    onVerifyRegeneration: vi.fn(),
    verifying: false,
    exportStatus: {},
  };

  it("renders all three export types", () => {
    render(<ExportPanel {...defaultProps} />);
    expect(screen.getByText("Excel Workbook")).toBeInTheDocument();
    expect(screen.getByText("PDF Report")).toBeInTheDocument();
    expect(screen.getByText("CSV Data")).toBeInTheDocument();
  });

  it("renders generate buttons for each type", () => {
    render(<ExportPanel {...defaultProps} />);
    const generateButtons = screen.getAllByText("Generate");
    expect(generateButtons).toHaveLength(3);
  });

  it("renders verify buttons (disabled when no status)", () => {
    render(<ExportPanel {...defaultProps} />);
    const verifyButtons = screen.getAllByText("Verify");
    expect(verifyButtons).toHaveLength(3);
    verifyButtons.forEach((btn) => {
      expect(btn.closest("button")).toBeDisabled();
    });
  });

  it("shows deterministic verified when export status is deterministic", () => {
    render(<ExportPanel {...defaultProps} exportStatus={{ EXCEL: { is_deterministic: true } }} />);
    expect(screen.getByText("Deterministic verified")).toBeInTheDocument();
  });

  it("shows hash mismatch when export status is not deterministic", () => {
    render(<ExportPanel {...defaultProps} exportStatus={{ PDF: { is_deterministic: false } }} />);
    expect(screen.getByText("Hash mismatch!")).toBeInTheDocument();
  });

  it("shows FIX 4 explanation", () => {
    render(<ExportPanel {...defaultProps} />);
    expect(screen.getByText(/Deterministic Snapshots/)).toBeInTheDocument();
  });

  it("disables generate buttons when verifying", () => {
    render(<ExportPanel {...defaultProps} verifying={true} />);
    const buttons = screen.getAllByText("Generate");
    buttons.forEach((btn) => {
      expect(btn.closest("button")).toBeDisabled();
    });
  });
});
