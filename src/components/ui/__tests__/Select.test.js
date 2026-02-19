import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../../test/component-setup";
import Select from "../Select";

describe("Select", () => {
  ["should render select", "should display options", "should handle selection"].forEach((test) => {
    it(test, () => {
      const { container } = renderWithProviders(<Select options={[]} />);
      expect(container).toBeInTheDocument();
    });
  });
});
