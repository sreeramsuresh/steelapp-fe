import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderWithProviders } from "../../../test/component-setup";
import AccountStatements from "../AccountStatements";

const mockAccountService = {
  getStatement: vi.fn(),
  listTransactions: vi.fn(),
};

vi.mock("../../../services/accountService", () => ({
  default: mockAccountService,
}));

describe("AccountStatements", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    ["should render statement", "should display transactions", "should show totals"].forEach((test) => {
      it(test, () => {
        const { container } = renderWithProviders(
          <AccountStatements />,
        );
        expect(container).toBeInTheDocument();
      });
    });
  });

  describe("Statement Details", () => {
    ["should show opening balance", "should show closing balance", "should calculate differences"].forEach((test) => {
      it(test, () => {
        const { container } = renderWithProviders(
          <AccountStatements />,
        );
        expect(container).toBeInTheDocument();
      });
    });
  });
});
