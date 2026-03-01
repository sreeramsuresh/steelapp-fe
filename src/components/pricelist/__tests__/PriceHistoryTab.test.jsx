import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false, toggleTheme: vi.fn() }),
}));

vi.mock("../../../services/pricelistService", () => ({
  default: {
    getHistory: vi.fn().mockResolvedValue({ history: [], total: 0 }),
  },
}));

vi.mock("date-fns", () => ({
  format: (d, _f) => d?.toString() || "-",
}));

import PriceHistoryTab from "../PriceHistoryTab";

describe("PriceHistoryTab", () => {
  it("renders without crashing", () => {
    const { container } = render(<PriceHistoryTab pricelistId={1} />);
    expect(container).toBeTruthy();
  });

  it("renders without pricelistId", () => {
    const { container } = render(<PriceHistoryTab pricelistId={null} />);
    expect(container).toBeTruthy();
  });
});
