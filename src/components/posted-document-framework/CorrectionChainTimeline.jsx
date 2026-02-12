import { ArrowDownRight } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

const DOC_TYPE_COLORS = {
  invoice: { bg: "bg-blue-500", ring: "ring-blue-500/20", text: "text-blue-600", darkText: "text-blue-400" },
  credit_note: { bg: "bg-red-500", ring: "ring-red-500/20", text: "text-red-600", darkText: "text-red-400" },
  debit_note: {
    bg: "bg-emerald-500",
    ring: "ring-emerald-500/20",
    text: "text-emerald-600",
    darkText: "text-emerald-400",
  },
  supplier_bill: {
    bg: "bg-purple-500",
    ring: "ring-purple-500/20",
    text: "text-purple-600",
    darkText: "text-purple-400",
  },
  journal_entry: {
    bg: "bg-indigo-500",
    ring: "ring-indigo-500/20",
    text: "text-indigo-600",
    darkText: "text-indigo-400",
  },
  grn: { bg: "bg-teal-500", ring: "ring-teal-500/20", text: "text-teal-600", darkText: "text-teal-400" },
  delivery_note: {
    bg: "bg-orange-500",
    ring: "ring-orange-500/20",
    text: "text-orange-600",
    darkText: "text-orange-400",
  },
};

const DEFAULT_COLOR = { bg: "bg-gray-500", ring: "ring-gray-500/20", text: "text-gray-600", darkText: "text-gray-400" };

const formatAmount = (amount) => {
  if (amount == null) return "";
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "+";
  return `${sign} AED ${abs.toLocaleString("en-AE", { minimumFractionDigits: 2 })}`;
};

const CorrectionChainTimeline = ({ nodes = [], edges = [], computed, onNavigate, mode = "guide" }) => {
  const { isDarkMode } = useTheme();

  if (!nodes.length) return null;

  // Build ordered node list: follow edges from root
  const orderedNodes = [];
  const edgeMap = new Map();
  for (const edge of edges) {
    edgeMap.set(edge.source, [...(edgeMap.get(edge.source) || []), edge]);
  }

  // Find root (node not targeted by any edge)
  const targetIds = new Set(edges.map((e) => e.target));
  const rootNode = nodes.find((n) => !targetIds.has(n.id)) || nodes[0];

  if (rootNode) {
    const visited = new Set();
    const queue = [rootNode.id];
    while (queue.length > 0) {
      const current = queue.shift();
      if (visited.has(current)) continue;
      visited.add(current);
      const node = nodes.find((n) => n.id === current);
      if (node) orderedNodes.push(node);
      const outEdges = edgeMap.get(current) || [];
      for (const edge of outEdges) {
        if (!visited.has(edge.target)) queue.push(edge.target);
      }
    }
    // Add any orphaned nodes
    for (const node of nodes) {
      if (!visited.has(node.id)) orderedNodes.push(node);
    }
  }

  // Running balance
  let runningBalance = 0;

  return (
    <div className="space-y-1">
      {/* Timeline */}
      <div className="relative">
        {orderedNodes.map((node, idx) => {
          const isLast = idx === orderedNodes.length - 1;
          const colors = DOC_TYPE_COLORS[node.type] || DEFAULT_COLOR;
          const amount = node.amount ?? 0;
          runningBalance += amount;

          // Find linking edge
          const linkEdge = edges.find((e) => e.target === node.id);

          return (
            <div key={node.id} className="relative flex gap-3">
              {/* Timeline line + dot */}
              <div className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full ${colors.bg} ring-4 ${colors.ring} mt-1.5`} />
                {!isLast && (
                  <div className={`w-0.5 flex-1 min-h-[32px] ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`} />
                )}
              </div>

              {/* Content */}
              <div className={`flex-1 pb-4 ${isLast ? "pb-0" : ""}`}>
                <div
                  className={`rounded-lg border px-3 py-2.5 ${
                    isDarkMode ? "bg-gray-800/50 border-gray-700/50" : "bg-white border-gray-100"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 min-w-0">
                      {linkEdge && (
                        <ArrowDownRight
                          className={`h-3.5 w-3.5 shrink-0 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
                        />
                      )}
                      {mode === "live" && onNavigate ? (
                        <button
                          type="button"
                          onClick={() => onNavigate(node.type, node.docId)}
                          className={`text-sm font-semibold hover:underline ${isDarkMode ? colors.darkText : colors.text}`}
                        >
                          {node.number || node.id}
                        </button>
                      ) : (
                        <span className={`text-sm font-semibold ${isDarkMode ? colors.darkText : colors.text}`}>
                          {node.number || node.id}
                        </span>
                      )}
                      {node.status && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${
                            isDarkMode ? "bg-gray-700 text-gray-400" : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {node.status}
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-sm font-mono font-semibold tabular-nums ${
                        amount < 0
                          ? isDarkMode
                            ? "text-red-400"
                            : "text-red-600"
                          : isDarkMode
                            ? "text-emerald-400"
                            : "text-emerald-600"
                      }`}
                    >
                      {formatAmount(amount)}
                    </span>
                  </div>

                  {/* Details row */}
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex items-center gap-2">
                      {node.reason && (
                        <span className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                          {node.reason}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {node.date && (
                        <span className={`text-[10px] ${isDarkMode ? "text-gray-600" : "text-gray-400"}`}>
                          {node.date}
                        </span>
                      )}
                      {linkEdge && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                            isDarkMode ? "bg-gray-700/50 text-gray-500" : "bg-gray-50 text-gray-400"
                          }`}
                        >
                          {linkEdge.linkType}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Running balance */}
                <div className={`text-[10px] font-mono mt-1 ml-1 ${isDarkMode ? "text-gray-600" : "text-gray-400"}`}>
                  Balance: AED {runningBalance.toLocaleString("en-AE", { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Computed summary */}
      {computed && (
        <div
          className={`mt-3 px-3 py-2 rounded-lg border text-xs ${
            isDarkMode ? "bg-gray-800/30 border-gray-700/50 text-gray-400" : "bg-gray-50 border-gray-100 text-gray-500"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-medium">Net Position</span>
            <span className="font-mono font-semibold">
              AED {(computed.balance ?? 0).toLocaleString("en-AE", { minimumFractionDigits: 2 })}
            </span>
          </div>
          {computed.vatNet != null && (
            <div className="flex items-center justify-between mt-1">
              <span>Net VAT Impact</span>
              <span className="font-mono">
                AED {computed.vatNet.toLocaleString("en-AE", { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}
          {computed.nodeCount != null && (
            <div className="flex items-center justify-between mt-1">
              <span>Documents in chain</span>
              <span className="font-mono">{computed.nodeCount}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CorrectionChainTimeline;
