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

describe("ErrorState", () => {
  it("should render with default props", () => {
    const { container } = renderWithProviders(<ErrorState />);
    expect(container).toBeInTheDocument();
    expect(container.textContent).toContain("Something went wrong");
  });

  it("should render custom title and message", () => {
    const { container } = renderWithProviders(<ErrorState title="Server Error" message="Could not connect" />);
    expect(container.textContent).toContain("Server Error");
    expect(container.textContent).toContain("Could not connect");
  });

  it("should show retry button when onRetry is provided", () => {
    const onRetry = vi.fn();
    const { container } = renderWithProviders(<ErrorState onRetry={onRetry} canRetry={true} />);
    expect(container.textContent).toContain("Try Again");
  });

  it("should show error status code when provided", () => {
    const { container } = renderWithProviders(<ErrorState status={500} />);
    expect(container.textContent).toContain("Error Code: 500");
  });
});
