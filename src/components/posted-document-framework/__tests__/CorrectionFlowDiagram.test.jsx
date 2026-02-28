import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FileText, AlertTriangle, CheckCircle } from "lucide-react";

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false, toggleTheme: vi.fn() }),
}));

import CorrectionFlowDiagram from "../CorrectionFlowDiagram";

describe("CorrectionFlowDiagram", () => {
  it("returns null when steps is empty", () => {
    const { container } = render(<CorrectionFlowDiagram steps={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders step labels", () => {
    const steps = [
      { label: "Create Invoice", icon: FileText, color: "#3b82f6" },
      { label: "Issue Credit Note", icon: AlertTriangle, color: "#ef4444" },
      { label: "Verify", icon: CheckCircle, color: "#22c55e" },
    ];
    render(<CorrectionFlowDiagram steps={steps} />);
    expect(screen.getByText("Create Invoice")).toBeInTheDocument();
    expect(screen.getByText("Issue Credit Note")).toBeInTheDocument();
    expect(screen.getByText("Verify")).toBeInTheDocument();
  });

  it("renders step descriptions when provided", () => {
    const steps = [
      { label: "Step 1", icon: FileText, color: "#3b82f6", description: "First step" },
    ];
    render(<CorrectionFlowDiagram steps={steps} />);
    expect(screen.getByText("First step")).toBeInTheDocument();
  });
});
