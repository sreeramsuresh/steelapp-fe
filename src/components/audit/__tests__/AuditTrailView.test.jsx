import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false, toggleTheme: vi.fn() }),
}));

import AuditTrailView from "../AuditTrailView";

describe("AuditTrailView", () => {
  it("renders without crashing", () => {
    const { container } = render(<AuditTrailView datasetId={1} signOffs={[]} />);
    expect(container).toBeTruthy();
  });

  it("shows empty state when no sign-offs", () => {
    render(<AuditTrailView datasetId={1} signOffs={[]} />);
    expect(screen.getByText("No audit events yet")).toBeInTheDocument();
  });

  it("renders audit trail header", () => {
    render(<AuditTrailView datasetId={1} signOffs={[]} />);
    expect(screen.getByText("Audit Trail")).toBeInTheDocument();
  });

  it("renders sign-off events", () => {
    const signOffs = [
      { id: 1, stage: "PREPARED", signed_at: "2026-01-15T10:00:00Z", user_name: "Admin", name: "Prepare" },
    ];
    render(<AuditTrailView datasetId={1} signOffs={signOffs} />);
    expect(screen.queryByText("No audit events yet")).not.toBeInTheDocument();
  });
});
