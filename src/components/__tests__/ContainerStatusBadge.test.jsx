/**
 * ContainerStatusBadge Component Tests
 */
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/component-setup";

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: "/" }),
}));

vi.mock("@/components/ui/badge", () => ({
  Badge: ({ children, className, ...props }) => (
    <span className={className} {...props}>
      {children}
    </span>
  ),
}));

import ContainerStatusBadge from "../ContainerStatusBadge";

describe("ContainerStatusBadge", () => {
  it("renders without crashing", () => {
    const { container } = renderWithProviders(<ContainerStatusBadge status="BOOKED" />);
    expect(container).toBeTruthy();
  });

  it("displays Booked label for BOOKED status", () => {
    const { container } = renderWithProviders(<ContainerStatusBadge status="BOOKED" />);
    expect(container.textContent).toContain("Booked");
  });

  it("displays In Transit label for IN_TRANSIT status", () => {
    const { container } = renderWithProviders(<ContainerStatusBadge status="IN_TRANSIT" />);
    expect(container.textContent).toContain("In Transit");
  });

  it("displays Delivered label for DELIVERED status", () => {
    const { container } = renderWithProviders(<ContainerStatusBadge status="DELIVERED" />);
    expect(container.textContent).toContain("Delivered");
  });

  it("defaults to Booked for unknown status", () => {
    const { container } = renderWithProviders(<ContainerStatusBadge status="UNKNOWN" />);
    expect(container.textContent).toContain("Booked");
  });
});
