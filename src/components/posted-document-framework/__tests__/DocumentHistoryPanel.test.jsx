import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false, toggleTheme: vi.fn() }),
}));

vi.mock("../../../services/documentLinkService", () => ({
  documentLinkService: {
    getCorrectionChain: vi.fn().mockResolvedValue({ nodes: [], edges: [] }),
  },
}));

vi.mock("../../finance/documentTypeConfig", () => ({
  default: {
    invoice: { label: "Invoice", navigateTo: (id) => `/invoices/${id}` },
  },
}));

vi.mock("../CorrectionChainTimeline", () => ({
  default: () => <div data-testid="chain-timeline">Timeline</div>,
}));

vi.mock("../ImmutabilityBanner", () => ({
  default: ({ text }) => <div data-testid="immutability-banner">{text}</div>,
}));

import DocumentHistoryPanel from "../DocumentHistoryPanel";

describe("DocumentHistoryPanel", () => {
  it("returns null when documentId is falsy", () => {
    const { container } = render(
      <DocumentHistoryPanel documentType="invoice" documentId={null} documentStatus="draft" />
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders the Document History header", () => {
    render(<DocumentHistoryPanel documentType="invoice" documentId={1} documentStatus="draft" />);
    expect(screen.getByText("Document History")).toBeInTheDocument();
  });

  it("auto-expands for posted documents", () => {
    render(<DocumentHistoryPanel documentType="invoice" documentId={1} documentStatus="issued" />);
    expect(screen.getByText("Document History")).toBeInTheDocument();
  });
});
