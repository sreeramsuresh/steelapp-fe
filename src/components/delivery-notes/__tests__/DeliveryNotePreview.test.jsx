import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false, toggleTheme: vi.fn() }),
}));

vi.mock("../../../constants/defaultTemplateSettings", () => ({
  getDocumentTemplateColor: () => "#3b82f6",
}));

vi.mock("../../../utils/invoiceUtils", () => ({
  TIMEZONE_DISCLAIMER: "All times in UAE timezone",
  toUAEDateProfessional: (d) => d || "-",
}));

vi.mock("../../../utils/recordUtils", () => ({
  validateDeliveryNoteForDownload: () => ({ isValid: true, errors: [], warnings: [] }),
}));

import DeliveryNotePreview from "../DeliveryNotePreview";

const mockDeliveryNote = {
  deliveryNoteNumber: "DN-001",
  status: "pending",
  customerName: "ABC Corp",
  invoiceNumber: "INV-001",
  vehicleNumber: "ABC 1234",
  driverName: "Ahmed",
  items: [{ productName: "SS-304-Sheet", quantity: 50, weight: 500, unit: "KG" }],
};

const mockCompany = {
  name: "Test Company",
  settings: {},
};

describe("DeliveryNotePreview", () => {
  it("renders without crashing", () => {
    const { container } = render(
      <DeliveryNotePreview deliveryNote={mockDeliveryNote} company={mockCompany} onClose={vi.fn()} />
    );
    expect(container).toBeTruthy();
  });
});
