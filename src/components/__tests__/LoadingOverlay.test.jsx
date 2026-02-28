/**
 * LoadingOverlay Component Tests
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

import LoadingOverlay from "../LoadingOverlay";

describe("LoadingOverlay", () => {
  it("renders without crashing", () => {
    const { container } = renderWithProviders(<LoadingOverlay show={true} />);
    expect(container).toBeTruthy();
  });

  it("returns null when show is false", () => {
    const { container } = renderWithProviders(<LoadingOverlay show={false} />);
    expect(container.querySelector(".fixed")).toBeFalsy();
  });

  it("displays default processing message", () => {
    const { container } = renderWithProviders(<LoadingOverlay show={true} />);
    expect(container.textContent).toContain("Processing...");
  });

  it("displays custom message", () => {
    const { container } = renderWithProviders(<LoadingOverlay show={true} message="Saving invoice..." />);
    expect(container.textContent).toContain("Saving invoice...");
  });

  it("displays detail text when provided", () => {
    const { container } = renderWithProviders(
      <LoadingOverlay show={true} detail="Please wait while we process your request" />
    );
    expect(container.textContent).toContain("Please wait while we process your request");
  });
});
