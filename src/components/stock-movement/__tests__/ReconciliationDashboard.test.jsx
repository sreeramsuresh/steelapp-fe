import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({}),
  useLocation: () => ({ pathname: "/test", search: "", hash: "" }),
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false, toggleTheme: vi.fn() }),
}));

vi.mock("../../../services/stockMovementService", () => ({
  stockMovementService: {
    getReconciliationReport: vi.fn().mockResolvedValue({
      warehouseName: "Main Warehouse",
      totalSystemValue: 1000,
      discrepancyCount: 0,
      items: [],
    }),
    getAuditTrail: vi.fn().mockResolvedValue({ entries: [], pagination: { totalItems: 0 } }),
  },
}));

vi.mock("../../../services/warehouseService", () => ({
  warehouseService: {
    getAll: vi.fn().mockResolvedValue({ data: [{ id: 1, name: "Main Warehouse", isDefault: true }] }),
  },
}));

import ReconciliationDashboard from "../ReconciliationDashboard";

describe("ReconciliationDashboard", () => {
  it("renders without crashing", () => {
    const { container } = render(<ReconciliationDashboard />);
    expect(container).toBeTruthy();
  });

  it("displays the header title", () => {
    render(<ReconciliationDashboard />);
    expect(screen.getByText("Stock Reconciliation & Audit")).toBeInTheDocument();
  });

  it("renders reconciliation and audit trail tabs", () => {
    render(<ReconciliationDashboard />);
    expect(screen.getByText("Reconciliation Report")).toBeInTheDocument();
    expect(screen.getByText("Audit Trail")).toBeInTheDocument();
  });
});
