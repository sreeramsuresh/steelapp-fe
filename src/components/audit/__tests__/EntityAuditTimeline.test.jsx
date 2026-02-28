import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false, toggleTheme: vi.fn() }),
}));

vi.mock("../../../services/axiosApi", () => ({
  apiService: {
    get: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

vi.mock("../../../utils/timezone", () => ({
  toUAETime: (d) => d || new Date().toISOString(),
}));

import EntityAuditTimeline from "../EntityAuditTimeline";

describe("EntityAuditTimeline", () => {
  it("renders without crashing", () => {
    const { container } = render(<EntityAuditTimeline entityType="invoice" entityId={1} />);
    expect(container).toBeTruthy();
  });
});
