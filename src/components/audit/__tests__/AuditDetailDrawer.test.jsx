import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false, toggleTheme: vi.fn() }),
}));

vi.mock("../../../utils/timezone", () => ({
  toUAETime: (d) => d || new Date().toISOString(),
}));

import AuditDetailDrawer from "../AuditDetailDrawer";

const mockEntry = {
  id: 1,
  action: "UPDATE",
  entity_type: "invoice",
  entity_id: 42,
  old_values: JSON.stringify({ status: "draft" }),
  new_values: JSON.stringify({ status: "issued" }),
  user_name: "Admin",
  ip_address: "192.168.1.1",
  user_agent: "Chrome",
  created_at: "2026-01-15T10:00:00Z",
};

describe("AuditDetailDrawer", () => {
  it("renders without crashing when entry is provided", () => {
    const { container } = render(<AuditDetailDrawer entry={mockEntry} open={true} onClose={vi.fn()} />);
    expect(container).toBeTruthy();
  });
});
