/**
 * RoleGuideModal Component Tests
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

import RoleGuideModal from "../RoleGuideModal";

describe("RoleGuideModal", () => {
  it("renders without crashing when open", () => {
    const { container } = renderWithProviders(<RoleGuideModal open={true} onClose={vi.fn()} />);
    expect(container).toBeTruthy();
  });
});
