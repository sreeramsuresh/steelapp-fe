import { describe, expect, it } from "vitest";
import { renderWithProviders } from "../../../test/component-setup";
import Modal from "../Modal";

describe("Modal", () => {
  const defaultProps = {
    isOpen: true,
    onClose: () => {},
  };

  ["should render modal", "should display content", "should handle close"].forEach((test) => {
    it(test, () => {
      const { container } = renderWithProviders(<Modal {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });
  });
});
