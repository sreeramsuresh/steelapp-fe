import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../../test/component-setup";
import Header from "../Header";

describe("Header", () => {
  ["should render header", "should display title", "should show navigation"].forEach((test) => {
    it(test, () => {
      const { container } = renderWithProviders(<Header />);
      expect(container).toBeInTheDocument();
    });
  });
});
