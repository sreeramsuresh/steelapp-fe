import { render, screen, waitFor } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../../../contexts/ThemeContext", () => ({
  useTheme: () => ({ isDarkMode: false }),
}));

const mockGet = vi.fn();
const mockPost = vi.fn();
vi.mock("../../../services/api", () => ({
  default: {
    get: (...args) => mockGet(...args),
    post: (...args) => mockPost(...args),
  },
}));

vi.mock("../../../utils/invoiceUtils", () => ({
  formatDate: (d) => d || "N/A",
}));

vi.mock("lucide-react", () => ({
  AlertTriangle: (props) => <svg {...props} />,
  Bell: (props) => <svg {...props} />,
  Calendar: (props) => <svg {...props} />,
  DollarSign: (props) => <svg {...props} />,
  Mail: (props) => <svg {...props} />,
  MessageSquare: (props) => <svg {...props} />,
  Phone: (props) => <svg {...props} />,
  Plus: (props) => <svg {...props} />,
  RefreshCw: (props) => <svg {...props} />,
  Search: (props) => <svg {...props} />,
  X: (props) => <svg {...props} />,
}));

import CustomerActivityTab from "../tabs/CustomerActivityTab";

describe("CustomerActivityTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows loading state initially", () => {
    mockGet.mockReturnValue(new Promise(() => {}));
    render(<CustomerActivityTab customerId={1} />);
    // Loading is indicated by the spinner
    expect(document.querySelector(".animate-spin")).toBeTruthy();
  });

  it("shows empty state when no activities", async () => {
    mockGet.mockResolvedValue({ data: [] });
    render(<CustomerActivityTab customerId={1} />);
    await waitFor(() => {
      expect(screen.getByText("No Activities Yet")).toBeInTheDocument();
    });
  });

  it("renders activity timeline title", async () => {
    mockGet.mockResolvedValue({ data: [] });
    render(<CustomerActivityTab customerId={1} />);
    await waitFor(() => {
      expect(screen.getByText("Customer Activity Timeline")).toBeInTheDocument();
    });
  });

  it("renders refresh button", async () => {
    mockGet.mockResolvedValue({ data: [] });
    render(<CustomerActivityTab customerId={1} />);
    await waitFor(() => {
      expect(screen.getByText("Refresh")).toBeInTheDocument();
    });
  });

  it("renders add activity button", async () => {
    mockGet.mockResolvedValue({ data: [] });
    render(<CustomerActivityTab customerId={1} />);
    await waitFor(() => {
      expect(screen.getByText("Add Activity")).toBeInTheDocument();
    });
  });

  it("shows add activity form when button is clicked", async () => {
    mockGet.mockResolvedValue({ data: [] });
    render(<CustomerActivityTab customerId={1} />);
    await waitFor(() => {
      fireEvent.click(screen.getByText("Add Activity"));
    });
    expect(screen.getByText("Add New Activity")).toBeInTheDocument();
  });

  it("renders activity type filter", async () => {
    mockGet.mockResolvedValue({ data: [] });
    render(<CustomerActivityTab customerId={1} />);
    await waitFor(() => {
      expect(screen.getByLabelText("Activity Type")).toBeInTheDocument();
    });
  });
});
