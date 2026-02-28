/**
 * AcceptInvite Component Tests
 * Tests the invite acceptance form with validation
 */

import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/component-setup";

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
  useSearchParams: () => [new URLSearchParams("token=test-token-123"), vi.fn()],
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

vi.mock("../../services/axiosApi", () => ({
  apiService: {
    post: vi.fn().mockResolvedValue({ data: {} }),
    get: vi.fn().mockResolvedValue({ data: {} }),
  },
  default: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

import AcceptInvite from "../AcceptInvite";

describe("AcceptInvite", () => {
  it("renders without crashing with token", () => {
    const { container } = renderWithProviders(<AcceptInvite />);
    expect(container).toBeTruthy();
  });

  it("renders the form with username and password fields", () => {
    const { container } = renderWithProviders(<AcceptInvite />);
    expect(container.querySelector("#accept-username")).toBeTruthy();
    expect(container.querySelector("#accept-password")).toBeTruthy();
    expect(container.querySelector("#accept-confirm-password")).toBeTruthy();
  });

  it("displays ULTIMATE STEELS branding", () => {
    const { container } = renderWithProviders(<AcceptInvite />);
    expect(container.textContent).toContain("ULTIMATE STEELS");
  });

  it("shows Set up your account text", () => {
    const { container } = renderWithProviders(<AcceptInvite />);
    expect(container.textContent).toContain("Set up your account");
  });

  it("has a Create Account button", () => {
    const { container } = renderWithProviders(<AcceptInvite />);
    expect(container.textContent).toContain("Create Account");
  });
});
