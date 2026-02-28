import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false, toggleTheme: vi.fn() }),
}));

import ErrorState from "../ErrorState";

describe("ErrorState", () => {
  it("renders without crashing", () => {
    const { container } = render(<ErrorState />);
    expect(container).toBeTruthy();
  });

  it("shows default title and message", () => {
    render(<ErrorState />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("An unexpected error occurred. Please try again.")).toBeInTheDocument();
  });

  it("shows custom title and message", () => {
    render(<ErrorState title="Server Error" message="Could not connect to server." />);
    expect(screen.getByText("Server Error")).toBeInTheDocument();
    expect(screen.getByText("Could not connect to server.")).toBeInTheDocument();
  });

  it("shows Try Again button when canRetry is true", () => {
    render(<ErrorState canRetry={true} onRetry={vi.fn()} />);
    expect(screen.getByText("Try Again")).toBeInTheDocument();
  });

  it("shows error code when status is provided", () => {
    render(<ErrorState status={500} />);
    expect(screen.getByText("Error Code: 500")).toBeInTheDocument();
  });

  it("shows Go Home button when onGoHome is provided", () => {
    render(<ErrorState onGoHome={vi.fn()} />);
    expect(screen.getByText("Go Home")).toBeInTheDocument();
  });
});
