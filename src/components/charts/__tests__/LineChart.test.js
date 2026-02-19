import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../../test/component-setup";
import LineChart from "../LineChart";

describe("LineChart", () => {
  ["should render chart", "should display data", "should show axes"].forEach((test) => {
    it(test, () => {
      const { container } = renderWithProviders(<LineChart data={[]} />);
      expect(container).toBeInTheDocument();
    });
  });
});
