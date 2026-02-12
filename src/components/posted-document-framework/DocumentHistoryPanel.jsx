import { AlertTriangle, ChevronDown, ChevronRight, GitBranch, Loader2, PlusCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext";
import { documentLinkService } from "../../services/documentLinkService";
import DOC_TYPE_CONFIG from "../finance/documentTypeConfig";
import CorrectionChainTimeline from "./CorrectionChainTimeline";
import ImmutabilityBanner from "./ImmutabilityBanner";

/**
 * Reusable "Document History" panel.
 * Drop this into any posted document form page to show the correction chain.
 *
 * Props:
 *   documentType  — e.g. "invoice", "credit_note", "supplier_bill"
 *   documentId    — the document's primary key (number or string)
 *   documentStatus — current status string (e.g. "issued", "draft")
 *   allowedActions — array of { label, type, href } for action buttons shown only in live mode
 *   compact        — if true, renders a smaller version (default false)
 */
const DocumentHistoryPanel = ({ documentType, documentId, documentStatus, allowedActions = [], compact = false }) => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [graphData, setGraphData] = useState(null);

  const isPosted = ["issued", "posted", "approved", "confirmed"].includes(
    (documentStatus || "").toLowerCase().replace("status_", "")
  );

  const fetchGraph = useCallback(async () => {
    if (!documentId || !documentType) return;
    setLoading(true);
    setError(null);
    try {
      const data = await documentLinkService.getCorrectionChain(documentType, documentId);
      setGraphData(data);
    } catch (err) {
      // 404 means no chain exists yet — not an error
      if (err?.response?.status === 404) {
        setGraphData(null);
      } else {
        setError("Failed to load document history");
      }
    } finally {
      setLoading(false);
    }
  }, [documentType, documentId]);

  // Auto-fetch when expanded
  useEffect(() => {
    if (expanded && !graphData && !loading) {
      fetchGraph();
    }
  }, [expanded, graphData, loading, fetchGraph]);

  // Auto-expand if the document is posted (likely has a chain)
  useEffect(() => {
    if (isPosted && documentId) {
      setExpanded(true);
    }
  }, [isPosted, documentId]);

  const handleNavigate = useCallback(
    (docType, docId) => {
      const config = DOC_TYPE_CONFIG[docType];
      if (config?.navigateTo) {
        navigate(config.navigateTo(docId));
      }
    },
    [navigate]
  );

  const hasChain = graphData?.nodes?.length > 1;
  const docLabel = DOC_TYPE_CONFIG[documentType]?.label || documentType;

  // Don't render if document hasn't been saved yet
  if (!documentId) return null;

  return (
    <div
      className={`rounded-xl border ${isDarkMode ? "bg-gray-800/30 border-gray-700/50" : "bg-white border-gray-200"}`}
    >
      {/* Collapsible Header */}
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className={`w-full flex items-center justify-between px-4 py-3 text-left rounded-xl transition-colors ${
          isDarkMode ? "hover:bg-gray-700/30" : "hover:bg-gray-50"
        }`}
      >
        <div className="flex items-center gap-2">
          <GitBranch className={`h-4 w-4 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`} />
          <span className={`text-sm font-semibold ${isDarkMode ? "text-gray-200" : "text-gray-700"}`}>
            Document History
          </span>
          {hasChain && (
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                isDarkMode ? "bg-blue-900/30 text-blue-400" : "bg-blue-50 text-blue-600"
              }`}
            >
              {graphData.nodes.length} docs
            </span>
          )}
        </div>
        {expanded ? (
          <ChevronDown className={`h-4 w-4 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} />
        ) : (
          <ChevronRight className={`h-4 w-4 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} />
        )}
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {/* Immutability banner for posted documents */}
          {isPosted && (
            <ImmutabilityBanner
              text={`This ${docLabel} is posted and cannot be modified directly. Use correction documents to make adjustments.`}
              variant="info"
              documentType={docLabel}
              compact={compact}
            />
          )}

          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className={`h-5 w-5 animate-spin ${isDarkMode ? "text-gray-500" : "text-gray-400"}`} />
              <span className={`ml-2 text-sm ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                Loading correction chain...
              </span>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
                isDarkMode ? "bg-red-900/20 text-red-400" : "bg-red-50 text-red-600"
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span>{error}</span>
              <button type="button" onClick={fetchGraph} className="ml-auto underline">
                Retry
              </button>
            </div>
          )}

          {/* Chain timeline */}
          {!loading && !error && hasChain && (
            <CorrectionChainTimeline
              nodes={graphData.nodes}
              edges={graphData.edges}
              computed={graphData.computed}
              onNavigate={handleNavigate}
              mode="live"
            />
          )}

          {/* No chain yet */}
          {!loading && !error && !hasChain && graphData && (
            <div className={`text-xs text-center py-4 ${isDarkMode ? "text-gray-600" : "text-gray-400"}`}>
              No correction history. This is the original document.
            </div>
          )}

          {/* Action buttons — only for posted documents */}
          {isPosted && allowedActions.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {allowedActions.map((action) => (
                <button
                  key={action.type}
                  type="button"
                  onClick={() => navigate(action.href)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    isDarkMode
                      ? "border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-gray-500"
                      : "border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300"
                  }`}
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentHistoryPanel;
