/**
 * ProductNamingHelpPanel Component Tests
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

import ProductNamingHelpPanel from "../ProductNamingHelpPanel";

describe("ProductNamingHelpPanel", () => {
  it("renders without crashing", () => {
    const { container } = renderWithProviders(
      <ProductNamingHelpPanel isOpen={true} onClose={vi.fn()} />
    );
    expect(container).toBeTruthy();
  });
});
