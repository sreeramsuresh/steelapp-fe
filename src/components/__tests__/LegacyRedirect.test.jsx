/**
 * LegacyRedirect Component Tests
 */
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/component-setup";

vi.mock("react-router-dom", () => ({
  useLocation: () => ({ pathname: "/invoices", search: "", hash: "" }),
  Navigate: ({ to, replace }) => <div data-testid="navigate" data-to={to} data-replace={String(replace)} />,
}));

vi.mock("../../config/redirects", () => ({
  getRedirectPath: vi.fn().mockReturnValue("/app/invoices"),
}));

import LegacyRedirect from "../LegacyRedirect";

describe("LegacyRedirect", () => {
  it("renders without crashing", () => {
    const { container } = renderWithProviders(<LegacyRedirect />);
    expect(container).toBeTruthy();
  });

  it("renders Navigate component", () => {
    const { container } = renderWithProviders(<LegacyRedirect />);
    const navigate = container.querySelector("[data-testid='navigate']");
    expect(navigate).toBeTruthy();
  });
});
