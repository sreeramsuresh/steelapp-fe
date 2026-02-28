import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false, toggleTheme: vi.fn() }),
}));

vi.mock("../../ui/dialog", () => ({
  Dialog: ({ children, open }) => (open ? <div data-testid="dialog">{children}</div> : null),
  DialogContent: ({ children }) => <div>{children}</div>,
  DialogHeader: ({ children }) => <div>{children}</div>,
  DialogTitle: ({ children }) => <h2>{children}</h2>,
  DialogDescription: ({ children }) => <p>{children}</p>,
}));

vi.mock("../DocumentWorkflowGuide", () => ({
  default: ({ config }) => <div data-testid="workflow-guide">{config?.title}</div>,
}));

import CorrectionHelpModal from "../CorrectionHelpModal";

describe("CorrectionHelpModal", () => {
  it("renders nothing when closed", () => {
    const { container } = render(
      <CorrectionHelpModal open={false} onOpenChange={vi.fn()} config={{}} />
    );
    expect(container.querySelector("[data-testid='dialog']")).toBeNull();
  });

  it("renders dialog with title when open", () => {
    render(
      <CorrectionHelpModal
        open={true}
        onOpenChange={vi.fn()}
        config={{ title: "Invoice Correction Guide", subtitle: "Learn how to correct" }}
      />
    );
    expect(screen.getAllByText("Invoice Correction Guide").length).toBeGreaterThan(0);
    expect(screen.getByText("Learn how to correct posted documents")).toBeInTheDocument();
  });
});
