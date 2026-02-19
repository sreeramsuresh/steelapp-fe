import { useTheme } from "../../contexts/ThemeContext";

/**
 * ERPListPageLayout — Standard page wrapper for ERP list pages.
 *
 * Provides: page icon, title, subtitle, and a consistent content area.
 *
 * @param {ReactNode} icon       - Icon element (e.g. <Banknote size={20} />)
 * @param {string}    title      - Page title with optional emoji prefix
 * @param {string}    subtitle   - Subtitle text
 * @param {ReactNode} [actions]  - Top-right action buttons
 * @param {ReactNode} children   - Page content (filters, KPIs, table, etc.)
 */
export default function ERPListPageLayout({ icon, title, subtitle, actions, children }) {
  const { isDarkMode } = useTheme();

  return (
    <div className={`p-2 sm:p-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-600 to-teal-700 flex items-center justify-center text-white">
            {icon}
          </div>
          <div>
            <h1 className="font-bold text-xl">{title}</h1>
            <div className="text-xs opacity-70">{subtitle}</div>
          </div>
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      <div className="space-y-3">{children}</div>
    </div>
  );
}
