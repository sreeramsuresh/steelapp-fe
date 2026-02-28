/**
 * BrandmarkHero Component Tests
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

import BrandmarkHero from "../BrandmarkHero";

describe("BrandmarkHero", () => {
  it("renders without crashing", () => {
    const { container } = renderWithProviders(<BrandmarkHero />);
    expect(container).toBeTruthy();
  });

  it("displays company name", () => {
    const { container } = renderWithProviders(<BrandmarkHero />);
    expect(container.textContent).toContain("Ultimate Steels");
  });

  it("displays tagline", () => {
    const { container } = renderWithProviders(<BrandmarkHero />);
    expect(container.textContent).toContain("Building Materials Trading Platform");
  });

  it("renders brandmark image", () => {
    const { container } = renderWithProviders(<BrandmarkHero />);
    const img = container.querySelector("img");
    expect(img).toBeTruthy();
    expect(img.getAttribute("alt")).toContain("Brandmark");
  });
});
