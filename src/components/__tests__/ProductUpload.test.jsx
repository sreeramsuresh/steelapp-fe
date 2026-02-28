/**
 * ProductUpload Component Tests
 */
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../test/component-setup";

vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: "/" }),
}));

vi.mock("../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
  ThemeProvider: ({ children }) => <div>{children}</div>,
}));

vi.mock("../../contexts/NotificationCenterContext", () => ({
  useNotifications: () => ({
    addNotification: vi.fn(),
  }),
}));

vi.mock("../../services/axiosApi", () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

import ProductUpload from "../ProductUpload";

describe("ProductUpload", () => {
  it("renders without crashing when open", () => {
    const { container } = renderWithProviders(
      <ProductUpload isOpen={true} onClose={vi.fn()} onUploadComplete={vi.fn()} />
    );
    expect(container).toBeTruthy();
  });
});
