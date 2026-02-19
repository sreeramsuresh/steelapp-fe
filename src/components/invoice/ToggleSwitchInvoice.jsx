const ToggleSwitchInvoice = ({ enabled, onChange, label, description, isDarkMode }) => (
  <div className="flex items-start justify-between py-3">
    <div className="flex-1 pr-4">
      <p className={`text-sm font-medium ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>{label}</p>
      <p className={`text-xs mt-0.5 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{description}</p>
    </div>
    <button
      type="button"
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 ${
        enabled ? "bg-teal-600" : isDarkMode ? "bg-gray-600" : "bg-gray-200"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          enabled ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  </div>
);

export default ToggleSwitchInvoice;
