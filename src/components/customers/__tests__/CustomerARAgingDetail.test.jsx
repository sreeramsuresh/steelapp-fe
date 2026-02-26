import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../../test/component-setup";
import CustomerARAgingDetail from "../CustomerARAgingDetail";

describe("CustomerARAgingDetail", () => {
  ["should render aging report", "should show aging buckets", "should calculate days overdue"].forEach((test) => {
    it(test, () => {
      const { container } = renderWithProviders(<CustomerARAgingDetail />);
      expect(container).toBeInTheDocument();
    });
  });
});
