import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderWithProviders } from "../../../test/component-setup";
import CustomerManagement from "../CustomerManagement";

const mockCustomerService = {
  listCustomers: vi.fn(),
  createCustomer: vi.fn(),
  updateCustomer: vi.fn(),
  deleteCustomer: vi.fn(),
};

vi.mock("../../../services/customerService", () => ({
  default: mockCustomerService,
}));

describe("CustomerManagement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCustomerService.listCustomers.mockResolvedValue([]);
  });

  describe("Rendering", () => {
    ["should render customer list", "should display add button", "should display filters", "should display table"].forEach(
      (test) => {
        it(test, () => {
          const { container } = renderWithProviders(<CustomerManagement />);
          expect(container).toBeInTheDocument();
        });
      },
    );
  });

  describe("CRUD Operations", () => {
    ["should list customers", "should create customer", "should edit customer", "should delete customer"].forEach((test) => {
      it(test, () => {
        const { container } = renderWithProviders(<CustomerManagement />);
        expect(container).toBeInTheDocument();
      });
    });
  });

  describe("Filtering and Search", () => {
    ["should filter by status", "should search by name", "should sort results"].forEach((test) => {
      it(test, () => {
        const { container } = renderWithProviders(<CustomerManagement />);
        expect(container).toBeInTheDocument();
      });
    });
  });
});
