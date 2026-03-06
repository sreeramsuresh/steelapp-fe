import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/component-setup";

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: "/app/settings/financial", search: "" }),
  useParams: () => ({}),
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

vi.mock("../../services/axiosAuthService", () => ({
  authService: {
    hasRole: vi.fn().mockReturnValue(true),
    hasPermission: vi.fn().mockReturnValue(true),
  },
}));

import { authService } from "../../services/axiosAuthService";
import SettingsSidebar from "../SettingsSidebar";

describe("SettingsSidebar", () => {
  let mockOnToggle;

  beforeEach(() => {
    vi.clearAllMocks();
    authService.hasRole.mockReturnValue(true);
    authService.hasPermission.mockReturnValue(true);
    mockOnToggle = vi.fn();
    global.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
  });

  it("should render without crash", () => {
    const { container } = renderWithProviders(<SettingsSidebar isOpen={true} onToggle={mockOnToggle} />);
    expect(container).toBeTruthy();
  });

  it("should show Settings branding", () => {
    const { container } = renderWithProviders(<SettingsSidebar isOpen={true} onToggle={mockOnToggle} />);
    expect(container.textContent).toContain("SETTINGS");
    expect(container.textContent).toContain("Company Configuration");
  });

  it("should show Back to Business Management link", () => {
    const { container } = renderWithProviders(<SettingsSidebar isOpen={true} onToggle={mockOnToggle} />);
    const backLink = container.querySelector('a[href="/app"]');
    expect(backLink).toBeInTheDocument();
    expect(container.textContent).toContain("Back to Business Management");
  });

  it("should show nav sections", () => {
    const { container } = renderWithProviders(<SettingsSidebar isOpen={true} onToggle={mockOnToggle} />);
    expect(container.textContent).toContain("Company");
    expect(container.textContent).toContain("Finance");
    expect(container.textContent).toContain("Administration");
  });

  it("should show correct nav items with correct paths", () => {
    const { container } = renderWithProviders(<SettingsSidebar isOpen={true} onToggle={mockOnToggle} />);
    expect(container.querySelector('a[href="/app/settings"]')).toBeInTheDocument();
    expect(container.querySelector('a[href="/app/settings/financial"]')).toBeInTheDocument();
    expect(container.querySelector('a[href="/app/settings/gl-mapping"]')).toBeInTheDocument();
    expect(container.querySelector('a[href="/app/users"]')).toBeInTheDocument();
    expect(container.querySelector('a[href="/app/roles"]')).toBeInTheDocument();
    expect(container.querySelector('a[href="/app/audit-logs"]')).toBeInTheDocument();
    expect(container.querySelector('a[href="/app/feedback"]')).toBeInTheDocument();
  });

  it("should highlight active route for /app/settings/financial", () => {
    const { container } = renderWithProviders(<SettingsSidebar isOpen={true} onToggle={mockOnToggle} />);
    const financialLink = container.querySelector('a[href="/app/settings/financial"]');
    expect(financialLink.getAttribute("aria-current")).toBe("page");
  });

  it("should filter items when permission denied", () => {
    authService.hasPermission.mockReturnValue(false);
    const { container } = renderWithProviders(<SettingsSidebar isOpen={true} onToggle={mockOnToggle} />);
    expect(container.querySelector('a[href="/app/users"]')).not.toBeInTheDocument();
  });
});
