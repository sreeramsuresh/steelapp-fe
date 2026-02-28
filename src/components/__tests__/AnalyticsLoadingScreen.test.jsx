/**
 * AnalyticsLoadingScreen Component Tests
 */
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/component-setup";

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: "/" }),
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

vi.mock("../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
  ThemeProvider: ({ children }) => <div>{children}</div>,
}));

import AnalyticsLoadingScreen from "../AnalyticsLoadingScreen";

describe("AnalyticsLoadingScreen", () => {
  it("renders without crashing", () => {
    const { container } = renderWithProviders(<AnalyticsLoadingScreen />);
    expect(container).toBeTruthy();
  });

  it("displays loading text", () => {
    const { container } = renderWithProviders(<AnalyticsLoadingScreen />);
    expect(container.textContent).toContain("Loading Analytics Hub");
  });

  it("displays preparing message", () => {
    const { container } = renderWithProviders(<AnalyticsLoadingScreen />);
    expect(container.textContent).toContain("Preparing insights and reports");
  });
});
