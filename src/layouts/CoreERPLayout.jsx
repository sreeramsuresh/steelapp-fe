/**
 * CoreERPLayout.jsx
 * Layout wrapper for Core ERP operations (/app/*)
 * Contains CoreSidebar + TopNavbar + Outlet for nested routes
 */
import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import CoreSidebar from "../components/CoreSidebar";
import FeedbackWidget from "../components/FeedbackWidget";
import TopNavbar from "../components/TopNavbar";
import { useTheme } from "../contexts/ThemeContext";
import { authService } from "../services/axiosAuthService";
import { getRouteLabel } from "../utils/routeLabels";

const CoreERPLayout = () => {
  const location = useLocation();
  const { isDarkMode } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [user, setUser] = useState(null);

  // Initialize user from auth service
  useEffect(() => {
    if (authService.isAuthenticated()) {
      const storedUser = authService.getUser();
      if (storedUser) {
        setUser(storedUser);
      }
    }
  }, []);

  // Handle window resize for responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Set overflow styles for app layout
  useEffect(() => {
    const htmlEl = document.documentElement;
    const bodyEl = document.body;

    htmlEl.style.overflow = "hidden";
    htmlEl.style.height = "100vh";
    bodyEl.style.overflow = "hidden";
    bodyEl.style.height = "100vh";

    return () => {
      htmlEl.style.overflow = "";
      htmlEl.style.height = "";
      bodyEl.style.overflow = "";
      bodyEl.style.height = "";
    };
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.warn("Logout failed:", error);
    } finally {
      setUser(null);
      window.location.href = "/login";
    }
  };

  const getPageTitle = () => {
    return getRouteLabel(location.pathname) || "Core ERP";
  };

  return (
    <div
      className={`relative min-h-screen max-h-screen overflow-hidden w-screen ${
        isDarkMode ? "bg-[#121418]" : "bg-[#FAFAFA]"
      }`}
    >
      {/* Sidebar Overlay for mobile */}
      <button
        type="button"
        className={`md:hidden ${sidebarOpen ? "block" : "hidden"} fixed inset-0 bg-black bg-opacity-50 z-[999]`}
        onClick={toggleSidebar}
        aria-label="Close sidebar"
      />

      <CoreSidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />

      <div
        className={`${isDarkMode ? "bg-[#121418]" : "bg-[#FAFAFA]"} h-screen transition-all duration-300 ease-in-out z-[1] overflow-auto flex flex-col ${
          sidebarOpen ? "md:ml-[260px] xl:ml-[280px]" : "md:ml-0"
        }`}
      >
        <TopNavbar
          user={user}
          onLogout={handleLogout}
          onToggleSidebar={toggleSidebar}
          currentPage={getPageTitle()}
          section="core"
        />

        {/* Page content via Outlet */}
        <Outlet context={{ user }} />
      </div>

      <FeedbackWidget />
    </div>
  );
};

export default CoreERPLayout;
