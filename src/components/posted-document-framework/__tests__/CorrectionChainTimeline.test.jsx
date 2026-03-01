import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "../../../contexts/ThemeContext";
import CorrectionChainTimeline from "../CorrectionChainTimeline";

function renderWithTheme(ui) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

describe("CorrectionChainTimeline", () => {
  it("returns null when no nodes", () => {
    const { container } = renderWithTheme(<CorrectionChainTimeline nodes={[]} edges={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders nodes in order", () => {
    const nodes = [
      { id: "inv-1", number: "INV-001", type: "invoice", amount: 1000, sign: 1 },
      { id: "cn-1", number: "CN-001", type: "credit_note", amount: 200, sign: -1 },
    ];
    const edges = [{ source: "inv-1", target: "cn-1", linkType: "correction" }];

    renderWithTheme(<CorrectionChainTimeline nodes={nodes} edges={edges} />);
    expect(screen.getByText("INV-001")).toBeInTheDocument();
    expect(screen.getByText("CN-001")).toBeInTheDocument();
  });

  it("displays amounts with sign", () => {
    const nodes = [{ id: "inv-1", number: "INV-001", type: "invoice", amount: 1000, sign: 1 }];

    renderWithTheme(<CorrectionChainTimeline nodes={nodes} edges={[]} />);
    expect(screen.getByText(/\+ AED 1,000\.00/)).toBeInTheDocument();
  });

  it("shows computed summary when provided", () => {
    const nodes = [{ id: "inv-1", number: "INV-001", type: "invoice", amount: 1000, sign: 1 }];
    const computed = { balance: 800, nodeCount: 2, vatNet: 40 };

    renderWithTheme(<CorrectionChainTimeline nodes={nodes} edges={[]} computed={computed} />);
    expect(screen.getByText("Net Position")).toBeInTheDocument();
    expect(screen.getByText(/800.00/)).toBeInTheDocument();
    expect(screen.getByText("Documents in chain")).toBeInTheDocument();
  });

  it("renders node status badge", () => {
    const nodes = [{ id: "inv-1", number: "INV-001", type: "invoice", amount: 100, sign: 1, status: "issued" }];

    renderWithTheme(<CorrectionChainTimeline nodes={nodes} edges={[]} />);
    expect(screen.getByText("issued")).toBeInTheDocument();
  });

  it("renders reason text", () => {
    const nodes = [
      { id: "cn-1", number: "CN-001", type: "credit_note", amount: 50, sign: -1, reason: "Wrong quantity" },
    ];

    renderWithTheme(<CorrectionChainTimeline nodes={nodes} edges={[]} />);
    expect(screen.getByText("Wrong quantity")).toBeInTheDocument();
  });

  it("renders clickable links in live mode with onNavigate", () => {
    const onNavigate = vi.fn();
    const nodes = [{ id: "inv-1", number: "INV-001", type: "invoice", amount: 100, sign: 1, docId: 42 }];

    renderWithTheme(<CorrectionChainTimeline nodes={nodes} edges={[]} mode="live" onNavigate={onNavigate} />);
    screen.getByText("INV-001").click();
    expect(onNavigate).toHaveBeenCalledWith("invoice", 42);
  });
});
