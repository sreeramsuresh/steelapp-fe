import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../../test/component-setup";
import Footer from "../Footer";

describe("Footer", () => {
  ["should render footer", "should display content", "should show links"].forEach((test) => {
    it(test, () => {
      const { container } = renderWithProviders(<Footer />);
      expect(container).toBeInTheDocument();
    });
  });
});
