import React, { useState, useRef, useEffect } from 'react';
import { Menu, Bell, Search, ChevronDown, User, Settings, LogOut, HelpCircle, Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';


const TopNavbar = ({ user, onLogout, onToggleSidebar, currentPage = "Dashboard" }) => {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const profileDropdownRef = useRef(null);
  const notificationDropdownRef = useRef(null);
  const { isDarkMode, themeMode, toggleTheme } = useTheme();

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
    setShowProfileDropdown(false);
    onLogout();
  };

  // Mock notifications (you can replace with real data)
  const notifications = [
    { id: 1, title: "New invoice created", message: "Invoice #INV-001 has been generated", time: "2 min ago", unread: true },
    { id: 2, title: "Payment received", message: "Payment for Invoice #INV-002 received", time: "1 hour ago", unread: true },
    { id: 3, title: "System update", message: "Application updated to version 2.1.0", time: "2 hours ago", unread: false },
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <header className={`sticky top-0 z-[1001] h-16 sm:h-14 md:h-16 border-b shadow-sm ${
      isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-gray-200'
    }`}>
      <div className="h-full px-4 flex justify-between items-center">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <button 
            onClick={onToggleSidebar}
            className={`md:hidden p-2 rounded-lg transition-colors duration-200 ${
              isDarkMode 
                ? 'text-gray-300 hover:bg-teal-600/10 hover:text-teal-400' 
                : 'text-gray-700 hover:bg-teal-50 hover:text-teal-600'
            }`}
          >
            <Menu size={20} />
          </button>
          
          <div className="hidden sm:block">
            <h1 className="text-lg font-semibold bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent leading-tight">
              {currentPage}
            </h1>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} -mt-1`}>
              Steel Invoice Pro
            </p>
          </div>
        </div>

        {/* Center Section - Search */}
        <div className="hidden md:flex flex-1 justify-center max-w-2xl mx-4">
          <div className={`relative w-full max-w-md rounded-2xl border transition-all duration-300 ${
            isDarkMode 
              ? 'bg-gray-800/50 border-gray-600 hover:border-teal-500 focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20' 
              : 'bg-gray-50/50 border-gray-300 hover:border-teal-500 focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20'
          }`}>
            <div className={`absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <Search size={16} />
            </div>
            <input
              type="text"
              placeholder="Search invoices, customers..."
              className={`w-full pl-10 pr-4 py-3 bg-transparent border-none outline-none transition-all duration-300 ${
                isDarkMode 
                  ? 'text-white placeholder-gray-400' 
                  : 'text-gray-900 placeholder-gray-500'
              } sm:w-80 focus:w-96 lg:w-96 focus:lg:w-[28rem] xl:w-[30rem] focus:xl:w-[35rem]`}
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme}
            className={`p-2 rounded-lg transition-colors duration-200 ${
              isDarkMode 
                ? 'text-gray-300 hover:bg-teal-600/10 hover:text-teal-400' 
                : 'text-gray-700 hover:bg-teal-50 hover:text-teal-600'
            }`}
            title={
              themeMode === 'system' 
                ? `System Theme (${isDarkMode ? 'Dark' : 'Light'})` 
                : themeMode === 'dark' 
                ? 'Dark Mode' 
                : 'Light Mode'
            }
          >
            {themeMode === 'system' ? (
              <Monitor size={18} />
            ) : themeMode === 'dark' ? (
              <Moon size={18} />
            ) : (
              <Sun size={18} />
            )}
          </button>

          {/* Notifications */}
          <div className="relative" ref={notificationDropdownRef}>
            <button 
              onClick={handleNotificationClick}
              className={`relative p-2 rounded-lg transition-colors duration-200 ${
                isDarkMode 
                  ? 'text-gray-300 hover:bg-teal-600/10 hover:text-teal-400' 
                  : 'text-gray-700 hover:bg-teal-50 hover:text-teal-600'
              }`}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-5 h-5 flex items-center justify-center font-medium">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* Profile Section */}
          <div className="relative" ref={profileDropdownRef}>
            <button 
              onClick={handleProfileClick}
              className={`flex items-center gap-2 p-2 rounded-xl transition-all duration-200 ${
                isDarkMode 
                  ? 'hover:bg-teal-600/10' 
                  : 'hover:bg-teal-50'
              }`}
            >
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-600 to-teal-700 flex items-center justify-center text-white text-sm font-semibold">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <div className={`text-sm font-medium leading-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {user?.name || 'User'}
                </div>
                <div className={`text-xs leading-tight ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {user?.role || 'Admin'}
                </div>
              </div>
              <ChevronDown 
                size={16} 
                className={`transition-transform duration-200 ${
                  showProfileDropdown ? 'rotate-180' : ''
                } ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
              />
            </button>
          </div>
        </div>

        {/* Notification Dropdown */}
        {showNotificationDropdown && (
          <div className={`absolute right-0 top-full mt-2 w-80 max-w-sm rounded-2xl border shadow-xl z-50 ${
            isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-gray-200'
          }`}>
            <div className={`p-4 border-b ${isDarkMode ? 'border-[#37474F]' : 'border-gray-200'}`}>
              <div className="flex justify-between items-center">
                <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Notifications
                </h3>
                <span className={`px-2 py-1 text-xs font-medium rounded border ${
                  isDarkMode 
                    ? 'text-teal-400 border-teal-600 bg-teal-900/20' 
                    : 'text-teal-600 border-teal-300 bg-teal-50'
                }`}>
                  {unreadCount} new
                </span>
              </div>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`relative p-4 border-b cursor-pointer transition-colors duration-200 ${
                    isDarkMode ? 'border-[#37474F] hover:bg-gray-700/50' : 'border-gray-200 hover:bg-gray-50'
                  } ${notification.unread ? (isDarkMode ? 'bg-teal-900/10' : 'bg-teal-50/50') : ''} last:border-b-0`}
                >
                  <h4 className={`text-sm font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {notification.title}
                  </h4>
                  <p className={`text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {notification.message}
                  </p>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    {notification.time}
                  </p>
                  {notification.unread && (
                    <div className="absolute top-4 right-4 w-2 h-2 bg-teal-500 rounded-full"></div>
                  )}
                </div>
              ))}
            </div>
            
            <div className={`p-4 border-t text-center ${isDarkMode ? 'border-[#37474F]' : 'border-gray-200'}`}>
              <button className={`text-sm font-medium transition-colors duration-200 hover:underline ${
                isDarkMode ? 'text-teal-400 hover:text-teal-300' : 'text-teal-600 hover:text-teal-700'
              }`}>
                View all notifications
              </button>
            </div>
          </div>
        )}

        {/* Profile Dropdown */}
        {showProfileDropdown && (
          <div className={`absolute right-0 top-full mt-2 w-72 rounded-2xl border shadow-xl z-50 ${
            isDarkMode ? 'bg-[#1E2328] border-[#37474F]' : 'bg-white border-gray-200'
          }`}>
            <div className={`p-4 border-b ${isDarkMode ? 'border-[#37474F]' : 'border-gray-200'}`}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-teal-600 to-teal-700 flex items-center justify-center text-white text-lg font-semibold">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="flex-1">
                  <h3 className={`text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {user?.name || 'User Name'}
                  </h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {user?.email || 'user@example.com'}
                  </p>
                  <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded border ${
                    isDarkMode 
                      ? 'text-teal-400 border-teal-600 bg-teal-900/20' 
                      : 'text-teal-600 border-teal-300 bg-teal-50'
                  }`}>
                    {user?.role || 'Administrator'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="py-2">
              <button 
                onClick={() => setShowProfileDropdown(false)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-200 ${
                  isDarkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <User size={18} />
                <span className="text-sm font-medium">My Profile</span>
              </button>
              
              <button 
                onClick={() => setShowProfileDropdown(false)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-200 ${
                  isDarkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Settings size={18} />
                <span className="text-sm font-medium">Account Settings</span>
              </button>
              
              <button 
                onClick={() => setShowProfileDropdown(false)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-200 ${
                  isDarkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-white' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <HelpCircle size={18} />
                <span className="text-sm font-medium">Help & Support</span>
              </button>
              
              <div className={`my-2 border-t ${isDarkMode ? 'border-[#37474F]' : 'border-gray-200'}`}></div>
              
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
              >
                <LogOut size={18} />
                <span className="text-sm font-medium">Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default TopNavbar;