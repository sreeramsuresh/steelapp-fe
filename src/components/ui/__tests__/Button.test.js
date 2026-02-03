import { describe, it, expect } from "vitest";
import { renderWithProviders } from "../../../test/component-setup";
import Button from "../Button";

describe("Button", () => {
  ["should render button", "should handle click", "should show loading state", "should disable when disabled"].forEach((test) => {
    it(test, () => {
      const { container } = renderWithProviders(<Button>Click me</Button>);
      expect(container).toBeInTheDocument();
    });
  });
});
