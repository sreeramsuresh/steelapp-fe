/**
 * FeedbackWidget Component Tests
 */
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/component-setup";

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: "/app/home" }),
}));

vi.mock("../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
  ThemeProvider: ({ children }) => <div>{children}</div>,
}));

vi.mock("../../services/axiosApi", () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

vi.mock("../../utils/routeLabels", () => ({
  getRouteLabel: vi.fn().mockReturnValue("Home"),
}));

vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

import FeedbackWidget from "../FeedbackWidget";

describe("FeedbackWidget", () => {
  it("renders without crashing", () => {
    const { container } = renderWithProviders(<FeedbackWidget />);
    expect(container).toBeTruthy();
  });

  it("renders a feedback button", () => {
    const { container } = renderWithProviders(<FeedbackWidget />);
    const button = container.querySelector("button");
    expect(button).toBeTruthy();
  });
});
