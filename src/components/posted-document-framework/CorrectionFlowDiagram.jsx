import { ArrowRight, ChevronRight } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

const CorrectionFlowDiagram = ({ steps = [] }) => {
  const { isDarkMode } = useTheme();

  if (!steps.length) return null;

  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="flex items-center gap-1 min-w-max mx-auto justify-center py-2">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isLast = idx === steps.length - 1;

          return (
            <div key={step.label} className="flex items-center gap-1">
              {/* Step card */}
              <div
                className={`flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border transition-colors ${
                  isDarkMode
                    ? "bg-gray-800 border-gray-700 hover:border-gray-600"
                    : "bg-white border-gray-200 hover:border-gray-300"
                }`}
                style={{ minWidth: 120 }}
              >
                <div
                  className="p-2 rounded-lg"
                  style={{
                    backgroundColor: `${step.color}15`,
                    color: step.color,
                  }}
                >
                  {Icon && <Icon className="h-5 w-5" />}
                </div>
                <span
                  className={`text-xs font-semibold text-center leading-tight ${
                    isDarkMode ? "text-gray-200" : "text-gray-800"
                  }`}
                >
                  {step.label}
                </span>
                {step.description && (
                  <span
                    className={`text-[10px] text-center leading-snug max-w-[100px] ${
                      isDarkMode ? "text-gray-500" : "text-gray-400"
                    }`}
                  >
                    {step.description}
                  </span>
                )}
              </div>

              {/* Arrow */}
              {!isLast && (
                <div className={`flex items-center mx-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  <ArrowRight className="h-5 w-5 hidden sm:block" strokeWidth={2.5} />
                  <ChevronRight className="h-5 w-5 sm:hidden" strokeWidth={2.5} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CorrectionFlowDiagram;
