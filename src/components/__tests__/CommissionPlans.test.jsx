/**
 * CommissionPlans Component Tests
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
    getPlans: vi.fn().mockResolvedValue({ plans: [] }),
    getAgents: vi.fn().mockResolvedValue({ agents: [] }),
    createPlan: vi.fn().mockResolvedValue({}),
    updatePlan: vi.fn().mockResolvedValue({}),
    deletePlan: vi.fn().mockResolvedValue({}),
    assignPlanToUser: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock("../../services/notificationService", () => ({
  notificationService: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  },
}));

vi.mock("../../hooks/useEscapeKey", () => ({
  default: vi.fn(),
}));

import CommissionPlans from "../CommissionPlans";

describe("CommissionPlans", () => {
  it("renders without crashing", () => {
    const { container } = renderWithProviders(<CommissionPlans />);
    expect(container).toBeTruthy();
  });

  it("shows loading state initially", () => {
    const { container } = renderWithProviders(<CommissionPlans />);
    expect(container.textContent).toContain("Loading commission plans");
  });
});
