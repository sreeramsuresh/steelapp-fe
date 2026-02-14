// Style constants for Invoice form components
// Extracted from InvoiceForm.jsx — single source of truth for layout classes

export const CARD_CLASSES = (isDarkMode) =>
  `${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"} border rounded-2xl p-4`;

export const DRAWER_OVERLAY_CLASSES = (isOpen) =>
  `fixed inset-0 bg-black/55 z-30 transition-opacity ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}`;

export const DRAWER_PANEL_CLASSES = (isDarkMode, isOpen) =>
  `fixed top-[53px] right-0 bottom-0 w-[min(620px,92vw)] z-[31] ${isDarkMode ? "bg-gray-800 border-l border-gray-700" : "bg-white border-l border-gray-200"} overflow-auto transition-transform ${isOpen ? "translate-x-0" : "translate-x-full"}`;

export const DRAWER_STYLE = {
  borderTopLeftRadius: "8px",
  borderBottomLeftRadius: "8px",
  boxShadow: "-4px 0 16px rgba(0, 0, 0, 0.1)",
};

export const QUICK_LINK_CLASSES = (isDarkMode) =>
  `flex items-center gap-2 py-2 px-2.5 w-full text-left ${isDarkMode ? "bg-gray-900 border-gray-700 text-gray-200" : "bg-gray-50 border-gray-200 text-gray-900"} border rounded-[10px] cursor-pointer text-[13px] transition-colors hover:border-teal-500 hover:text-teal-400`;

export const DIVIDER_CLASSES = (isDarkMode) => `h-px ${isDarkMode ? "bg-gray-700" : "bg-gray-200"} my-3`;

export const INVOICE_ROUTES = {
  list: () => "/app/invoices",
  view: (id) => `/app/invoices/${id}`,
  new: () => "/app/invoices/new",
};
