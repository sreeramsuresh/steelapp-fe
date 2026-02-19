import { BookOpen, ExternalLink } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import CorrectionChainTimeline from "./CorrectionChainTimeline";
import CorrectionFlowDiagram from "./CorrectionFlowDiagram";
import ImmutabilityBanner from "./ImmutabilityBanner";
import ImpactTable from "./ImpactTable";
import ScenarioCards from "./ScenarioCards";

const Section = ({ title, children, isDarkMode }) => (
  <div className="space-y-3">
    <h3 className={`text-sm font-semibold uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
      {title}
    </h3>
    {children}
  </div>
);

const DocumentWorkflowGuide = ({
  mode = "guide",
  config = {},
  graphData,
  onNavigate,
  onCreateCorrection,
  allowedActions = [],
}) => {
  const { isDarkMode } = useTheme();

  const isLive = mode === "live";
  const chainData = isLive && graphData ? graphData : config.exampleChain;

  return (
    <div className="space-y-6">
      {/* Title */}
      {mode !== "modal" && (
        <div>
          <h2 className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            {config.title || "Document Correction Guide"}
          </h2>
          {config.subtitle && (
            <p className={`text-sm mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>{config.subtitle}</p>
          )}
        </div>
      )}

      {/* Golden Rule Banner */}
      {config.bannerText && (
        <ImmutabilityBanner
          text={config.bannerText}
          variant="warning"
          documentType={config.documentTypeLabel}
          compact={mode === "modal"}
        />
      )}

      {/* Correction Flow Diagram */}
      {config.steps && config.steps.length > 0 && (
        <Section title="Correction Workflow" isDarkMode={isDarkMode}>
          <CorrectionFlowDiagram steps={config.steps} />
        </Section>
      )}

      {/* Example / Live Chain */}
      {chainData && (chainData.nodes || []).length > 0 && (
        <Section title={isLive ? "Document History" : "Example Correction Chain"} isDarkMode={isDarkMode}>
          <CorrectionChainTimeline
            nodes={chainData.nodes}
            edges={chainData.edges}
            computed={chainData.computed}
            onNavigate={isLive ? onNavigate : undefined}
            mode={mode}
          />
        </Section>
      )}

      {/* Scenarios */}
      {config.scenarios && config.scenarios.length > 0 && !isLive && (
        <Section title="Common Scenarios" isDarkMode={isDarkMode}>
          <ScenarioCards scenarios={config.scenarios} />
        </Section>
      )}

      {/* Impact Table */}
      {config.impactTable && (
        <Section title={null} isDarkMode={isDarkMode}>
          <ImpactTable
            domains={config.impactDomains || []}
            columns={config.impactTable.columns}
            rows={config.impactTable.rows}
          />
        </Section>
      )}

      {/* Live mode: action buttons */}
      {isLive && allowedActions.length > 0 && onCreateCorrection && (
        <div className="flex flex-wrap gap-2 pt-2">
          {allowedActions.map((action) => (
            <button
              type="button"
              key={action.type}
              onClick={() => onCreateCorrection(action.type)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isDarkMode
                  ? "bg-gray-700 text-gray-200 hover:bg-gray-600"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {action.icon && <action.icon className="h-3.5 w-3.5" />}
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Guide/modal: navigation link */}
      {mode === "modal" && config.guideUrl && onNavigate && (
        <div className="pt-2 border-t border-dashed mt-4" style={{ borderColor: isDarkMode ? "#374151" : "#e5e7eb" }}>
          <button
            type="button"
            onClick={() => onNavigate(config.guideUrl)}
            className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
              isDarkMode ? "text-blue-400 hover:text-blue-300" : "text-blue-600 hover:text-blue-700"
            }`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            View Full Correction Guide
            <ExternalLink className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
};

export default DocumentWorkflowGuide;
