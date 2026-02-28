/**
 * NotificationProvider Component Tests
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

vi.mock("../../services/notificationService", () => ({
  notificationService: {
    setTheme: vi.fn(),
  },
}));

vi.mock("react-hot-toast", () => ({
  Toaster: () => <div data-testid="toaster" />,
}));

import NotificationProvider from "../NotificationProvider";

describe("NotificationProvider", () => {
  it("renders without crashing", () => {
    const { container } = renderWithProviders(
      <NotificationProvider>
        <div>Test Content</div>
      </NotificationProvider>
    );
    expect(container).toBeTruthy();
  });

  it("renders children", () => {
    const { container } = renderWithProviders(
      <NotificationProvider>
        <div>Test Content</div>
      </NotificationProvider>
    );
    expect(container.textContent).toContain("Test Content");
  });
});
