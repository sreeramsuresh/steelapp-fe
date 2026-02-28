import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false, toggleTheme: vi.fn() }),
}));

vi.mock("../../../constants/defaultTemplateSettings", () => ({
  getDocumentTemplateColor: () => "#3b82f6",
}));

vi.mock("../../../utils/invoiceUtils", () => ({
  formatCurrency: (v) => `AED ${v}`,
  formatDate: (d) => d || "-",
}));

vi.mock("../../../utils/recordUtils", () => ({
  validateAccountStatementForDownload: () => ({ isValid: true, errors: [], warnings: [] }),
}));

import AccountStatementPreview from "../AccountStatementPreview";

const mockStatement = {
  customerName: "ABC Corp",
  statementNumber: "STMT-001",
  openingBalance: 1000,
  totalInvoices: 5000,
  totalPayments: 3000,
  closingBalance: 3000,
  periodFrom: "2026-01-01",
  periodTo: "2026-01-31",
  items: [],
};

const mockCompany = {
  name: "Test Company",
  settings: {},
};

describe("AccountStatementPreview", () => {
  it("renders without crashing", () => {
    const { container } = render(
      <AccountStatementPreview statement={mockStatement} company={mockCompany} onClose={vi.fn()} />
    );
    expect(container).toBeTruthy();
  });

  it("shows the preview title", () => {
    render(
      <AccountStatementPreview statement={mockStatement} company={mockCompany} onClose={vi.fn()} />
    );
    expect(screen.getByText("Account Statement Preview")).toBeInTheDocument();
  });
});
