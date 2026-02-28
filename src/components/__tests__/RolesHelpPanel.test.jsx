/**
 * RolesHelpPanel Component Tests
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

import RolesHelpPanel from "../RolesHelpPanel";

describe("RolesHelpPanel", () => {
  it("renders without crashing", () => {
    const { container } = renderWithProviders(
      <RolesHelpPanel isOpen={true} onClose={vi.fn()} />
    );
    expect(container).toBeTruthy();
  });
});
