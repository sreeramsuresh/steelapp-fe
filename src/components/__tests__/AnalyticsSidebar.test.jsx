/**
 * AnalyticsSidebar Component Tests
 */
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/component-setup";

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: "/analytics" }),
  Link: ({ children, to, ...props }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
  ThemeProvider: ({ children }) => <div>{children}</div>,
}));

vi.mock("../../services/axiosAuthService", () => ({
  authService: {
    hasRole: vi.fn().mockReturnValue(true),
    hasPermission: vi.fn().mockReturnValue(true),
  },
}));

import AnalyticsSidebar from "../AnalyticsSidebar";

describe("AnalyticsSidebar", () => {
  it("renders without crashing", () => {
    const { container } = renderWithProviders(<AnalyticsSidebar isOpen={true} onToggle={vi.fn()} />);
    expect(container).toBeTruthy();
  });

  it("displays ANALYTICS HUB header", () => {
    const { container } = renderWithProviders(<AnalyticsSidebar isOpen={true} onToggle={vi.fn()} />);
    expect(container.textContent).toContain("ANALYTICS HUB");
  });

  it("contains navigation links", () => {
    const { container } = renderWithProviders(<AnalyticsSidebar isOpen={true} onToggle={vi.fn()} />);
    expect(container.textContent).toContain("Executive Dashboard");
    expect(container.textContent).toContain("Business Management");
  });
});
