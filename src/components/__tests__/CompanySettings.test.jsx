/**
 * CompanySettings Component Tests
 */
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/component-setup";

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: "/app/settings" }),
  useParams: () => ({}),
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

vi.mock("../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
  ThemeProvider: ({ children }) => <div>{children}</div>,
}));

vi.mock("../../contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: 1, name: "Test", role: "admin", company_id: 1 },
    isAuthenticated: true,
  }),
}));

vi.mock("../../services/axiosApi", () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    put: vi.fn().mockResolvedValue({ data: {} }),
  },
  apiService: {
    get: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    put: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

vi.mock("../../services/axiosAuthService", () => ({
  authService: {
    hasRole: vi.fn().mockReturnValue(true),
    hasPermission: vi.fn().mockReturnValue(true),
  },
}));

vi.mock("../../services/notificationService", () => ({
  notificationService: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
  default: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));

vi.mock("../../hooks/useEscapeKey", () => ({ default: vi.fn() }));

import CompanySettings from "../CompanySettings";

describe("CompanySettings", () => {
  it("renders without crashing", () => {
    const { container } = renderWithProviders(<CompanySettings />);
    expect(container).toBeTruthy();
  });
});
