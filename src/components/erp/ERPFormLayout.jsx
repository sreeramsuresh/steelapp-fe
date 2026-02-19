import { ArrowLeft, X } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

/**
 * ERPFormLayout — Universal form page wrapper with sticky header, content area, and optional drawers.
 *
 * Provides:
 * - Sticky header with back button, title, subtitle, status badge, and action buttons
 * - Backdrop-blur glass effect header
 * - Content area with max-width constraint
 * - Optional sidebar/aside column for summary or quick actions
 *
 * @param {string}    title          - Form title (e.g. "Create Purchase Order")
 * @param {string}    [subtitle]     - Subtitle (e.g. "PO-202602-0001")
 * @param {Function}  onBack         - Navigation back handler
 * @param {string}    [backLabel]    - Aria label for back button
 * @param {ReactNode} [statusBadge]  - Status pill element
 * @param {ReactNode} [headerActions]- Buttons in header right section (Save, Preview, etc.)
 * @param {ReactNode} children       - Main form content
 * @param {ReactNode} [aside]        - Right sidebar content (sticky positioned)
 * @param {string}    [maxWidth]     - Max width class (default "max-w-[1400px]")
 * @param {string}    [testId]       - data-testid for the root element
 */
export default function ERPFormLayout({
  title,
  subtitle,
  onBack,
  backLabel = "Go back",
  statusBadge,
  headerActions,
  children,
  aside,
  maxWidth = "max-w-[1400px]",
  testId,
}) {
  const { isDarkMode } = useTheme();

  return (
    <div className={`min-h-screen ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`} data-testid={testId}>
      {/* Sticky Header */}
      <header
        className={`sticky top-0 z-20 shrink-0 backdrop-blur-md border-b ${
          isDarkMode ? "bg-gray-900/92 border-gray-700" : "bg-white/92 border-gray-200"
        }`}
      >
        <div className={`${maxWidth} mx-auto px-4 py-3 md:py-4 flex justify-between items-center`}>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className={`p-2 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
                isDarkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100"
              }`}
              aria-label={backLabel}
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className={`text-lg md:text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>{title}</h1>
              {subtitle && (
                <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{subtitle}</div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {statusBadge}
            {headerActions}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className={`${maxWidth} mx-auto px-4 py-4`}>
        {aside ? (
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 min-w-0">{children}</div>
            <div className="lg:w-[320px] lg:sticky lg:top-[72px] space-y-4 shrink-0">{aside}</div>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

/**
 * FormDrawer — Slide-in drawer for progressive disclosure of form sections.
 *
 * @param {boolean}   open       - Whether drawer is visible
 * @param {Function}  onClose    - Close handler
 * @param {string}    title      - Drawer header title
 * @param {ReactNode} [subtitle] - Drawer header subtitle
 * @param {ReactNode} children   - Drawer body content
 * @param {ReactNode} [footer]   - Sticky footer content (save buttons, etc.)
 */
export function FormDrawer({ open, onClose, title, subtitle, children, footer }) {
  const { isDarkMode } = useTheme();

  if (!open) return null;

  const footerGradient = isDarkMode
    ? "linear-gradient(to top, rgba(31,41,55,1) 70%, rgba(31,41,55,0))"
    : "linear-gradient(to top, rgba(255,255,255,1) 70%, rgba(255,255,255,0))";

  return (
    <>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: modal overlay with role="presentation" */}
      <div
        className="fixed inset-0 bg-black/55 z-30 transition-opacity"
        onClick={onClose}
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        role="presentation"
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full w-[min(620px,92vw)] z-[31] ${
          isDarkMode ? "bg-gray-800 border-l border-gray-700" : "bg-white border-l border-gray-200"
        } overflow-auto transition-transform`}
      >
        {/* Sticky header */}
        <div
          className={`sticky top-0 flex justify-between items-start gap-2.5 p-4 ${
            isDarkMode ? "bg-gray-800 border-b border-gray-700" : "bg-white border-b border-gray-200"
          } z-[1]`}
        >
          <div>
            <h2 className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>{title}</h2>
            {subtitle && (
              <div className={`text-xs mt-0.5 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{subtitle}</div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode ? "text-gray-400 hover:bg-gray-700" : "text-gray-500 hover:bg-gray-100"
            }`}
            aria-label="Close drawer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4">{children}</div>

        {/* Sticky footer */}
        {footer && (
          <div className="sticky bottom-0 pt-4 mt-6 px-4 pb-4" style={{ background: footerGradient }}>
            {footer}
          </div>
        )}
      </div>
    </>
  );
}

/**
 * FormDesignTokens — Shared design tokens for form pages.
 * Use these in form components for consistent styling.
 */
export const FormDesignTokens = {
  card: (isDarkMode) =>
    `${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} border rounded-2xl p-4`,

  input: (isDarkMode) =>
    `w-full ${isDarkMode ? "bg-gray-900 border-gray-700 text-white" : "bg-white border-gray-300 text-gray-900"} border rounded-md py-2 px-3 text-sm outline-none shadow-sm focus:border-teal-500 focus:ring-1 focus:ring-teal-500 h-[38px]`,

  label: (isDarkMode) => `block text-xs font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"} mb-1.5`,

  button: (isDarkMode) =>
    `${isDarkMode ? "bg-gray-900 border-gray-700 text-white hover:border-teal-500" : "bg-white border-gray-300 text-gray-900 hover:border-teal-500"} border rounded-lg py-2 px-3 text-sm cursor-pointer transition-colors`,

  buttonPrimary:
    "bg-teal-600 border-transparent text-white font-bold hover:bg-teal-500 rounded-lg py-2 px-3 text-sm cursor-pointer transition-colors",

  buttonSmall: (isDarkMode) =>
    `${isDarkMode ? "bg-gray-900 border-gray-700 text-white hover:border-teal-500" : "bg-white border-gray-300 text-gray-900 hover:border-teal-500"} border rounded-lg py-1.5 px-2.5 text-xs cursor-pointer transition-colors`,

  quickLink: (isDarkMode) =>
    `flex items-center gap-2 py-2 px-2.5 ${isDarkMode ? "bg-gray-900 border-gray-700 text-gray-200" : "bg-gray-50 border-gray-200 text-gray-900"} border rounded-md cursor-pointer text-xs transition-colors hover:border-teal-500 hover:text-teal-400 w-full`,

  divider: (isDarkMode) => `h-px ${isDarkMode ? "bg-gray-700" : "bg-gray-200"} my-3`,
};
