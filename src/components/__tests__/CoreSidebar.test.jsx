/**
 * CoreSidebar Component Tests
 * Phase 3C: Core layout component
 */

import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders, setupUser } from "../../test/component-setup";

// Mock react-router-dom
vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: "/app/invoices", search: "" }),
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

// Mock auth service
vi.mock("../../services/axiosAuthService", () => ({
  authService: {
    hasRole: vi.fn().mockReturnValue(true),
    hasPermission: vi.fn().mockReturnValue(true),
  },
}));

import CoreSidebar from "../CoreSidebar";

describe("CoreSidebar", () => {
  let mockOnToggle;

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnToggle = vi.fn();
    // Mock ResizeObserver
    global.ResizeObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));
  });

  describe("Rendering", () => {
    it("should render without crash", () => {
      const { container } = renderWithProviders(
        <CoreSidebar isOpen={true} onToggle={mockOnToggle} />
      );
      expect(container).toBeTruthy();
    });

    it("should display company branding", () => {
      const { container } = renderWithProviders(
        <CoreSidebar isOpen={true} onToggle={mockOnToggle} />
      );
      expect(container.textContent).toContain("ULTIMATE STEELS");
      expect(container.textContent).toContain("Business Management");
    });

    it("should render navigation section headers", () => {
      const { container } = renderWithProviders(
        <CoreSidebar isOpen={true} onToggle={mockOnToggle} />
      );
      expect(container.textContent).toContain("Sales");
      expect(container.textContent).toContain("Purchases");
      expect(container.textContent).toContain("Finance");
      expect(container.textContent).toContain("Inventory");
    });

    it("should render navigation items", () => {
      const { container } = renderWithProviders(
        <CoreSidebar isOpen={true} onToggle={mockOnToggle} />
      );
      expect(container.textContent).toContain("Invoices");
      expect(container.textContent).toContain("Customers");
      expect(container.textContent).toContain("Products");
      expect(container.textContent).toContain("Warehouses");
    });

    it("should render links with correct paths", () => {
      const { container } = renderWithProviders(
        <CoreSidebar isOpen={true} onToggle={mockOnToggle} />
      );

      const invoiceLink = container.querySelector('a[href="/app/invoices"]');
      const customerLink = container.querySelector('a[href="/app/customers"]');
      expect(invoiceLink).toBeInTheDocument();
      expect(customerLink).toBeInTheDocument();
    });
  });

  describe("Open/Close State", () => {
    it("should apply translate-x-0 when open", () => {
      const { container } = renderWithProviders(
        <CoreSidebar isOpen={true} onToggle={mockOnToggle} />
      );

      const sidebar = container.firstChild;
      expect(sidebar.className).toContain("translate-x-0");
    });

    it("should apply -translate-x-full when closed", () => {
      const { container } = renderWithProviders(
        <CoreSidebar isOpen={false} onToggle={mockOnToggle} />
      );

      const sidebar = container.firstChild;
      expect(sidebar.className).toContain("-translate-x-full");
    });
  });

  describe("Navigation Sections", () => {
    it("should render Analytics Hub link", () => {
      const { container } = renderWithProviders(
        <CoreSidebar isOpen={true} onToggle={mockOnToggle} />
      );
      expect(container.textContent).toContain("Analytics Hub");
    });

    it("should render Settings section", () => {
      const { container } = renderWithProviders(
        <CoreSidebar isOpen={true} onToggle={mockOnToggle} />
      );
      expect(container.textContent).toContain("Company Settings");
      expect(container.textContent).toContain("User Management");
      expect(container.textContent).toContain("Audit Trail");
    });

    it("should render Trade section", () => {
      const { container } = renderWithProviders(
        <CoreSidebar isOpen={true} onToggle={mockOnToggle} />
      );
      expect(container.textContent).toContain("Import / Export");
      expect(container.textContent).toContain("Containers");
    });
  });

  describe("Scroll Indicators", () => {
    it("should render scroll indicator buttons", () => {
      const { container } = renderWithProviders(
        <CoreSidebar isOpen={true} onToggle={mockOnToggle} />
      );

      const scrollTopBtn = container.querySelector('[aria-label="Scroll to top"]');
      const scrollBottomBtn = container.querySelector('[aria-label="Scroll to bottom"]');
      expect(scrollTopBtn).toBeInTheDocument();
      expect(scrollBottomBtn).toBeInTheDocument();
    });
  });
});
