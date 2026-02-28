import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: "/app/purchases/po/1/overview", search: "" }),
}));

const mockWorkspace = {
  summary: {
    workflow: {
      poType: "LOCAL_PURCHASE",
      createPo: true,
      confirmComplete: false,
      grnEnabled: false,
      grnComplete: false,
      billEnabled: false,
      billComplete: false,
      paymentEnabled: false,
      paymentComplete: false,
    },
  },
  poId: "1",
};

vi.mock("../WorkspaceContext", () => ({
  useWorkspace: () => mockWorkspace,
}));

vi.mock("lucide-react", () => ({
  AlertTriangle: (props) => <svg {...props} />,
  Check: (props) => <svg {...props} />,
  CircleDot: (props) => <svg {...props} />,
  FileText: (props) => <svg {...props} />,
  Package: (props) => <svg {...props} />,
  Receipt: (props) => <svg {...props} />,
  Truck: (props) => <svg {...props} />,
  Wallet: (props) => <svg {...props} />,
}));

import HorizontalWorkflowStepper from "../HorizontalWorkflowStepper";

describe("HorizontalWorkflowStepper", () => {
  it("renders workflow header", () => {
    render(<HorizontalWorkflowStepper />);
    expect(screen.getByText("Purchase Order Workflow")).toBeInTheDocument();
  });

  it("renders Local Purchase badge", () => {
    render(<HorizontalWorkflowStepper />);
    expect(screen.getByText("Local Purchase")).toBeInTheDocument();
  });

  it("renders workflow steps", () => {
    render(<HorizontalWorkflowStepper />);
    expect(screen.getByText("Create PO")).toBeInTheDocument();
    expect(screen.getByText("Confirm")).toBeInTheDocument();
    expect(screen.getByText("GRN")).toBeInTheDocument();
    expect(screen.getByText("Supplier Bill")).toBeInTheDocument();
    expect(screen.getByText("Payment")).toBeInTheDocument();
  });

  it("shows next step hint", () => {
    render(<HorizontalWorkflowStepper />);
    expect(screen.getByText(/Next step:/)).toBeInTheDocument();
  });

  it("renders Next indicator for the next step", () => {
    // confirm is the next step since createPo has no completion key check that matters
    render(<HorizontalWorkflowStepper />);
    expect(screen.getByText("Next")).toBeInTheDocument();
  });
});
