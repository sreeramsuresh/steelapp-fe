import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false, toggleTheme: vi.fn() }),
}));

vi.mock("../../../hooks/useConfirm", () => ({
  useConfirm: () => ({
    confirm: vi.fn().mockResolvedValue(true),
    dialogState: { open: false, title: "", message: "" },
    handleConfirm: vi.fn(),
    handleCancel: vi.fn(),
  }),
}));

vi.mock("../../../services/axiosAuthService", () => ({
  authService: {
    hasPermission: vi.fn().mockReturnValue(true),
    getCurrentUser: vi.fn().mockReturnValue({ id: 1, role: "admin" }),
  },
}));

vi.mock("../../../services/notificationService", () => ({
  notificationService: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

vi.mock("../../../services/roleService", () => ({
  roleService: {
    getRoles: vi.fn().mockResolvedValue([]),
    getPermissions: vi.fn().mockResolvedValue([]),
  },
}));

vi.mock("../../../services/userAdminApi", () => ({
  userAdminAPI: {
    listUsers: vi.fn().mockResolvedValue({ users: [], totalCount: 0 }),
    createUser: vi.fn(),
    updateUser: vi.fn(),
    deleteUser: vi.fn(),
  },
}));

vi.mock("../../../utils/invoiceUtils", () => ({
  formatDateDMY: (d) => d || "-",
}));

vi.mock("../../ConfirmDialog", () => ({
  default: () => null,
}));

vi.mock("../../RolesHelpPanel", () => ({
  default: () => null,
}));

import UserManagementTab from "../UserManagementTab";

describe("UserManagementTab", () => {
  it("renders without crashing", () => {
    const { container } = render(<UserManagementTab />);
    expect(container).toBeTruthy();
  });
});
