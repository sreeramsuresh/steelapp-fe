/**
 * Sidebar Component Tests
 */
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/component-setup";

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: "/app" }),
  Link: ({ children, to, ...props }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  NavLink: ({ children, to, ...props }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
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

vi.mock("../../services/axiosAuthService", () => ({
  authService: {
    hasRole: vi.fn().mockReturnValue(true),
    hasPermission: vi.fn().mockReturnValue(true),
  },
}));

import Sidebar from "../Sidebar";

describe("Sidebar", () => {
  it("renders without crashing", () => {
    const { container } = renderWithProviders(<Sidebar isOpen={true} onToggle={vi.fn()} />);
    expect(container).toBeTruthy();
  });
});
