import { Building2, Check, Ship } from "lucide-react";
import { useState } from "react";
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
    selectedBorder: "border-teal-500 ring-2 ring-teal-500/30",
    iconBg: "bg-teal-500/10 text-teal-400",
  },
  {
    key: "IMPORTED",
    label: "Import Purchase",
    icon: Ship,
    color: "blue",
    description:
      "Full trade documentation — HS codes, customs, duties, ports. Switch to Simple mode inside for basic overseas POs.",
    badge: "bg-blue-500/10 text-blue-400",
    border: "border-blue-500/40 hover:border-blue-500",
    selectedBorder: "border-blue-500 ring-2 ring-blue-500/30",
    iconBg: "bg-blue-500/10 text-blue-400",
  },
];

export default function POTypeSelection() {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [selected, setSelected] = useState("LOCAL");

  function handleContinue() {
    if (selected === "LOCAL") {
      navigate("/app/purchase-orders/new");
    } else {
      navigate("/app/import-orders/new");
    }
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
            const isSelected = selected === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setSelected(t.key)}
                className={`relative text-left p-6 rounded-xl border-2 transition-all focus:outline-none ${
                  isSelected ? t.selectedBorder : `${t.border} ${isDarkMode ? "opacity-70" : "opacity-60"}`
                } ${isDarkMode ? "bg-gray-800" : "bg-white"}`}
              >
                {isSelected && (
                  <span className="absolute top-3 right-3 w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                  </span>
                )}
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

        <div className="mt-6 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={handleContinue}
            className="w-full sm:w-auto px-8 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm transition-colors"
          >
            Continue →
          </button>
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
