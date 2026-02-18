import { Building2, Ship } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";

const TYPES = [
  {
    key: "LOCAL",
    label: "Local Purchase",
    icon: Building2,
    color: "teal",
    description: "Supplier delivers goods to our warehouse",
    badge: "bg-teal-500/10 text-teal-500",
    border: "border-teal-500/40 hover:border-teal-500",
    iconBg: "bg-teal-500/10 text-teal-400",
  },
  {
    key: "IMPORTED",
    label: "Import Purchase",
    icon: Ship,
    color: "blue",
    description: "Goods imported from overseas via container / shipment",
    badge: "bg-blue-500/10 text-blue-400",
    border: "border-blue-500/40 hover:border-blue-500",
    iconBg: "bg-blue-500/10 text-blue-400",
  },
];

export default function POTypeSelection() {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  function select(type) {
    navigate(`/app/purchase-orders/new?type=${type}`);
  }

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center p-8 ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}
    >
      <div className="max-w-2xl w-full">
        <div className="mb-8 text-center">
          <h1 className={`text-2xl font-bold mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            New Purchase Order
          </h1>
          <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            Select the type of purchase order to create
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {TYPES.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => select(t.key)}
                className={`text-left p-6 rounded-xl border-2 transition-all ${t.border} ${
                  isDarkMode ? "bg-gray-800 hover:bg-gray-750" : "bg-white hover:bg-gray-50"
                } focus:outline-none focus:ring-2 focus:ring-offset-2`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${t.iconBg}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span
                  className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded mb-2 ${t.badge}`}
                >
                  {t.key === "LOCAL" ? "Local" : "Import"}
                </span>
                <h2 className={`text-base font-semibold mb-1 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {t.label}
                </h2>
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{t.description}</p>
              </button>
            );
          })}
        </div>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className={`text-sm ${isDarkMode ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"}`}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
