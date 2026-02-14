import { Check, CircleDot, FileText, Package, Receipt, Send, Wallet } from "lucide-react";
import { useMemo } from "react";
import { useTheme } from "../../contexts/ThemeContext";

const STEPS = [
  { label: "Create PO", icon: FileText },
  { label: "Confirm", icon: Send },
  { label: "Receive GRN", icon: Package },
  { label: "Supplier Bill", icon: Receipt },
  { label: "Payment", icon: Wallet },
];

function getCompletedCount(status) {
  switch (status) {
    case "draft":
    case "pending":
      return 0;
    case "approved":
    case "confirmed":
      return 1;
    case "partially_received":
      return 2;
    case "received":
    case "in_warehouse":
      return 3;
    case "billed":
      return 4;
    case "paid":
    case "completed":
      return 5;
    default:
      return 0;
  }
}

const PurchaseWorkflowTimeline = ({ currentStatus }) => {
  const { isDarkMode } = useTheme();
  const completedCount = useMemo(() => getCompletedCount(currentStatus), [currentStatus]);

  return (
    <div
      className={`w-[170px] shrink-0 sticky top-0 self-start h-screen pt-6 pb-6 pl-3 pr-2 border-r ${
        isDarkMode ? "bg-gray-900/60 border-gray-700" : "bg-gray-50/80 border-gray-200"
      }`}
    >
      <div
        className={`text-[10px] font-bold uppercase tracking-wider mb-5 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
      >
        Workflow
      </div>
      <div className="relative">
        {STEPS.map((step, i) => {
          const isCompleted = i < completedCount;
          const isCurrent = i === completedCount && completedCount < STEPS.length;
          const isFuture = !isCompleted && !isCurrent;
          const Icon = step.icon;

          return (
            <div key={step.label} className="flex items-start gap-2.5 mb-0">
              {/* Dot + Line column */}
              <div className="flex flex-col items-center w-5 shrink-0">
                {/* Dot */}
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                    isCompleted
                      ? "bg-teal-500 text-white"
                      : isCurrent
                        ? "bg-amber-500/20 border-2 border-amber-400"
                        : isDarkMode
                          ? "bg-gray-700 border border-gray-600"
                          : "bg-gray-200 border border-gray-300"
                  } ${isCurrent ? "shadow-[0_0_8px_rgba(245,158,11,0.4)]" : ""}`}
                >
                  {isCompleted ? (
                    <Check size={11} strokeWidth={3} />
                  ) : isCurrent ? (
                    <CircleDot size={11} className="text-amber-400" />
                  ) : null}
                </div>
                {/* Connecting line */}
                {i < STEPS.length - 1 && (
                  <div
                    className={`w-0.5 h-8 ${
                      i < completedCount - 1
                        ? "bg-teal-500"
                        : i === completedCount - 1 && completedCount > 0
                          ? "bg-gradient-to-b from-teal-500 to-gray-500"
                          : isDarkMode
                            ? "bg-gray-700"
                            : "bg-gray-300"
                    }`}
                  />
                )}
              </div>
              {/* Label */}
              <div className="pt-0.5 pb-[18px]">
                <div
                  className={`text-[11px] font-medium leading-tight ${
                    isCompleted
                      ? "text-teal-400"
                      : isCurrent
                        ? isDarkMode
                          ? "text-amber-300"
                          : "text-amber-600"
                        : isFuture
                          ? isDarkMode
                            ? "text-gray-600"
                            : "text-gray-400"
                          : ""
                  }`}
                >
                  <Icon size={12} className="inline mr-1 -mt-0.5" />
                  {step.label}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PurchaseWorkflowTimeline;
