/**
 * AcceptInvite Component Tests - No Token State
 * Tests the invalid invitation link state
 */

import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/component-setup";

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
  useSearchParams: () => [new URLSearchParams(""), vi.fn()],
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
  },
  default: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

import AcceptInvite from "../AcceptInvite";

describe("AcceptInvite - No Token", () => {
  it("shows invalid invitation link message when no token", () => {
    const { container } = renderWithProviders(<AcceptInvite />);
    expect(container.textContent).toContain("Invalid Invitation Link");
  });

  it("shows Go to Login link when no token", () => {
    const { container } = renderWithProviders(<AcceptInvite />);
    expect(container.textContent).toContain("Go to Login");
  });
});
