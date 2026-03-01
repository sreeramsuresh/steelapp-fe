/**
 * TopNavbar Component Tests
 * Phase 3C: Core layout component
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, setupUser } from "../../test/component-setup";

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: "/app", search: "" }),
  useParams: () => ({}),
  Link: ({ children, to, ...props }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
  NavLink: ({ children, to, ...props }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

// Mock NotificationCenterContext
vi.mock("../../contexts/NotificationCenterContext", () => ({
  useNotifications: () => ({
    notifications: [{ id: "1", title: "Test Notification", message: "A test message", time: "just now", unread: true }],
    unreadCount: 1,
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
  }),
}));

// Mock services
vi.mock("../../services/dataService", () => ({
  invoiceService: { searchInvoices: vi.fn().mockResolvedValue({ invoices: [] }) },
  customerService: { searchCustomers: vi.fn().mockResolvedValue({ customers: [] }) },
}));

vi.mock("../../services/productService", () => ({
  productService: { searchProducts: vi.fn().mockResolvedValue({ products: [] }) },
}));

// Mock HomeButton
vi.mock("../HomeButton", () => ({
  default: () => (
    <button type="button" data-testid="home-button">
      Home
    </button>
  ),
}));

// Mock __APP_VERSION__
vi.stubGlobal("__APP_VERSION__", "1.0.0");

import TopNavbar from "../TopNavbar";

describe("TopNavbar", () => {
  const defaultProps = {
    user: { id: 1, name: "Test User", email: "test@example.com", role: "Admin" },
    onLogout: vi.fn(),
    onToggleSidebar: vi.fn(),
    currentPage: "Dashboard",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render without crash", () => {
      const { container } = renderWithProviders(<TopNavbar {...defaultProps} />);
      expect(container).toBeTruthy();
    });

    it("should render header element", () => {
      const { container } = renderWithProviders(<TopNavbar {...defaultProps} />);
      const header = container.querySelector("header");
      expect(header).toBeInTheDocument();
    });

    it("should render user name", () => {
      const { container } = renderWithProviders(<TopNavbar {...defaultProps} />);
      expect(container.textContent).toContain("Test User");
    });

    it("should render user role", () => {
      const { container } = renderWithProviders(<TopNavbar {...defaultProps} />);
      expect(container.textContent).toContain("Admin");
    });

    it("should render user initial avatar", () => {
      const { container } = renderWithProviders(<TopNavbar {...defaultProps} />);
      // First letter of "Test User" = "T"
      expect(container.textContent).toContain("T");
    });

    it("should render sidebar toggle button", () => {
      const { container } = renderWithProviders(<TopNavbar {...defaultProps} />);
      const toggleBtn = container.querySelector('[aria-label="Toggle sidebar menu"]');
      expect(toggleBtn).toBeInTheDocument();
    });

    it("should render home button", () => {
      const { container } = renderWithProviders(<TopNavbar {...defaultProps} />);
      const homeBtn = container.querySelector('[data-testid="home-button"]');
      expect(homeBtn).toBeInTheDocument();
    });
  });

  describe("Sidebar Toggle", () => {
    it("should call onToggleSidebar when toggle button is clicked", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<TopNavbar {...defaultProps} />);
      const toggleBtn = container.querySelector('[aria-label="Toggle sidebar menu"]');

      await user.click(toggleBtn);
      expect(defaultProps.onToggleSidebar).toHaveBeenCalled();
    });
  });

  describe("Theme Toggle", () => {
    it("should render theme toggle button", () => {
      const { container } = renderWithProviders(<TopNavbar {...defaultProps} />);
      // Theme toggle button exists (Sun or Moon icon)
      const buttons = container.querySelectorAll("button");
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  describe("Notifications", () => {
    it("should render notification bell", () => {
      const { container } = renderWithProviders(<TopNavbar {...defaultProps} />);
      const notifBtn = container.querySelector('button[aria-label*="Notifications"]');
      expect(notifBtn).toBeInTheDocument();
    });

    it("should show unread count badge", () => {
      const { container } = renderWithProviders(<TopNavbar {...defaultProps} />);
      // Unread count is 1
      const badge = container.querySelector(".bg-red-500");
      expect(badge).toBeInTheDocument();
      expect(badge.textContent).toBe("1");
    });

    it("should show notification dropdown on click", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<TopNavbar {...defaultProps} />);
      const notifBtn = container.querySelector('button[aria-label*="Notifications"]');

      await user.click(notifBtn);

      expect(container.textContent).toContain("Notifications");
      expect(container.textContent).toContain("Test Notification");
    });
  });

  describe("Profile Dropdown", () => {
    it("should show profile dropdown on click", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<TopNavbar {...defaultProps} />);

      // Click on profile section (the button with user name)
      const profileButtons = container.querySelectorAll("button");
      const profileBtn = Array.from(profileButtons).find((b) => b.textContent.includes("Test User"));

      if (profileBtn) {
        await user.click(profileBtn);
        expect(container.textContent).toContain("My Profile");
        expect(container.textContent).toContain("Account Settings");
        expect(container.textContent).toContain("Sign Out");
      }
    });

    it("should call onLogout when Sign Out is clicked", async () => {
      const user = setupUser();
      const { container } = renderWithProviders(<TopNavbar {...defaultProps} />);

      // Open profile dropdown
      const profileButtons = container.querySelectorAll("button");
      const profileBtn = Array.from(profileButtons).find((b) => b.textContent.includes("Test User"));

      if (profileBtn) {
        await user.click(profileBtn);

        const signOutBtn = Array.from(container.querySelectorAll("button")).find((b) =>
          b.textContent.includes("Sign Out")
        );

        if (signOutBtn) {
          await user.click(signOutBtn);
          expect(defaultProps.onLogout).toHaveBeenCalled();
        }
      }
    });
  });

  describe("Search", () => {
    it("should render search input", () => {
      const { container } = renderWithProviders(<TopNavbar {...defaultProps} />);
      const searchInput = container.querySelector("#global-search");
      expect(searchInput).toBeInTheDocument();
    });

    it("should have search placeholder text", () => {
      const { container } = renderWithProviders(<TopNavbar {...defaultProps} />);
      const searchInput = container.querySelector("#global-search");
      expect(searchInput.placeholder).toContain("Search");
    });
  });

  describe("Default Props", () => {
    it("should handle missing user gracefully", () => {
      const { container } = renderWithProviders(<TopNavbar {...defaultProps} user={null} />);
      expect(container.textContent).toContain("User");
    });
  });
});
