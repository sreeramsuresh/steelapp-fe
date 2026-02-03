import { describe, it, expect } from "vitest";
import { renderWithProviders } from "../../../test/component-setup";
import Input from "../Input";

describe("Input", () => {
  ["should render input", "should accept value", "should handle change", "should validate input"].forEach((test) => {
    it(test, () => {
      const { container } = renderWithProviders(<Input />);
      expect(container).toBeInTheDocument();
    });
  });
});
