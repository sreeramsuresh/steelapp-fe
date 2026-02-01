import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  Bell,
  Search,
  ChevronDown,
  User,
  Settings,
  LogOut,
  HelpCircle,
  Sun,
  Moon,
  Check,
  Award,
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useNotifications } from '../contexts/NotificationCenterContext';
import HomeButton from './HomeButton';

// Bug #29 fix: Format notification timestamp consistently using relative time format
const formatNotificationTime = (time) => {
  // If it's already a relative time string, return as-is
  if (typeof time === 'string' && (time.includes('ago') || time === 'just now' || time === 'Just now')) {
    // Normalize "Just now" to lowercase for consistency
    return time === 'Just now' ? 'just now' : time;
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

    if (diffSecs < 60) return 'just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks > 1 ? 's' : ''} ago`;
    // Always use relative format - never switch to absolute date format
    return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ago`;
  } catch {
    return 'just now';
  }
};

const TopNavbar = ({
  user,
  onLogout,
  onToggleSidebar,
  currentPage: _currentPage = 'Dashboard',
}) => {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] =
    useState(false);
  const profileDropdownRef = useRef(null);
  const notificationDropdownRef = useRef(null);
  const { isDarkMode, themeMode, toggleTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead } =
    useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target)
      ) {
        setShowProfileDropdown(false);
      }
      if (
        notificationDropdownRef.current &&
        !notificationDropdownRef.current.contains(event.target)
      ) {
        setShowNotificationDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
        backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
        borderBottomColor: isDarkMode ? '#374151' : '#e5e7eb',
      }}
      className="sticky top-0 z-[1001] h-16 sm:h-14 md:h-16 border-b shadow-sm"
    >
      <div className="h-full px-4 flex justify-between items-center">
        {/* Left Section */}
        <div className="flex items-center gap-2">
          <HomeButton />
          <button
            onClick={onToggleSidebar}
            style={{
              color: isDarkMode ? '#d1d5db' : '#374151',
              backgroundColor: 'transparent',
            }}
            className="md:hidden p-2 rounded-lg transition-colors duration-200 hover:opacity-75"
          >
            <Menu size={20} />
          </button>
        </div>

        {/* Center Section - Search */}
        <div className="hidden md:flex flex-1 justify-center max-w-2xl mx-4">
          <div
            style={{
              backgroundColor: isDarkMode ? '#374151' : '#f9fafb',
              borderColor: isDarkMode ? '#4b5563' : '#d1d5db',
            }}
            className="relative w-full max-w-md rounded-2xl border transition-all duration-300 hover:border-teal-500 focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20"
          >
            <div
              style={{ color: isDarkMode ? '#9ca3af' : '#6b7280' }}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none"
            >
              <Search size={16} />
            </div>
            <input
              type="text"
              placeholder={
                location.pathname.startsWith('/customers')
                  ? 'Search customers...'
                  : 'Search all items...'
              }
              style={{
                color: isDarkMode ? '#ffffff' : '#111827',
                backgroundColor: 'transparent',
              }}
              className="w-full pl-10 pr-20 py-3 border-none outline-none transition-all duration-300 placeholder-gray-400 sm:w-80 focus:w-96 lg:w-96 focus:lg:w-[28rem] xl:w-[30rem] focus:xl:w-[35rem]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const q = searchQuery.trim();
                  if (!q) return;
                  if (location.pathname.startsWith('/customers')) {
                    navigate(`/customers?search=${encodeURIComponent(q)}`);
                  } else {
                    navigate(`/search?q=${encodeURIComponent(q)}`);
                  }
                }
              }}
            />
            <button
              title="Search"
              onClick={() => {
                const q = searchQuery.trim();
                if (!q) return;
                if (location.pathname.startsWith('/customers')) {
                  navigate(`/customers?search=${encodeURIComponent(q)}`);
                } else {
                  navigate(`/search?q=${encodeURIComponent(q)}`);
                }
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
              style={{
                color: isDarkMode ? '#d1d5db' : '#065f46',
                backgroundColor: isDarkMode ? '#4b5563' : '#d1fae5',
              }}
            >
              Go
            </button>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            style={{
              color: isDarkMode ? '#d1d5db' : '#374151',
              backgroundColor: 'transparent',
            }}
            className="p-2 rounded-lg transition-colors duration-200 hover:opacity-75"
            title={themeMode === 'dark' ? 'Dark Mode' : 'Light Mode'}
          >
            {themeMode === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {/* Notifications */}
          <div className="relative" ref={notificationDropdownRef}>
            <button
              onClick={handleNotificationClick}
              style={{
                color: isDarkMode ? '#d1d5db' : '#374151',
                backgroundColor: 'transparent',
              }}
              className="relative p-2 rounded-lg transition-colors duration-200 hover:opacity-75"
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
                  backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                  borderColor: isDarkMode ? '#374151' : '#e5e7eb',
                }}
                className="absolute right-0 top-full mt-2 w-80 max-w-sm rounded-2xl border shadow-xl z-50"
              >
                <div
                  className={`p-4 border-b ${isDarkMode ? 'border-[#37474F]' : 'border-gray-200'}`}
                >
                  <div className="flex justify-between items-center">
                    <h3
                      className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                    >
                      Notifications
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded border ${
                        isDarkMode
                          ? 'text-teal-400 border-teal-600 bg-teal-900/20'
                          : 'text-teal-600 border-teal-300 bg-teal-50'
                      }`}
                    >
                      {unreadCount} new
                    </span>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className={`mt-2 inline-flex items-center gap-1 text-xs ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                      <Check size={14} /> Mark all as read
                    </button>
                  )}
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`relative p-4 border-b cursor-pointer transition-colors duration-200 ${
                        isDarkMode
                          ? 'border-[#37474F] hover:bg-gray-700/50'
                          : 'border-gray-200 hover:bg-gray-50'
                      } ${n.unread ? (isDarkMode ? 'bg-teal-900/10' : 'bg-teal-50/50') : ''} last:border-b-0`}
                      onClick={() => {
                        markAsRead(n.id);
                        if (n.link) window.location.href = n.link;
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          markAsRead(n.id);
                          if (n.link) window.location.href = n.link;
                        }
                      }}
                    >
                      <h4
                        className={`text-sm font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                      >
                        {n.title}
                      </h4>
                      <p
                        className={`text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                      >
                        {n.message}
                      </p>
                      <p
                        className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}
                      >
                        {formatNotificationTime(n.time)}
                      </p>
                      {n.unread && (
                        <div className="absolute top-4 right-4 w-2 h-2 bg-teal-500 rounded-full"></div>
                      )}
                    </div>
                  ))}
                </div>

                <div
                  className={`p-4 border-t text-center ${isDarkMode ? 'border-[#37474F]' : 'border-gray-200'}`}
                >
                  {/* Bug #30 fix: Add total notification count to button label */}
                  {/* eslint-disable-next-line local-rules/no-dead-button */}
                  <button
                    onClick={() => {
                      // TODO: Implement view all notifications functionality
                    }}
                    className={`text-sm font-medium transition-colors duration-200 hover:underline ${
                      isDarkMode
                        ? 'text-teal-400 hover:text-teal-300'
                        : 'text-teal-600 hover:text-teal-700'
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
              onClick={handleProfileClick}
              style={{
                backgroundColor: 'transparent',
              }}
              className="flex items-center gap-2 p-2 rounded-xl transition-all duration-200 hover:opacity-75"
            >
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-600 to-teal-700 flex items-center justify-center text-white text-sm font-semibold">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <div
                  style={{ color: isDarkMode ? '#ffffff' : '#111827' }}
                  className="text-sm font-medium leading-tight"
                >
                  {user?.name || 'User'}
                </div>
                <div
                  style={{ color: isDarkMode ? '#9ca3af' : '#6b7280' }}
                  className="text-xs leading-tight"
                >
                  {user?.role || 'Admin'}
                </div>
              </div>
              <ChevronDown
                size={16}
                style={{ color: isDarkMode ? '#9ca3af' : '#6b7280' }}
                className={`transition-transform duration-200 ${
                  showProfileDropdown ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Profile Dropdown - moved inside wrapper to prevent outside-click closing */}
            {showProfileDropdown && (
              <div
                style={{
                  backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                  borderColor: isDarkMode ? '#374151' : '#e5e7eb',
                }}
                className="absolute right-0 top-full mt-2 w-72 rounded-2xl border shadow-xl z-50"
              >
                <div
                  className={`p-4 border-b ${isDarkMode ? 'border-[#37474F]' : 'border-gray-200'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-teal-600 to-teal-700 flex items-center justify-center text-white text-lg font-semibold">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="flex-1">
                      <h3
                        className={`text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
                      >
                        {user?.name || 'User Name'}
                      </h3>
                      <p
                        className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}
                      >
                        {user?.email || 'user@example.com'}
                      </p>
                      <span
                        className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded border ${
                          isDarkMode
                            ? 'text-teal-400 border-teal-600 bg-teal-900/20'
                            : 'text-teal-600 border-teal-300 bg-teal-50'
                        }`}
                      >
                        {user?.role || 'Administrator'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="py-2">
                  <button
                    onClick={() => setShowProfileDropdown(false)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-200 ${
                      isDarkMode
                        ? 'text-gray-300 bg-transparent hover:bg-gray-700 hover:text-white'
                        : 'text-gray-800 bg-white hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <User size={18} />
                    <span className="text-sm font-medium">My Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowProfileDropdown(false);
                      navigate('/my-commissions');
                    }}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-200 ${
                      isDarkMode
                        ? 'text-gray-300 bg-transparent hover:bg-gray-700 hover:text-white'
                        : 'text-gray-800 bg-white hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Award size={18} />
                    <span className="text-sm font-medium">My Commissions</span>
                  </button>

                  <button
                    onClick={() => setShowProfileDropdown(false)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-200 ${
                      isDarkMode
                        ? 'text-gray-300 bg-transparent hover:bg-gray-700 hover:text-white'
                        : 'text-gray-800 bg-white hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <Settings size={18} />
                    <span className="text-sm font-medium">
                      Account Settings
                    </span>
                  </button>

                  <button
                    onClick={() => setShowProfileDropdown(false)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-200 ${
                      isDarkMode
                        ? 'text-gray-300 bg-transparent hover:bg-gray-700 hover:text-white'
                        : 'text-gray-800 bg-white hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    <HelpCircle size={18} />
                    <span className="text-sm font-medium">Help & Support</span>
                  </button>

                  <div
                    className={`my-2 border-t ${isDarkMode ? 'border-[#37474F]' : 'border-gray-200'}`}
                  ></div>

                  <button
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
