import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../../contexts/ThemeContext";
import { useWorkspace } from "./WorkspaceContext";

const STATUS_COLORS = {
  draft: "bg-gray-500/20 text-gray-400",
  pending: "bg-yellow-500/20 text-yellow-400",
  confirmed: "bg-blue-500/20 text-blue-400",
  approved: "bg-green-500/20 text-green-400",
  received: "bg-emerald-500/20 text-emerald-400",
  completed: "bg-teal-500/20 text-teal-400",
  cancelled: "bg-red-500/20 text-red-400",
};

function getNextAction(summary) {
  const { grns, bills, workflow } = summary || {};
  const isDropship = workflow?.isDropship;

  if (!workflow?.confirmComplete) return { label: "Confirm PO", route: "overview?confirm=1" };

  if (isDropship && !workflow?.dispatchComplete) return { label: "Confirm Dispatch", route: "dispatch" };

  if (!isDropship && grns?.count === 0) return { label: "Create GRN", route: "grn" };

  if (bills?.count === 0) return { label: "Create Supplier Bill", route: "bills" };

  if (bills?.count > 0 && !workflow?.isFullyPaid) return { label: "Record Payment", route: "payments" };

  return null;
}

export default function WorkspaceHeader() {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const { summary, loading, poId } = useWorkspace();

  const po = summary?.po;
  const nextAction = !loading ? getNextAction(summary) : null;
  const basePath = `/app/purchases/po/${poId}`;

  return (
    <header
      className={`sticky top-0 z-20 shrink-0 backdrop-blur-md border-b ${
        isDarkMode ? "bg-gray-900/92 border-gray-700" : "bg-white/92 border-gray-200"
      }`}
    >
      <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/app/purchases")}
            className={`p-2 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
              isDarkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-100"
            }`}
            aria-label="Exit workspace"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Loading...</span>
              </div>
            ) : (
              <>
                <h1 className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {po?.poNumber || po?.po_number || "Purchase Order"}
                </h1>
                <div className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  {po?.supplierName || po?.supplier_name || "Unknown Supplier"}
                </div>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {po?.status && (
            <span
              className={`px-3 py-1.5 rounded-full text-xs font-medium ${STATUS_COLORS[po.status] || STATUS_COLORS.draft}`}
            >
              {po.status.toUpperCase()}
            </span>
          )}
          {summary?.workflow?.isDropship && (
            <span className="px-2.5 py-1.5 rounded-full text-xs font-medium bg-orange-500/20 text-orange-400 flex items-center gap-1">
              🚢 DROPSHIP
            </span>
          )}
          {nextAction ? (
            <button
              type="button"
              onClick={() => {
                const [path, query] = nextAction.route.split("?");
                navigate(`${basePath}/${path}${query ? `?${query}` : ""}`);
              }}
              className="bg-teal-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-teal-500 transition-colors flex items-center gap-1.5"
            >
              {nextAction.label}
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          ) : !loading && summary ? (
            <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Complete
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => navigate("/app/purchases")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              isDarkMode
                ? "border-gray-700 text-gray-300 hover:border-gray-500"
                : "border-gray-300 text-gray-600 hover:border-gray-400"
            }`}
          >
            Exit Workspace
          </button>
        </div>
      </div>
    </header>
  );
}
