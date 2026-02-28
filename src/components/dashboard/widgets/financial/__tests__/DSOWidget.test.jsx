import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

import DSOWidget from "../DSOWidget";

describe("DSOWidget", () => {
  it("renders without crashing", () => {
    render(<DSOWidget />);
  });

  it("displays the widget title", () => {
    render(<DSOWidget />);
    expect(screen.getByText("DSO")).toBeInTheDocument();
  });

  it("shows fallback DSO value when no data provided", () => {
    render(<DSOWidget />);
    expect(screen.getByText("42 days")).toBeInTheDocument();
  });

  it("shows custom DSO value", () => {
    render(<DSOWidget dso={35} />);
    expect(screen.getByText("35 days")).toBeInTheDocument();
  });

  it("displays description label", () => {
    render(<DSOWidget />);
    expect(screen.getByText("Average time to collect payment")).toBeInTheDocument();
  });
});
