import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

vi.mock("react-router-dom", () => ({
  useParams: () => ({ poId: "42" }),
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: "/app/purchases/po/42/overview", search: "" }),
  Outlet: () => <div data-testid="outlet">Outlet Content</div>,
}));

vi.mock("../../../../services/purchaseOrderService", () => ({
  purchaseOrderService: {
    getWorkspaceSummary: vi.fn(),
  },
}));

vi.mock("lucide-react", () => ({
  AlertTriangle: (props) => <svg {...props} />,
  ArrowLeft: (props) => <svg {...props} />,
  ArrowRight: (props) => <svg {...props} />,
  Check: (props) => <svg {...props} />,
  CheckCircle2: (props) => <svg {...props} />,
  CircleDot: (props) => <svg {...props} />,
  FileText: (props) => <svg {...props} />,
  Loader2: (props) => <svg {...props} />,
  Package: (props) => <svg {...props} />,
  Receipt: (props) => <svg {...props} />,
  Truck: (props) => <svg {...props} />,
  Wallet: (props) => <svg {...props} />,
}));

import { purchaseOrderService } from "../../../../services/purchaseOrderService";
import POWorkspaceShell from "../POWorkspaceShell";

describe("POWorkspaceShell", () => {
  it("shows loading state while fetching", () => {
    purchaseOrderService.getWorkspaceSummary.mockReturnValue(new Promise(() => {}));
    render(<POWorkspaceShell />);
    // The loader should be present
    expect(document.querySelector(".animate-spin")).toBeTruthy();
  });

  it("shows error state when fetch fails", async () => {
    purchaseOrderService.getWorkspaceSummary.mockRejectedValue(new Error("Not found"));
    render(<POWorkspaceShell />);
    await waitFor(() => {
      expect(screen.getByText("Failed to load workspace")).toBeInTheDocument();
    });
  });

  it("renders workspace content when loaded", async () => {
    purchaseOrderService.getWorkspaceSummary.mockResolvedValue({
      po: { poNumber: "PO-001", status: "draft", supplierName: "Steel Supplier" },
      workflow: { poType: "LOCAL_PURCHASE", createPo: true },
      grns: { count: 0 },
      bills: { count: 0 },
    });
    render(<POWorkspaceShell />);
    await waitFor(() => {
      expect(screen.getByText("PO-001")).toBeInTheDocument();
    });
  });

  it("renders outlet when loaded", async () => {
    purchaseOrderService.getWorkspaceSummary.mockResolvedValue({
      po: { poNumber: "PO-001", status: "draft", supplierName: "Supplier" },
      workflow: { poType: "LOCAL_PURCHASE", createPo: true },
      grns: { count: 0 },
      bills: { count: 0 },
    });
    render(<POWorkspaceShell />);
    await waitFor(() => {
      expect(screen.getByTestId("outlet")).toBeInTheDocument();
    });
  });
});
