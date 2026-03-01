import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuditHubProvider, useAuditHub } from "../AuditHubContext";
import { AuthProvider } from "../AuthContext";

// Mock dependencies
vi.mock("../../services/auditHubService", () => ({
  default: {
    getPeriods: vi.fn().mockResolvedValue([]),
    getDatasets: vi.fn().mockResolvedValue([]),
    closePeriod: vi.fn().mockResolvedValue({}),
    lockPeriod: vi.fn().mockResolvedValue({}),
    getReconciliations: vi.fn().mockResolvedValue([]),
    createPeriod: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock("../../services/authService", () => ({
  authService: {
    hasPermission: vi.fn().mockReturnValue(true),
  },
}));

import auditHubService from "../../services/auditHubService";

const mockUser = {
  id: 1,
  companyId: 10,
  companyName: "Steel Corp",
  role: "admin",
};

function TestConsumer() {
  const hub = useAuditHub();
  return (
    <div>
      <span data-testid="loading">{String(hub.loading)}</span>
      <span data-testid="error">{String(hub.error ?? "")}</span>
      <span data-testid="periods">{JSON.stringify(hub.periods)}</span>
      <span data-testid="selectedPeriod">{JSON.stringify(hub.selectedPeriod)}</span>
      <span data-testid="datasets">{JSON.stringify(hub.datasets)}</span>
      <span data-testid="companyId">{String(hub.companyId ?? "")}</span>
      <span data-testid="filtersYear">{hub.filters.year}</span>
      <button type="button" data-testid="selectPeriod" onClick={() => hub.selectPeriod({ id: 1, name: "Q1" })}>
        Select
      </button>
      <button type="button" data-testid="updateFilters" onClick={() => hub.updateFilters({ year: 2025 })}>
        Filter
      </button>
      <button type="button" data-testid="createPeriod" onClick={() => hub.createPeriod("monthly", 2025, 1)}>
        Create
      </button>
      <button type="button" data-testid="closePeriod" onClick={() => hub.closePeriod(1)}>
        Close
      </button>
      <button type="button" data-testid="lockPeriod" onClick={() => hub.lockPeriod(1)}>
        Lock
      </button>
    </div>
  );
}

function renderWithAuth(user = mockUser) {
  return render(
    <AuthProvider user={user}>
      <AuditHubProvider>
        <TestConsumer />
      </AuditHubProvider>
    </AuthProvider>
  );
}

describe("AuditHubContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auditHubService.getPeriods.mockResolvedValue([]);
  });

  it("provides default state values", async () => {
    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    expect(screen.getByTestId("error")).toHaveTextContent("");
    expect(screen.getByTestId("periods")).toHaveTextContent("[]");
    expect(screen.getByTestId("selectedPeriod")).toHaveTextContent("null");
    expect(screen.getByTestId("datasets")).toHaveTextContent("[]");
    expect(screen.getByTestId("companyId")).toHaveTextContent("10");
  });

  it("provides current year as default filter", () => {
    renderWithAuth();

    expect(screen.getByTestId("filtersYear")).toHaveTextContent(String(new Date().getFullYear()));
  });

  it("loads periods on mount when user has companyId", async () => {
    const periods = [{ id: 1, name: "Q1 2025" }];
    auditHubService.getPeriods.mockResolvedValue(periods);

    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByTestId("periods")).toHaveTextContent(JSON.stringify(periods));
    });
    expect(auditHubService.getPeriods).toHaveBeenCalledWith(10, expect.any(Object));
  });

  it("sets error when user has no companyId", async () => {
    renderWithAuth({ id: 1, companyId: null, role: "admin" });

    await waitFor(() => {
      expect(screen.getByTestId("error")).toHaveTextContent("No company context available");
    });
  });

  it("selects a period and loads datasets", async () => {
    const datasets = [{ id: 10, name: "Sales" }];
    auditHubService.getDatasets.mockResolvedValue(datasets);

    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    await act(async () => {
      screen.getByTestId("selectPeriod").click();
    });

    await waitFor(() => {
      expect(screen.getByTestId("datasets")).toHaveTextContent(JSON.stringify(datasets));
    });
    expect(auditHubService.getDatasets).toHaveBeenCalledWith(10, 1);
  });

  it("updates filters", async () => {
    renderWithAuth();

    await act(async () => {
      screen.getByTestId("updateFilters").click();
    });

    expect(screen.getByTestId("filtersYear")).toHaveTextContent("2025");
  });

  it("creates a period and prepends it to list", async () => {
    const newPeriod = { id: 99, name: "Jan 2025" };
    auditHubService.createPeriod.mockResolvedValue(newPeriod);

    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });

    await act(async () => {
      screen.getByTestId("createPeriod").click();
    });

    await waitFor(() => {
      const periods = JSON.parse(screen.getByTestId("periods").textContent);
      expect(periods[0]).toEqual(newPeriod);
    });
  });

  it("handles loadPeriods error gracefully", async () => {
    auditHubService.getPeriods.mockRejectedValue(new Error("Network error"));

    renderWithAuth();

    await waitFor(() => {
      expect(screen.getByTestId("error")).toHaveTextContent("Network error");
    });
    expect(screen.getByTestId("periods")).toHaveTextContent("[]");
  });

  it("throws error when useAuditHub is used outside provider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<TestConsumer />)).toThrow("useAuditHub must be used within AuditHubProvider");

    spy.mockRestore();
  });
});
