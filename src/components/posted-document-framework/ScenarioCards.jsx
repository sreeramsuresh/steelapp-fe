import { ChevronRight } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

const DOC_TYPE_TAG_COLORS = {
  invoice: { light: "bg-blue-100 text-blue-700", dark: "bg-blue-900/30 text-blue-400" },
  credit_note: { light: "bg-red-100 text-red-700", dark: "bg-red-900/30 text-red-400" },
  debit_note: { light: "bg-emerald-100 text-emerald-700", dark: "bg-emerald-900/30 text-emerald-400" },
  supplier_bill: { light: "bg-purple-100 text-purple-700", dark: "bg-purple-900/30 text-purple-400" },
  journal_entry: { light: "bg-indigo-100 text-indigo-700", dark: "bg-indigo-900/30 text-indigo-400" },
  grn: { light: "bg-teal-100 text-teal-700", dark: "bg-teal-900/30 text-teal-400" },
  delivery_note: { light: "bg-orange-100 text-orange-700", dark: "bg-orange-900/30 text-orange-400" },
};

const DEFAULT_TAG = { light: "bg-gray-100 text-gray-700", dark: "bg-gray-800 text-gray-400" };

const ScenarioCards = ({ scenarios = [] }) => {
  const { isDarkMode } = useTheme();

  if (!scenarios.length) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {scenarios.map((scenario) => (
        <div
          key={scenario.title}
          className={`rounded-xl border p-4 transition-colors ${
            isDarkMode
              ? "bg-gray-800/50 border-gray-700/50 hover:border-gray-600"
              : "bg-white border-gray-200 hover:border-gray-300"
          }`}
        >
          <h4 className={`text-sm font-semibold mb-1 ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>
            {scenario.title}
          </h4>
          <p className={`text-xs mb-3 leading-relaxed ${isDarkMode ? "text-gray-500" : "text-gray-500"}`}>
            {scenario.description}
          </p>

          {/* Mini flow */}
          {scenario.flow && (
            <div className="flex items-center gap-1 flex-wrap">
              {scenario.flow.map((step, idx) => {
                const isLast = idx === scenario.flow.length - 1;
                const tagColors = DOC_TYPE_TAG_COLORS[step.type] || DEFAULT_TAG;
                const tagClass = isDarkMode ? tagColors.dark : tagColors.light;

                return (
                  <div key={`${step.label}-${idx}`} className="flex items-center gap-1">
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${tagClass}`}>{step.label}</span>
                    {!isLast && (
                      <ChevronRight className={`h-3 w-3 ${isDarkMode ? "text-gray-600" : "text-gray-300"}`} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ScenarioCards;
