import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../services/purchaseOrderService", () => ({
  purchaseOrderService: {
    getWorkspaceSummary: vi.fn(),
  },
}));

import { purchaseOrderService } from "../../../../services/purchaseOrderService";
import { useWorkspace, WorkspaceProvider } from "../WorkspaceContext";

// Test component that consumes the context
function TestConsumer() {
  const { summary, loading, error, poId } = useWorkspace();
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  return (
    <div>
      <span data-testid="po-id">{poId}</span>
      <span data-testid="po-number">{summary?.po?.poNumber}</span>
    </div>
  );
}

describe("WorkspaceContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("provides loading state while fetching", () => {
    purchaseOrderService.getWorkspaceSummary.mockReturnValue(new Promise(() => {}));
    render(
      <WorkspaceProvider poId="1">
        <TestConsumer />
      </WorkspaceProvider>
    );
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("provides summary data after fetch", async () => {
    purchaseOrderService.getWorkspaceSummary.mockResolvedValue({
      po: { poNumber: "PO-2025-001" },
    });
    render(
      <WorkspaceProvider poId="1">
        <TestConsumer />
      </WorkspaceProvider>
    );
    await waitFor(() => {
      expect(screen.getByTestId("po-number").textContent).toBe("PO-2025-001");
    });
  });

  it("provides error state on failure", async () => {
    purchaseOrderService.getWorkspaceSummary.mockRejectedValue(new Error("Not found"));
    render(
      <WorkspaceProvider poId="1">
        <TestConsumer />
      </WorkspaceProvider>
    );
    await waitFor(() => {
      expect(screen.getByText("Error: Not found")).toBeInTheDocument();
    });
  });

  it("provides poId to consumers", async () => {
    purchaseOrderService.getWorkspaceSummary.mockResolvedValue({ po: {} });
    render(
      <WorkspaceProvider poId="42">
        <TestConsumer />
      </WorkspaceProvider>
    );
    await waitFor(() => {
      expect(screen.getByTestId("po-id").textContent).toBe("42");
    });
  });

  it("does not fetch when poId is not provided", () => {
    render(
      <WorkspaceProvider poId={null}>
        <TestConsumer />
      </WorkspaceProvider>
    );
    expect(purchaseOrderService.getWorkspaceSummary).not.toHaveBeenCalled();
  });

  it("throws error when useWorkspace is used outside provider", () => {
    // Suppress error output
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<TestConsumer />)).toThrow("useWorkspace must be used within WorkspaceProvider");
    spy.mockRestore();
  });
});
