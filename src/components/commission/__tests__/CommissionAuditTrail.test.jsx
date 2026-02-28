import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import CommissionAuditTrail from "../CommissionAuditTrail";
import { ThemeProvider } from "../../../contexts/ThemeContext";

// Mock dependencies
vi.mock("../../../services/commissionService", () => ({
  commissionService: {
    getCommissionAuditTrail: vi.fn().mockResolvedValue({ auditEntries: [] }),
  },
}));

vi.mock("../../../services/notificationService", () => ({
  notificationService: { error: vi.fn() },
}));

vi.mock("../../../utils/invoiceUtils", () => ({
  formatCurrency: vi.fn((v) => `AED ${v}`),
  formatDate: vi.fn((d) => d),
}));

import { commissionService } from "../../../services/commissionService";

function renderWithTheme(ui) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe("CommissionAuditTrail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders expandable audit trail header", () => {
    renderWithTheme(<CommissionAuditTrail invoiceId={1} />);
    expect(screen.getByText("Audit Trail")).toBeInTheDocument();
  });

  it("shows empty state when no entries", async () => {
    commissionService.getCommissionAuditTrail.mockResolvedValue({
      auditEntries: [],
    });
    renderWithTheme(
      <CommissionAuditTrail invoiceId={1} isExpanded={true} />
    );
    await waitFor(() => {
      expect(screen.getByText("No audit history available")).toBeInTheDocument();
    });
  });

  it("renders as modal when asModal is true", async () => {
    commissionService.getCommissionAuditTrail.mockResolvedValue({
      auditEntries: [],
    });
    renderWithTheme(
      <CommissionAuditTrail
        invoiceId={1}
        asModal={true}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText("Commission Audit Trail")).toBeInTheDocument();
  });

  it("renders timeline entries", async () => {
    commissionService.getCommissionAuditTrail.mockResolvedValue({
      auditEntries: [
        {
          id: 1,
          eventType: "CREATED",
          timestamp: "2025-01-01",
          userName: "Admin",
          notes: "Initial commission",
        },
      ],
    });
    renderWithTheme(
      <CommissionAuditTrail invoiceId={1} isExpanded={true} />
    );
    await waitFor(() => {
      expect(screen.getByText("Commission Created")).toBeInTheDocument();
      expect(screen.getByText("Admin")).toBeInTheDocument();
    });
  });

  it("shows error state on fetch failure", async () => {
    commissionService.getCommissionAuditTrail.mockRejectedValue(
      new Error("Network error")
    );
    renderWithTheme(
      <CommissionAuditTrail invoiceId={1} isExpanded={true} />
    );
    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });
});
