import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../../test/component-setup";
import ErrorState from "../ErrorState";

vi.mock("lucide-react", () => ({
  AlertTriangle: (props) => <span data-testid="alert-icon" {...props} />,
  FileQuestion: (props) => <span data-testid="file-question" {...props} />,
  Home: (props) => <span data-testid="home-icon" {...props} />,
  LogOut: (props) => <span data-testid="logout-icon" {...props} />,
  RefreshCw: (props) => <span data-testid="refresh-icon" {...props} />,
  ServerOff: (props) => <span data-testid="server-off" {...props} />,
  ShieldOff: (props) => <span data-testid="shield-off" {...props} />,
  WifiOff: (props) => <span data-testid="wifi-off" {...props} />,
}));

describe("ErrorState (modal-like)", () => {
  it("should render with default error message", () => {
    const { container } = renderWithProviders(<ErrorState />);
    expect(container).toBeInTheDocument();
    expect(container.textContent).toContain("Something went wrong");
  });

  it("should show go home button when onGoHome is provided", () => {
    const onGoHome = vi.fn();
    const { container } = renderWithProviders(<ErrorState onGoHome={onGoHome} />);
    expect(container.textContent).toContain("Go Home");
  });

  it("should not show retry button when canRetry is false", () => {
    const { container } = renderWithProviders(<ErrorState canRetry={false} />);
    expect(container.textContent).not.toContain("Try Again");
  });

  it("should apply custom className", () => {
    const { container } = renderWithProviders(<ErrorState className="custom-error" />);
    expect(container.querySelector(".custom-error")).toBeTruthy();
  });
});
