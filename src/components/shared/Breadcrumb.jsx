import { ChevronRight, Home } from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";

/**
 * Breadcrumb navigation component
 * Fixes bug #8b: Provides breadcrumb trails for deep navigation
 *
 * Usage:
 *   <Breadcrumb items={[
 *     { label: 'Home', href: '/' },
 *     { label: 'Quotations', href: '/quotations' },
 *     { label: 'QT-001', current: true }
 *   ]} />
 */
const Breadcrumb = ({ items = [] }) => {
  const { isDarkMode } = useTheme();

  if (items.length === 0) {
    return null;
  }

  return (
    <nav
      className={`flex items-center gap-2 text-sm mb-6 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}
      aria-label="Breadcrumb"
    >
      <Link
        to="/"
        className={`flex items-center gap-1 ${isDarkMode ? "hover:text-white" : "hover:text-gray-900"} transition-colors`}
      >
        <Home size={16} />
        <span className="sr-only">Home</span>
      </Link>

      {items.map((item, index) => (
        <div key={item.id || item.name || `item-${index}`} className="flex items-center gap-2">
          <ChevronRight size={16} className="opacity-50" />
          {item.current ? (
            <span className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`} aria-current="page">
              {item.label}
            </span>
          ) : (
            <Link
              to={item.href}
              className={`${isDarkMode ? "hover:text-white" : "hover:text-gray-900"} transition-colors`}
            >
              {item.label}
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
};

export default Breadcrumb;
