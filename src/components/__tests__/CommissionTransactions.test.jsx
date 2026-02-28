/**
 * CommissionTransactions Component Tests
 */
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/component-setup";

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: "/" }),
}));

vi.mock("../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
  ThemeProvider: ({ children }) => <div>{children}</div>,
}));

vi.mock("../../services/commissionService", () => ({
  commissionService: {
    getTransactions: vi.fn().mockResolvedValue({ transactions: [] }),
    getAgents: vi.fn().mockResolvedValue({ agents: [] }),
    bulkApprove: vi.fn().mockResolvedValue({}),
    bulkMarkPaid: vi.fn().mockResolvedValue({}),
    reverseCommission: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock("../../services/notificationService", () => ({
  notificationService: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock("../../utils/invoiceUtils", () => ({
  formatCurrency: (val) => `$${val}`,
  formatDate: (val) => val,
  formatDateDMY: (val) => val,
}));

import CommissionTransactions from "../CommissionTransactions";

describe("CommissionTransactions", () => {
  it("renders without crashing", () => {
    const { container } = renderWithProviders(<CommissionTransactions />);
    expect(container).toBeTruthy();
  });

  it("shows loading state initially", () => {
    const { container } = renderWithProviders(<CommissionTransactions />);
    expect(container.textContent).toContain("Loading transactions");
  });
});
