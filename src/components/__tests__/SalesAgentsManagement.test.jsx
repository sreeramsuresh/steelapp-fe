/**
 * SalesAgentsManagement Component Tests
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
    getAgents: vi.fn().mockResolvedValue({ agents: [] }),
    updateAgent: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock("../../services/notificationService", () => ({
  notificationService: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));

vi.mock("../../utils/invoiceUtils", () => ({
  formatCurrency: (val) => `$${val}`,
}));

import SalesAgentsManagement from "../SalesAgentsManagement";

describe("SalesAgentsManagement", () => {
  it("renders without crashing", () => {
    const { container } = renderWithProviders(<SalesAgentsManagement />);
    expect(container).toBeTruthy();
  });
});
