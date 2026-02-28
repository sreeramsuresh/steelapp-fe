import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false, toggleTheme: vi.fn() }),
}));

vi.mock("../../../services/api", () => ({
  apiClient: {
    get: vi.fn().mockResolvedValue({
      receipt_size: "A5",
      print_on_paper_size: "A4",
      receipt_printer: "default",
      invoice_printer: "default",
      receipt_copies: 1,
      invoice_copies: 1,
      auto_print_receipts: false,
      auto_print_invoices: false,
    }),
    put: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock("../../../services/notificationService", () => ({
  notificationService: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

import PrintingSettingsTab from "../PrintingSettingsTab";

describe("PrintingSettingsTab", () => {
  it("renders without crashing", () => {
    const { container } = render(<PrintingSettingsTab />);
    expect(container).toBeTruthy();
  });

  it("displays the section header", () => {
    render(<PrintingSettingsTab />);
    expect(screen.getByText("Printing & Document Settings")).toBeInTheDocument();
  });

  it("renders payment receipt settings section", () => {
    render(<PrintingSettingsTab />);
    expect(screen.getByText("Payment Receipt Settings")).toBeInTheDocument();
  });
});
