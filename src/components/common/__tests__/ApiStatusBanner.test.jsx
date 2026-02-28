import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false, toggleTheme: vi.fn() }),
}));

vi.mock("../../../contexts/ApiHealthContext", () => ({
  useApiHealthContext: () => ({
    isHealthy: false,
    isChecking: false,
    error: "Connection refused",
    isDismissed: false,
    checkNow: vi.fn(),
    dismiss: vi.fn(),
  }),
}));

import ApiStatusBanner from "../ApiStatusBanner";

describe("ApiStatusBanner", () => {
  it("renders warning when API is unhealthy", () => {
    render(<ApiStatusBanner />);
    expect(screen.getByText("Backend server is unavailable")).toBeInTheDocument();
  });

  it("shows retry button", () => {
    render(<ApiStatusBanner />);
    expect(screen.getByText("Retry")).toBeInTheDocument();
  });

  it("shows error details", () => {
    render(<ApiStatusBanner />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});
