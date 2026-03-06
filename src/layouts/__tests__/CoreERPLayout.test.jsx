import { describe, expect, it, vi } from "vitest";

let mockPathname = "/app/invoices";

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: mockPathname, search: "" }),
  useParams: () => ({}),
  Outlet: () => <div data-testid="outlet">Outlet</div>,
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
    isAuthenticated: vi.fn().mockReturnValue(true),
    getUser: vi.fn().mockReturnValue({ id: 1, name: "Test" }),
    hasRole: vi.fn().mockReturnValue(true),
    hasPermission: vi.fn().mockReturnValue(true),
    logout: vi.fn(),
  },
}));

vi.mock("../../components/FeedbackWidget", () => ({
  default: () => <div data-testid="feedback-widget" />,
}));

vi.mock("../../components/TopNavbar", () => ({
  default: ({ currentPage }) => <div data-testid="topnavbar">{currentPage}</div>,
}));

import { render } from "@testing-library/react";
import { ThemeProvider } from "../../contexts/ThemeContext";
import CoreERPLayout from "../CoreERPLayout";

function renderLayout(pathname) {
  mockPathname = pathname;
  return render(
    <ThemeProvider>
      <CoreERPLayout />
    </ThemeProvider>
  );
}

describe("CoreERPLayout shell switch", () => {
  beforeEach(() => {
    global.ResizeObserver = class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    };
    // matchMedia mock
    window.matchMedia =
      window.matchMedia || (() => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} }));
  });

  it("renders CoreSidebar on /app/invoices", () => {
    const { container } = renderLayout("/app/invoices");
    expect(container.textContent).toContain("ULTIMATE STEELS");
    expect(container.textContent).not.toContain("Company Configuration");
  });

  it("renders SettingsSidebar on /app/settings", () => {
    const { container } = renderLayout("/app/settings");
    expect(container.textContent).toContain("SETTINGS");
    expect(container.textContent).toContain("Company Configuration");
  });

  it("renders SettingsSidebar on /app/users", () => {
    const { container } = renderLayout("/app/users");
    expect(container.textContent).toContain("SETTINGS");
  });
});
