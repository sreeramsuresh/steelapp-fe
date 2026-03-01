import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

vi.mock("../../../services/api", () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue({}),
  },
}));

import { apiClient } from "../../../services/api";
import BatchAllocationKPIs from "../BatchAllocationKPIs";

describe("BatchAllocationKPIs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiClient.get.mockResolvedValue({});
  });

  it("renders without crashing", () => {
    render(<BatchAllocationKPIs />);
  });

  it("displays the header title", async () => {
    apiClient.get.mockResolvedValue({});
    render(<BatchAllocationKPIs />);
    await waitFor(() => {
      expect(screen.getByText("Batch Allocation Metrics")).toBeInTheDocument();
    });
  });

  it("displays all four KPI card titles", async () => {
    apiClient.get.mockResolvedValue({});
    render(<BatchAllocationKPIs />);
    await waitFor(() => {
      expect(screen.getByText("Batch Issues")).toBeInTheDocument();
      expect(screen.getByText("Allocated Value")).toBeInTheDocument();
      expect(screen.getByText("Pending Allocations")).toBeInTheDocument();
      expect(screen.getByText("Cost Variance")).toBeInTheDocument();
    });
  });

  it("shows error state when API fails", async () => {
    apiClient.get.mockRejectedValue(new Error("Network error"));
    render(<BatchAllocationKPIs />);
    await waitFor(() => {
      expect(screen.getByText("Failed to Load Metrics")).toBeInTheDocument();
    });
  });

  it("shows retry button on error", async () => {
    apiClient.get.mockRejectedValue(new Error("Network error"));
    render(<BatchAllocationKPIs />);
    await waitFor(() => {
      expect(screen.getByText("Retry")).toBeInTheDocument();
    });
  });

  it("has a refresh button", async () => {
    render(<BatchAllocationKPIs />);
    await waitFor(() => {
      expect(screen.getByText("Refresh")).toBeInTheDocument();
    });
  });
});
