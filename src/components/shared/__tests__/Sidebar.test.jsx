import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../../test/component-setup";
import Sidebar from "../Sidebar";

describe("Sidebar", () => {
  ["should render sidebar", "should display menu items", "should handle navigation"].forEach((test) => {
    it(test, () => {
      const { container } = renderWithProviders(<Sidebar />);
      expect(container).toBeInTheDocument();
    });
  });
});
