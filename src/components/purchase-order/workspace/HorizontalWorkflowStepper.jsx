import { Check, CircleDot, FileText, Package, Receipt, Wallet } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../../../contexts/ThemeContext";
import { useWorkspace } from "./WorkspaceContext";

const STEPS = [
  { key: "create_po", label: "Create PO", icon: FileText, route: "overview" },
  { key: "confirm", label: "Confirm", icon: CircleDot, route: "overview?confirm=1" },
  { key: "grn", label: "GRN", icon: Package, route: "grn" },
  { key: "bill", label: "Supplier Bill", icon: Receipt, route: "bills" },
  { key: "payment", label: "Payment", icon: Wallet, route: "payments" },
];

const COMPLETION_KEY = {
  create_po: "createPo",
  confirm: "confirmComplete",
  grn: "grnComplete",
  bill: "billComplete",
  payment: "paymentComplete",
};

const GATING = {
  create_po: () => true,
  confirm: () => true,
  grn: (wf) => wf?.grnEnabled,
  bill: (wf) => wf?.billEnabled,
  payment: (wf) => wf?.paymentEnabled,
};

const GATE_TOOLTIPS = {
  grn: () => "Confirm PO first",
  bill: (wf) => (wf?.isDropship ? "Confirm PO and deliver goods first" : "Receive goods (GRN) first"),
  payment: () => "Create supplier bill first",
};

function getStepLabel(step, workflow) {
  if (step.key === "grn" && workflow?.isDropship) {
    return "Dropship - GRN (Optional)";
  }
  return step.label;
}

function getTooltip(step, workflow, enabled) {
  if (step.key === "grn" && workflow?.isDropship && enabled) {
    return "Dropship orders skip GRN unless customer rejects and goods are returned";
  }
  if (!enabled && GATE_TOOLTIPS[step.key]) {
    const fn = GATE_TOOLTIPS[step.key];
    return typeof fn === "function" ? fn(workflow) : fn;
  }
  return step.label;
}

export default function HorizontalWorkflowStepper() {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { summary, poId } = useWorkspace();
  const workflow = summary?.workflow;

  const basePath = `/app/purchases/po/${poId}`;
  const currentPath = location.pathname + location.search;

  // Find the first incomplete, enabled step as "next"
  // For dropship, skip GRN since it's optional — bill is the real next step
  const nextStepKey =
    STEPS.find((s) => {
      if (s.key === "grn" && workflow?.isDropship) return false;
      const done = workflow?.[COMPLETION_KEY[s.key]];
      const gate = GATING[s.key](workflow);
      return !done && gate;
    })?.key || null;

  function isActive(step) {
    if (step.key === "confirm") {
      return currentPath.includes("/overview") && currentPath.includes("confirm=1");
    }
    if (step.key === "create_po") {
      return currentPath.includes("/overview") && !currentPath.includes("confirm=1");
    }
    return currentPath.includes(`/${step.route.split("?")[0]}`);
  }

  function handleClick(step) {
    const enabled = GATING[step.key](workflow);
    if (!enabled) return;
    const [path, query] = step.route.split("?");
    navigate(`${basePath}/${path}${query ? `?${query}` : ""}`);
  }

  return (
    <nav
      className={`border-b px-4 py-4 ${isDarkMode ? "bg-teal-900/20 border-teal-800/30" : "bg-teal-50/50 border-teal-200/50"}`}
    >
      <div className="max-w-[1400px] mx-auto">
        <h2
          className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
        >
          Purchase Order Workflow
        </h2>
        <div className="flex items-center gap-1 overflow-x-auto">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            const completed = workflow?.[COMPLETION_KEY[step.key]];
            const enabled = GATING[step.key](workflow);
            const active = isActive(step);
            const label = getStepLabel(step, workflow);
            const tooltip = getTooltip(step, workflow, enabled);
            const isNext = step.key === nextStepKey && !active;

            return (
              <div key={step.key} className="flex items-center">
                {idx > 0 && (
                  <div
                    className={`w-8 h-px mx-1 ${
                      completed ? "bg-teal-500" : isDarkMode ? "bg-gray-600" : "bg-gray-300"
                    }`}
                  />
                )}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleClick(step)}
                    disabled={!enabled}
                    title={tooltip}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                      isNext
                        ? `ring-2 ring-red-500 ring-offset-1 ${
                            isDarkMode
                              ? "ring-offset-gray-800 text-gray-300 hover:bg-gray-700"
                              : "ring-offset-gray-50 text-gray-600 hover:bg-gray-100"
                          }`
                        : active
                          ? "bg-teal-600 text-white shadow-sm"
                          : completed
                            ? "bg-teal-600 text-white shadow-sm hover:bg-teal-500"
                            : enabled
                              ? isDarkMode
                                ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                              : "text-gray-400 cursor-not-allowed opacity-50"
                    }`}
                  >
                    {completed && !active ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                    {label}
                  </button>
                  {isNext && <span className="text-[10px] font-bold uppercase text-red-500">Next</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
