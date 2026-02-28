import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock("lucide-react", () => ({
  ArrowLeft: (props) => <svg {...props} />,
  ArrowRight: (props) => <svg {...props} />,
  CheckCircle2: (props) => <svg {...props} />,
  Loader2: (props) => <svg {...props} />,
}));

const mockWorkspaceData = {
  summary: {
    po: { poNumber: "PO-2025-042", status: "confirmed", supplierName: "Steel Supplier" },
    workflow: { confirmComplete: true, isDropship: false },
    grns: { count: 0 },
    bills: { count: 0 },
  },
  loading: false,
  poId: "42",
};

vi.mock("../WorkspaceContext", () => ({
  useWorkspace: () => mockWorkspaceData,
}));

import WorkspaceHeader from "../WorkspaceHeader";

describe("WorkspaceHeader", () => {
  it("renders PO number", () => {
    render(<WorkspaceHeader />);
    expect(screen.getByText("PO-2025-042")).toBeInTheDocument();
  });

  it("renders supplier name", () => {
    render(<WorkspaceHeader />);
    expect(screen.getByText("Steel Supplier")).toBeInTheDocument();
  });

  it("renders status badge", () => {
    render(<WorkspaceHeader />);
    expect(screen.getByText("CONFIRMED")).toBeInTheDocument();
  });

  it("renders next action button", () => {
    render(<WorkspaceHeader />);
    // Since confirmComplete is true and grns.count is 0, next action is "Create GRN"
    expect(screen.getByText("Create GRN")).toBeInTheDocument();
  });

  it("renders Exit Workspace button", () => {
    render(<WorkspaceHeader />);
    expect(screen.getByText("Exit Workspace")).toBeInTheDocument();
  });

  it("navigates to purchases list when exit is clicked", () => {
    render(<WorkspaceHeader />);
    fireEvent.click(screen.getByText("Exit Workspace"));
    expect(mockNavigate).toHaveBeenCalledWith("/app/purchases");
  });

  it("renders back button with aria-label", () => {
    render(<WorkspaceHeader />);
    expect(screen.getByLabelText("Exit workspace")).toBeInTheDocument();
  });
});
