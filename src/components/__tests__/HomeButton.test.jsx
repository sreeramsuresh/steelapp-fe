/**
 * HomeButton Component Tests
 */
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/component-setup";

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: "/app/invoices" }),
}));

vi.mock("../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
  ThemeProvider: ({ children }) => <div>{children}</div>,
}));

import HomeButton from "../HomeButton";

describe("HomeButton", () => {
  it("renders without crashing", () => {
    const { container } = renderWithProviders(<HomeButton />);
    expect(container).toBeTruthy();
  });

  it("renders a button element", () => {
    const { container } = renderWithProviders(<HomeButton />);
    const button = container.querySelector("button");
    expect(button).toBeTruthy();
  });

  it("has correct title when not on home page", () => {
    const { container } = renderWithProviders(<HomeButton />);
    const button = container.querySelector("button");
    expect(button.getAttribute("title")).toContain("Return to home page");
  });
});
