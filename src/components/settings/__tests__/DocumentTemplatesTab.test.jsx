import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false, toggleTheme: vi.fn() }),
}));

vi.mock("../../../hooks/useApi", () => ({
  useApiData: () => ({ data: null, loading: true, error: null }),
}));

vi.mock("../../../services/companyService", () => ({
  companyService: {
    getCompany: vi.fn().mockResolvedValue({}),
    updateCompany: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock("../../../services/notificationService", () => ({
  notificationService: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("../../InvoiceTemplateSettings", () => ({
  default: ({ company }) => <div data-testid="template-settings">Template Settings</div>,
}));

import DocumentTemplatesTab from "../DocumentTemplatesTab";

describe("DocumentTemplatesTab", () => {
  it("renders loading state when no company data", () => {
    render(<DocumentTemplatesTab />);
    expect(screen.getByText("Loading template settings...")).toBeInTheDocument();
  });
});
