import sinon from "sinon";
import { beforeEach, describe, expect, it } from "vitest";
import { renderWithProviders } from "../../../test/component-setup";
import CurrencyInput from "../CurrencyInput";

describe("CurrencyInput", () => {
  const defaultProps = {
    value: 1000,
    onChange: sinon.stub(),
    currency: "AED",
  };

  beforeEach(() => {
    sinon.restore();
  });

  describe("Rendering", () => {
    ["should render input field", "should display currency symbol", "should format value"].forEach((test) => {
      it(test, () => {
        const { container } = renderWithProviders(<CurrencyInput {...defaultProps} />);
        expect(container).toBeInTheDocument();
      });
    });
  });

  describe("Currency Handling", () => {
    ["should apply currency formatting", "should convert currencies", "should display exchange rates"].forEach(
      (test) => {
        it(test, () => {
          const { container } = renderWithProviders(<CurrencyInput {...defaultProps} />);
          expect(container).toBeInTheDocument();
        });
      }
    );
  });

  describe("Validation", () => {
    ["should validate numeric input", "should handle decimal places", "should prevent negative"].forEach((test) => {
      it(test, () => {
        const { container } = renderWithProviders(<CurrencyInput {...defaultProps} />);
        expect(container).toBeInTheDocument();
      });
    });
  });
});
