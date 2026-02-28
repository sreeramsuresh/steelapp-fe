/**
 * PriceCalculator Component Tests
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

vi.mock("../../utils/fieldAccessors", () => ({
  getProductDisplayName: vi.fn().mockReturnValue("Test Product"),
}));

import PriceCalculator from "../PriceCalculator";

describe("PriceCalculator", () => {
  it("renders without crashing", () => {
    const { container } = renderWithProviders(<PriceCalculator />);
    expect(container).toBeTruthy();
  });
});
