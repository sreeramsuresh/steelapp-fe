/**
 * RoleManagementModal Component Tests
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

vi.mock("../../services/roleService", () => ({
  roleService: {
    getRoles: vi.fn().mockResolvedValue({ roles: [] }),
    createRole: vi.fn().mockResolvedValue({}),
    updateRole: vi.fn().mockResolvedValue({}),
    deleteRole: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock("../../services/notificationService", () => ({
  notificationService: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
}));

vi.mock("../../hooks/useEscapeKey", () => ({ default: vi.fn() }));

import RoleManagementModal from "../RoleManagementModal";

describe("RoleManagementModal", () => {
  it("renders without crashing when open", () => {
    const { container } = renderWithProviders(
      <RoleManagementModal open={true} onClose={vi.fn()} onRoleUpdated={vi.fn()} />
    );
    expect(container).toBeTruthy();
  });
});
