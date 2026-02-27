import {
  Award,
  Bell,
  Check,
  ChevronDown,
  FileText,
  HelpCircle,
  Loader2,
  LogOut,
  Menu,
  Moon,
  Package,
  Search,
  Settings,
  Sun,
  User,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../contexts/NotificationCenterContext";
import { useTheme } from "../contexts/ThemeContext";
import { customerService, invoiceService } from "../services/dataService";
import { productService } from "../services/productService";
import HomeButton from "./HomeButton";

// Bug #29 fix: Format notification timestamp consistently using relative time format
const formatNotificationTime = (time) => {
  // If it's already a relative time string, return as-is
  if (typeof time === "string" && (time.includes("ago") || time === "just now" || time === "Just now")) {
    // Normalize "Just now" to lowercase for consistency
    return time === "Just now" ? "just now" : time;
  }

  // Parse ISO format timestamp
  try {
    const date = new Date(time);
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);

    if (diffSecs < 60) return "just now";
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks > 1 ? "s" : ""} ago`;
    // Always use relative format - never switch to absolute date format
    return `${diffMonths} month${diffMonths > 1 ? "s" : ""} ago`;
  } catch {
    return "just now";
  }
};

const SEARCH_GROUPS = [
  {
    key: "invoices",
    label: "Invoices",
    icon: FileText,
    path: (item) => `/app/invoices/${item.id}`,
    display: (item) => item.invoiceNumber,
    sub: (item) => item.customer?.name || "—",
  },
  {
    key: "customers",
    label: "Customers",
    icon: Users,
    path: (item) => `/app/customers/${item.id}`,
    display: (item) => item.name,
    sub: (item) => item.email || item.city || "—",
  },
  {
    key: "products",
    label: "Products",
    icon: Package,
    path: (item) => `/app/products/${item.id}`,
    display: (item) => item.name,
    sub: (item) => item.category || item.form || "—",
  },
];

const TopNavbar = ({ user, onLogout, onToggleSidebar, currentPage: _currentPage = "Dashboard" }) => {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const profileDropdownRef = useRef(null);
  const notificationDropdownRef = useRef(null);
  const { isDarkMode, themeMode, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState({ invoices: [], customers: [], products: [] });
  const [activeIndex, setActiveIndex] = useState(-1);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  // Flatten results for keyboard nav
  const flatResults = SEARCH_GROUPS.flatMap((g) => searchResults[g.key].map((item) => ({ group: g, item })));

  const runSearch = useCallback(async (q) => {
    if (q.length < 2) {
      setSearchResults({ invoices: [], customers: [], products: [] });
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    try {
      const [inv, cust, prod] = await Promise.all([
        invoiceService.searchInvoices(q).catch(() => ({})),
        customerService.searchCustomers(q).catch(() => ({})),
        productService.searchProducts(q).catch(() => ({})),
      ]);
      setSearchResults({
        invoices: (Array.isArray(inv?.invoices) ? inv.invoices : []).slice(0, 4),
        customers: (Array.isArray(cust?.customers) ? cust.customers : []).slice(0, 4),
        products: (Array.isArray(prod?.products) ? prod.products : []).slice(0, 4),
      });
    } catch {
      // silently ignore
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // Debounce
  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (searchQuery.trim().length >= 2) {
      debounceRef.current = setTimeout(() => runSearch(searchQuery.trim()), 300);
    } else {
      setSearchResults({ invoices: [], customers: [], products: [] });
    }
    return () => clearTimeout(debounceRef.current);
  }, [searchQuery, runSearch]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setShowProfileDropdown(false);
      }
      if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(event.target)) {
        setShowNotificationDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchKeyDown = (e) => {
    if (!searchOpen) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, flatResults.length - 1 + 1)); // +1 for "see all"
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Escape") {
      setSearchOpen(false);
      setActiveIndex(-1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const q = searchQuery.trim();
      if (!q) return;
      if (activeIndex >= 0 && activeIndex < flatResults.length) {
        const { group, item } = flatResults[activeIndex];
        navigate(group.path(item));
      } else {
        navigate(`/app/search?q=${encodeURIComponent(q)}`);
      }
      setSearchOpen(false);
      setSearchQuery("");
      setActiveIndex(-1);
    }
  };

  const handleResultClick = (path) => {
    navigate(path);
    setSearchOpen(false);
    setSearchQuery("");
    setActiveIndex(-1);
  };

  const handleViewAll = () => {
    const q = searchQuery.trim();
    if (q) navigate(`/app/search?q=${encodeURIComponent(q)}`);
    setSearchOpen(false);
    setSearchQuery("");
    setActiveIndex(-1);
  };

  const handleProfileClick = () => {
    setShowProfileDropdown(!showProfileDropdown);
    setShowNotificationDropdown(false);
  };

  const handleNotificationClick = () => {
    setShowNotificationDropdown(!showNotificationDropdown);
    setShowProfileDropdown(false);
  };

  const handleLogout = () => {
    // console.log('🚨 TopNavbar handleLogout clicked!');
    // console.log('🚨 onLogout function:', typeof onLogout);
    setShowProfileDropdown(false);
    // console.log('🚨 About to call onLogout...');
    onLogout();
    // console.log('🚨 onLogout called successfully');
  };

  // Notifications are provided by context now

  return (
    <header
      style={{
        backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
        borderBottomColor: isDarkMode ? "#374151" : "#e5e7eb",
      }}
      className="sticky top-0 z-[1001] h-16 sm:h-14 md:h-16 border-b shadow-sm"
    >
      <div className="h-full px-4 flex justify-between items-center">
        {/* Left Section */}
        <div className="flex items-center gap-2">
          <HomeButton />
          <button
            type="button"
            onClick={onToggleSidebar}
            style={{
              color: isDarkMode ? "#d1d5db" : "#374151",
              backgroundColor: "transparent",
            }}
            className="md:hidden p-2 rounded-lg transition-colors duration-200 hover:opacity-75"
            aria-label="Toggle sidebar menu"
          >
            <Menu size={20} />
          </button>
        </div>

        {/* Center Section - Instant Search */}
        <div className="hidden md:flex flex-1 justify-center max-w-2xl mx-4" ref={searchRef}>
          <div className="relative w-full max-w-lg">
            {/* Input */}
            <div
              style={{
                backgroundColor: isDarkMode ? "#374151" : "#f9fafb",
                borderColor: searchOpen ? "#0d9488" : isDarkMode ? "#4b5563" : "#d1d5db",
                boxShadow: searchOpen ? "0 0 0 3px rgba(13,148,136,0.15)" : "none",
              }}
              className="flex items-center rounded-2xl border transition-all duration-200"
            >
              <div
                style={{ color: isDarkMode ? "#9ca3af" : "#6b7280" }}
                className="pl-3 pointer-events-none flex-shrink-0"
              >
                {searchLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              </div>
              <input
                id="global-search"
                type="text"
                placeholder="Search invoices, customers, products…"
                autoComplete="off"
                style={{ color: isDarkMode ? "#ffffff" : "#111827", backgroundColor: "transparent" }}
                className="w-full pl-2 pr-3 py-2.5 border-none outline-none text-sm placeholder-gray-400"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSearchOpen(true);
                  setActiveIndex(-1);
                }}
                onFocus={() => setSearchOpen(true)}
                onKeyDown={handleSearchKeyDown}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSearchOpen(false);
                    setSearchResults({ invoices: [], customers: [], products: [] });
                  }}
                  style={{ color: isDarkMode ? "#9ca3af" : "#6b7280" }}
                  className="pr-3 hover:opacity-75 text-lg leading-none flex-shrink-0"
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>

            {/* Dropdown */}
            {searchOpen && searchQuery.trim().length >= 2 && (
              <div
                style={{
                  backgroundColor: isDarkMode ? "#1e2328" : "#ffffff",
                  borderColor: isDarkMode ? "#374151" : "#e5e7eb",
                }}
                className="absolute top-full mt-2 left-0 right-0 rounded-xl border shadow-2xl z-[1100] overflow-hidden"
              >
                {searchLoading && flatResults.length === 0 ? (
                  <div className="flex items-center justify-center gap-2 py-8">
                    <Loader2 size={18} className="animate-spin text-teal-600" />
                    <span style={{ color: isDarkMode ? "#9ca3af" : "#6b7280" }} className="text-sm">
                      Searching…
                    </span>
                  </div>
                ) : flatResults.length === 0 ? (
                  <div className="py-8 text-center">
                    <p style={{ color: isDarkMode ? "#9ca3af" : "#6b7280" }} className="text-sm">
                      No results for "{searchQuery.trim()}"
                    </p>
                  </div>
                ) : (
                  <div className="py-1 max-h-[480px] overflow-y-auto">
                    {SEARCH_GROUPS.map((group) => {
                      const items = searchResults[group.key];
                      if (items.length === 0) return null;
                      return (
                        <div key={group.key}>
                          {/* Group header */}
                          <div
                            style={{ color: isDarkMode ? "#6b7280" : "#9ca3af" }}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider"
                          >
                            <group.icon size={11} />
                            {group.label}
                          </div>
                          {items.map((item) => {
                            const globalIdx = flatResults.findIndex(
                              (r) => r.group.key === group.key && r.item === item
                            );
                            const isActive = activeIndex === globalIdx;
                            return (
                              <button
                                type="button"
                                key={item.id}
                                onMouseEnter={() => setActiveIndex(globalIdx)}
                                onClick={() => handleResultClick(group.path(item))}
                                style={{
                                  backgroundColor: isActive ? (isDarkMode ? "#2d3748" : "#f0fdf4") : "transparent",
                                  color: isDarkMode ? "#e5e7eb" : "#111827",
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2 text-left transition-colors duration-100"
                              >
                                <group.icon size={14} className="flex-shrink-0 text-teal-600" />
                                <div className="min-w-0">
                                  <div className="text-sm font-medium truncate">{group.display(item)}</div>
                                  <div
                                    style={{ color: isDarkMode ? "#6b7280" : "#9ca3af" }}
                                    className="text-xs truncate"
                                  >
                                    {group.sub(item)}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                )}
                {/* Footer */}
                <div style={{ borderTopColor: isDarkMode ? "#374151" : "#e5e7eb" }} className="border-t">
                  <button
                    type="button"
                    onMouseEnter={() => setActiveIndex(flatResults.length)}
                    onClick={handleViewAll}
                    style={{
                      backgroundColor:
                        activeIndex === flatResults.length ? (isDarkMode ? "#2d3748" : "#f0fdf4") : "transparent",
                      color: isDarkMode ? "#34d399" : "#0d9488",
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium transition-colors duration-100"
                  >
                    <span>See all results for "{searchQuery.trim()}"</span>
                    <span className="text-xs opacity-60">↵ Enter</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            style={{
              color: isDarkMode ? "#d1d5db" : "#374151",
              backgroundColor: "transparent",
            }}
            className="p-2 rounded-lg transition-colors duration-200 hover:opacity-75"
            title={themeMode === "dark" ? "Dark Mode" : "Light Mode"}
          >
            {themeMode === "dark" ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {/* Notifications */}
          <div className="relative" ref={notificationDropdownRef}>
            <button
              type="button"
              onClick={handleNotificationClick}
              style={{
                color: isDarkMode ? "#d1d5db" : "#374151",
                backgroundColor: "transparent",
              }}
              className="relative p-2 rounded-lg transition-colors duration-200 hover:opacity-75"
              aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : "Notifications"}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-5 h-5 flex items-center justify-center font-medium">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown - moved inside wrapper to prevent outside-click closing */}
            {showNotificationDropdown && (
              <div
                style={{
                  backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
                  borderColor: isDarkMode ? "#374151" : "#e5e7eb",
                }}
                className="absolute right-0 top-full mt-2 w-80 max-w-sm rounded-2xl border shadow-xl z-50"
              >
                <div className={`p-4 border-b ${isDarkMode ? "border-[#37474F]" : "border-gray-200"}`}>
                  <div className="flex justify-between items-center">
                    <h3 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      Notifications
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded border ${
                        isDarkMode
                          ? "text-teal-400 border-teal-600 bg-teal-900/20"
                          : "text-teal-600 border-teal-300 bg-teal-50"
                      }`}
                    >
                      {unreadCount} new
                    </span>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllAsRead}
                      className={`mt-2 inline-flex items-center gap-1 text-xs ${isDarkMode ? "text-gray-300 hover:text-white" : "text-gray-600 hover:text-gray-900"}`}
                    >
                      <Check size={14} /> Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((n) => (
                    <button
                      type="button"
                      key={n.id}
                      className={`relative w-full p-4 border-b cursor-pointer transition-colors duration-200 text-left border-0 bg-transparent ${
                        isDarkMode ? "border-[#37474F] hover:bg-gray-700/50" : "border-gray-200 hover:bg-gray-50"
                      } ${n.unread ? (isDarkMode ? "bg-teal-900/10" : "bg-teal-50/50") : ""} last:border-b-0`}
                      onClick={() => {
                        markAsRead(n.id);
                        if (n.link) window.location.href = n.link;
                      }}
                    >
                      <h4 className={`text-sm font-semibold mb-1 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                        {n.title}
                      </h4>
                      <p className={`text-sm mb-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>{n.message}</p>
                      <p className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                        {formatNotificationTime(n.time)}
                      </p>
                      {n.unread && <div className="absolute top-4 right-4 w-2 h-2 bg-teal-500 rounded-full"></div>}
                    </button>
                  ))}
                </div>

                <div className={`p-4 border-t text-center ${isDarkMode ? "border-[#37474F]" : "border-gray-200"}`}>
                  {/* Bug #30 fix: Add total notification count to button label */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowNotificationDropdown(false);
                      navigate("/app/notifications");
                    }}
                    className={`text-sm font-medium transition-colors duration-200 hover:underline ${
                      isDarkMode ? "text-teal-400 hover:text-teal-300" : "text-teal-600 hover:text-teal-700"
                    }`}
                  >
                    View all notifications ({notifications.length})
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Profile Section */}
          <div className="relative" ref={profileDropdownRef}>
            <button
              type="button"
              onClick={handleProfileClick}
              style={{
                backgroundColor: "transparent",
              }}
              className="flex items-center gap-2 p-2 rounded-xl transition-all duration-200 hover:opacity-75"
            >
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-600 to-teal-700 flex items-center justify-center text-white text-sm font-semibold">
                {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="hidden sm:block text-left">
                <div
                  style={{ color: isDarkMode ? "#ffffff" : "#111827" }}
                  className="text-sm font-medium leading-tight"
                >
                  {user?.name || "User"}
                </div>
                <div style={{ color: isDarkMode ? "#9ca3af" : "#6b7280" }} className="text-xs leading-tight">
                  {user?.role || "Admin"}
                </div>
              </div>
              <ChevronDown
                size={16}
                style={{ color: isDarkMode ? "#9ca3af" : "#6b7280" }}
                className={`transition-transform duration-200 ${showProfileDropdown ? "rotate-180" : ""}`}
              />
            </button>

            {/* Profile Dropdown - moved inside wrapper to prevent outside-click closing */}
            {showProfileDropdown && (
              <div
                style={{
                  backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
                  borderColor: isDarkMode ? "#374151" : "#e5e7eb",
                }}
                className="absolute right-0 top-full mt-2 w-72 rounded-2xl border shadow-xl z-50"
              >
                <div className={`p-4 border-b ${isDarkMode ? "border-[#37474F]" : "border-gray-200"}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-teal-600 to-teal-700 flex items-center justify-center text-white text-lg font-semibold">
                      {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                    </div>
                    <div className="flex-1">
                      <h3 className={`text-base font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                        {user?.name || "User Name"}
                      </h3>
                      <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                        {user?.email || "user@example.com"}
                      </p>
                      <span
                        className={`inline-block px-2 py-0.5 text-xs font-medium rounded border ${
                          isDarkMode
                            ? "text-teal-400 border-teal-600 bg-teal-900/20"
                            : "text-teal-600 border-teal-300 bg-teal-50"
                        }`}
                      >
                        {user?.role || "Administrator"}
                      </span>
                      <div style={{ fontSize: '11px', color: '#999', marginTop: '2px' }}>
                        v{__APP_VERSION__}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="py-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileDropdown(false);
                      navigate("/app/profile");
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-200 ${
                      isDarkMode
                        ? "text-gray-300 bg-transparent hover:bg-gray-700 hover:text-white"
                        : "text-gray-800 bg-white hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <User size={18} />
                    <span className="text-sm font-medium">My Profile</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileDropdown(false);
                      navigate("/app/my-commissions");
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-200 ${
                      isDarkMode
                        ? "text-gray-300 bg-transparent hover:bg-gray-700 hover:text-white"
                        : "text-gray-800 bg-white hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <Award size={18} />
                    <span className="text-sm font-medium">My Commissions</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileDropdown(false);
                      navigate("/app/settings");
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-200 ${
                      isDarkMode
                        ? "text-gray-300 bg-transparent hover:bg-gray-700 hover:text-white"
                        : "text-gray-800 bg-white hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <Settings size={18} />
                    <span className="text-sm font-medium">Account Settings</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowProfileDropdown(false)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-200 ${
                      isDarkMode
                        ? "text-gray-300 bg-transparent hover:bg-gray-700 hover:text-white"
                        : "text-gray-800 bg-white hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <HelpCircle size={18} />
                    <span className="text-sm font-medium">Help & Support</span>
                  </button>

                  <div className={`my-2 border-t ${isDarkMode ? "border-[#37474F]" : "border-gray-200"}`}></div>

                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-500 bg-white hover:bg-red-50 dark:bg-transparent dark:hover:bg-red-900/20 transition-colors duration-200"
                  >
                    <LogOut size={18} />
                    <span className="text-sm font-medium">Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dropdowns moved inside their respective wrappers above */}
      </div>
    </header>
  );
};

export default TopNavbar;
