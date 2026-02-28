/**
 * LoadingButton Component Tests
 */
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/component-setup";

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: "/" }),
}));

import LoadingButton from "../LoadingButton";

describe("LoadingButton", () => {
  it("renders without crashing", () => {
    const { container } = renderWithProviders(<LoadingButton onClick={vi.fn()}>Save</LoadingButton>);
    expect(container).toBeTruthy();
  });

  it("displays children text", () => {
    const { container } = renderWithProviders(<LoadingButton onClick={vi.fn()}>Save</LoadingButton>);
    expect(container.textContent).toContain("Save");
  });

  it("shows loading text when loading", () => {
    const { container } = renderWithProviders(
      <LoadingButton onClick={vi.fn()} loading={true} loadingText="Saving...">
        Save
      </LoadingButton>
    );
    expect(container.textContent).toContain("Saving...");
  });

  it("disables button when loading", () => {
    const { container } = renderWithProviders(
      <LoadingButton onClick={vi.fn()} loading={true}>
        Save
      </LoadingButton>
    );
    const button = container.querySelector("button");
    expect(button.disabled).toBe(true);
  });

  it("disables button when disabled prop is true", () => {
    const { container } = renderWithProviders(
      <LoadingButton onClick={vi.fn()} disabled={true}>
        Save
      </LoadingButton>
    );
    const button = container.querySelector("button");
    expect(button.disabled).toBe(true);
  });
});
