/**
 * AnalyticsLayout.jsx
 * Layout wrapper for Analytics Hub (/analytics/*)
 * Contains AnalyticsSidebar + TopNavbar + Outlet for nested routes
 * This component is lazy-loaded for bundle optimization
 */
import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import AnalyticsSidebar from "../components/AnalyticsSidebar";
import FeedbackWidget from "../components/FeedbackWidget";
import TopNavbar from "../components/TopNavbar";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { getRouteLabel } from "../utils/routeLabels";

const AnalyticsLayout = () => {
  const location = useLocation();
  const { isDarkMode } = useTheme();
  const { user, onLogout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);

  // Handle window resize for responsive sidebar (using matchMedia for efficiency)
  useEffect(() => {
    const mql = window.matchMedia("(max-width: 768px)");
    const handleChange = (e) => setSidebarOpen(!e.matches);
    mql.addEventListener("change", handleChange);
    return () => mql.removeEventListener("change", handleChange);
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

  const handleLogout = () => {
    onLogout();
  };

  const getPageTitle = () => {
    return getRouteLabel(location.pathname) || "Analytics";
  };

  return (
    <div
      className={`relative min-h-screen max-h-screen overflow-hidden w-screen ${
        isDarkMode ? "bg-gray-900" : "bg-[#FAFAFA]"
      }`}
    >
      {/* Sidebar Overlay for mobile */}
      <button
        type="button"
        className={`md:hidden ${sidebarOpen ? "block" : "hidden"} fixed inset-0 bg-black bg-opacity-50 z-999`}
        onClick={toggleSidebar}
        aria-label="Close sidebar"
      />

      <AnalyticsSidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />

      <div
        className={`${isDarkMode ? "bg-gray-900" : "bg-[#FAFAFA]"} h-screen transition-all duration-300 ease-in-out z-1 overflow-auto flex flex-col ${
          sidebarOpen ? "md:ml-[260px] xl:ml-[280px]" : "md:ml-0"
        }`}
      >
        <TopNavbar
          user={user}
          onLogout={handleLogout}
          onToggleSidebar={toggleSidebar}
          currentPage={getPageTitle()}
          section="analytics"
        />

        {/* Page content via Outlet */}
        <Outlet context={{ user }} />
      </div>

      <FeedbackWidget />
    </div>
  );
};

export default AnalyticsLayout;
