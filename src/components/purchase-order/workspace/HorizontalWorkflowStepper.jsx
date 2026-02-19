import { AlertTriangle, Check, CircleDot, FileText, Package, Receipt, Truck, Wallet } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../../../contexts/ThemeContext";
import { useWorkspace } from "./WorkspaceContext";

// ─── Path configuration ───────────────────────────────────────────────────────
const PATH_CONFIG = {
  LOCAL_PURCHASE: {
    label: "Local Purchase",
    badge: "bg-teal-500/10 text-teal-500",
    bg: "bg-teal-900/20 border-teal-800/30",
    bgLight: "bg-teal-50/50 border-teal-200/50",
    activeStep: "bg-teal-600",
    completedStep: "bg-teal-600 hover:bg-teal-500",
    connector: "bg-teal-500",
    flow: "PO → Confirm → GRN → Bill → Payment",
  },
  IMPORT_PURCHASE: {
    label: "Import Purchase",
    badge: "bg-blue-500/10 text-blue-400",
    bg: "bg-blue-900/20 border-blue-800/30",
    bgLight: "bg-blue-50/50 border-blue-200/50",
    activeStep: "bg-blue-600",
    completedStep: "bg-blue-600 hover:bg-blue-500",
    connector: "bg-blue-500",
    flow: "PO → Confirm → GRN → Bill → Payment",
  },
  LOCAL_DROPSHIP: {
    label: "Local Dropship",
    badge: "bg-orange-500/10 text-orange-500",
    bg: "bg-orange-900/20 border-orange-800/30",
    bgLight: "bg-orange-50/50 border-orange-200/50",
    activeStep: "bg-orange-600",
    completedStep: "bg-orange-600 hover:bg-orange-500",
    connector: "bg-orange-500",
    flow: "Invoice → PO → Confirm → Dispatch → Bill → Payment",
  },
};

// ─── Step definitions ─────────────────────────────────────────────────────────
function getSteps(poType) {
  if (poType === "LOCAL_DROPSHIP") {
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

// ─── Component ────────────────────────────────────────────────────────────────
export default function HorizontalWorkflowStepper() {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { summary, poId } = useWorkspace();
  const workflow = summary?.workflow;

  // Derive poType from workflow
  const poType = workflow?.poType || (workflow?.isDropship ? "LOCAL_DROPSHIP" : "LOCAL_PURCHASE");
  const config = PATH_CONFIG[poType] || PATH_CONFIG.LOCAL_PURCHASE;

  const basePath = `/app/purchases/po/${poId}`;
  const currentPath = location.pathname + location.search;
  const steps = getSteps(poType);

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

  const navBg = isDarkMode ? config.bg : config.bgLight;

  return (
    <nav className={`border-b px-4 py-4 ${navBg}`}>
      <div className="max-w-[1400px] mx-auto">
        {/* Header row */}
        <div className="flex items-center gap-2 mb-3">
          <h2
            className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}
          >
            Purchase Order Workflow
          </h2>
          <div className="text-[10px] uppercase tracking-wider flex items-center gap-2">
            <span className={`px-1.5 py-0.5 rounded font-bold ${config.badge}`}>{config.label}</span>
            <span className={isDarkMode ? "text-gray-500" : "text-gray-400"}>{config.flow}</span>
          </div>
        </div>

        {/* Steps */}
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
                    className={`w-8 h-px mx-1 ${completed ? config.connector : isDarkMode ? "bg-gray-600" : "bg-gray-300"}`}
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
                          ? `${config.activeStep} text-white shadow-sm`
                          : completed
                            ? `${config.completedStep} text-white shadow-sm`
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

        {/* Next step hint */}
        {nextStepKey && (
          <p className={`mt-2 text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
            Next step: {NEXT_STEP_COPY[nextStepKey]}
          </p>
        )}

        {/* Dropship rejection hint (shown after dispatch is complete) */}
        {poType === "LOCAL_DROPSHIP" && workflow?.dispatchComplete && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-500">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            <span>
              Customer rejected goods?{" "}
              <button
                type="button"
                className="underline font-medium hover:text-amber-400"
                onClick={() => navigate(`${basePath}/receive`)}
              >
                Receive to Warehouse
              </button>
            </span>
          </div>
        )}
      </div>
    </nav>
  );
}
