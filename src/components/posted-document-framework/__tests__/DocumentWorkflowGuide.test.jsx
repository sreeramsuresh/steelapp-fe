import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false, toggleTheme: vi.fn() }),
}));

vi.mock("../CorrectionChainTimeline", () => ({
  default: () => <div data-testid="chain-timeline">Timeline</div>,
}));

vi.mock("../CorrectionFlowDiagram", () => ({
  default: () => <div data-testid="flow-diagram">Flow</div>,
}));

vi.mock("../ImmutabilityBanner", () => ({
  default: ({ text }) => <div data-testid="banner">{text}</div>,
}));

vi.mock("../ImpactTable", () => ({
  default: () => <div data-testid="impact-table">Impact</div>,
}));

vi.mock("../ScenarioCards", () => ({
  default: () => <div data-testid="scenario-cards">Scenarios</div>,
}));

import DocumentWorkflowGuide from "../DocumentWorkflowGuide";

describe("DocumentWorkflowGuide", () => {
  it("renders without crashing", () => {
    const { container } = render(<DocumentWorkflowGuide />);
    expect(container).toBeTruthy();
  });

  it("renders title from config", () => {
    render(<DocumentWorkflowGuide config={{ title: "Invoice Correction Guide" }} />);
    expect(screen.getByText("Invoice Correction Guide")).toBeInTheDocument();
  });

  it("renders banner when bannerText is provided", () => {
    render(<DocumentWorkflowGuide config={{ title: "Guide", bannerText: "Documents are immutable" }} />);
    expect(screen.getByText("Documents are immutable")).toBeInTheDocument();
  });
});
