import { describe, it, expect } from "vitest";
import { renderWithProviders } from "../../../test/component-setup";
import Loading from "../Loading";

describe("Loading", () => {
  ["should render spinner", "should display message"].forEach((test) => {
    it(test, () => {
      const { container } = renderWithProviders(<Loading />);
      expect(container).toBeInTheDocument();
    });
  });
});
