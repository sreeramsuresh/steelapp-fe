import { Check, CircleDot, FileText, Package, Receipt, Truck, Wallet } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../../../contexts/ThemeContext";
import { useWorkspace } from "./WorkspaceContext";

function getSteps(isDropship) {
  if (isDropship) {
    return [
      { key: "create_po", label: "PO Created", icon: FileText, route: "overview" },
      { key: "confirm", label: "Supplier Confirmed", icon: CircleDot, route: "overview?confirm=1" },
      { key: "dispatch", label: "Dispatch to Customer", icon: Truck, route: "dispatch" },
      { key: "bill", label: "Supplier Bill", icon: Receipt, route: "bills" },
      { key: "payment", label: "Payment", icon: Wallet, route: "payments" },
    ];
  }
  return [
    { key: "create_po", label: "Create PO", icon: FileText, route: "overview" },
    { key: "confirm", label: "Confirm", icon: CircleDot, route: "overview?confirm=1" },
    { key: "grn", label: "GRN", icon: Package, route: "grn" },
    { key: "bill", label: "Supplier Bill", icon: Receipt, route: "bills" },
    { key: "payment", label: "Payment", icon: Wallet, route: "payments" },
  ];
}

const COMPLETION_KEY = {
  create_po: "createPo",
  confirm: "confirmComplete",
  grn: "grnComplete",
  dispatch: "dispatchComplete",
  bill: "billComplete",
  payment: "paymentComplete",
};

const GATING = {
  create_po: () => true,
  confirm: () => true,
  grn: (wf) => wf?.grnEnabled,
  dispatch: (wf) => wf?.dispatchEnabled,
  bill: (wf) => wf?.billEnabled,
  payment: (wf) => wf?.paymentEnabled,
};

const GATE_TOOLTIPS = {
  grn: () => "Confirm PO first",
  dispatch: () => "Confirm PO with supplier first",
  bill: (wf) => (wf?.isDropship ? "Confirm dispatch to customer first" : "Receive goods (GRN) first"),
  payment: () => "Create supplier bill first",
};

const NEXT_STEP_COPY = {
  create_po: "Create the purchase order.",
  confirm: "Send to supplier and mark as confirmed.",
  grn: "Receive goods into warehouse (create GRN).",
  dispatch: "Confirm that goods have been dispatched to the customer.",
  bill: "Record the supplier invoice for this order.",
  payment: "Record payment against the supplier bill.",
};

export default function HorizontalWorkflowStepper() {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { summary, poId } = useWorkspace();
  const workflow = summary?.workflow;

  const basePath = `/app/purchases/po/${poId}`;
  const currentPath = location.pathname + location.search;

  const steps = getSteps(workflow?.isDropship);

  // Find the first incomplete, enabled step as "next"
  const nextStepKey =
    steps.find((s) => {
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

  function getTooltip(step, enabled) {
    if (!enabled && GATE_TOOLTIPS[step.key]) {
      return GATE_TOOLTIPS[step.key](workflow);
    }
    return step.label;
  }

  return (
    <nav
      className={`border-b px-4 py-4 ${isDarkMode ? "bg-teal-900/20 border-teal-800/30" : "bg-teal-50/50 border-teal-200/50"}`}
    >
      <div className="max-w-[1400px] mx-auto">
        <div className="flex items-center gap-2 mb-3">
          <h2
            className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
          >
            Purchase Order Workflow
          </h2>
          <div className="text-[10px] uppercase tracking-wider flex items-center gap-2">
            {workflow?.isDropship ? (
              <>
                <span className="px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-500 font-bold">Dropship</span>
                <span className={isDarkMode ? "text-gray-500" : "text-gray-400"}>
                  Invoice → PO → Confirm → Dispatch → Bill → Payment
                </span>
              </>
            ) : (
              <>
                <span className="px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-500 font-bold">Warehouse</span>
                <span className={isDarkMode ? "text-gray-500" : "text-gray-400"}>
                  PO → Confirm → GRN → Bill → Payment
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 overflow-x-auto">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const completed = workflow?.[COMPLETION_KEY[step.key]];
            const enabled = GATING[step.key](workflow);
            const active = isActive(step);
            const tooltip = getTooltip(step, enabled);
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
                    {step.label}
                  </button>
                  {isNext && <span className="text-[10px] font-bold uppercase text-red-500">Next</span>}
                </div>
              </div>
            );
          })}
        </div>
        {nextStepKey && (
          <p className={`mt-2 text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            Next step: {NEXT_STEP_COPY[nextStepKey]}
          </p>
        )}
      </div>
    </nav>
  );
}
