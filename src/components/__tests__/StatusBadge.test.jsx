/**
 * StatusBadge Component Tests
 */
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/component-setup";

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: "/" }),
}));

import StatusBadge from "../StatusBadge";

describe("StatusBadge", () => {
  const defaultConfig = {
    bgLight: "bg-green-100",
    bgDark: "bg-green-900/30",
    textLight: "text-green-800",
    textDark: "text-green-300",
    borderLight: "border-green-300",
    borderDark: "border-green-700",
  };

  it("renders without crashing", () => {
    const { container } = renderWithProviders(
      <StatusBadge label="Active" config={defaultConfig} isDarkMode={false} />
    );
    expect(container).toBeTruthy();
  });

  it("displays the label text", () => {
    const { container } = renderWithProviders(
      <StatusBadge label="Active" config={defaultConfig} isDarkMode={false} />
    );
    expect(container.textContent).toContain("Active");
  });

  it("renders as span when not clickable", () => {
    const { container } = renderWithProviders(
      <StatusBadge label="Active" config={defaultConfig} isDarkMode={false} />
    );
    expect(container.querySelector("span")).toBeTruthy();
    expect(container.querySelector("button")).toBeFalsy();
  });

  it("renders as button when onClick is provided", () => {
    const { container } = renderWithProviders(
      <StatusBadge label="Active" config={defaultConfig} isDarkMode={false} onClick={vi.fn()} />
    );
    expect(container.querySelector("button")).toBeTruthy();
  });

  it("displays icon when provided", () => {
    const { container } = renderWithProviders(
      <StatusBadge label="Active" icon="*" config={defaultConfig} isDarkMode={false} />
    );
    expect(container.textContent).toContain("*");
  });
});
