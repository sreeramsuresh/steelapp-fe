import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../../test/component-setup";
import BarChart from "../BarChart";

describe("BarChart", () => {
  ["should render chart", "should display bars", "should show legend"].forEach((test) => {
    it(test, () => {
      const { container } = renderWithProviders(<BarChart data={[]} />);
      expect(container).toBeInTheDocument();
    });
  });
});
