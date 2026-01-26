import React, { useState } from 'react';
import { Download, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import auditHubService from '../../services/auditHubService';
import toast from 'react-hot-toast';

/**
 * Export Panel Component
 * Generate and verify export files (Excel, PDF, CSV)
 * Implements FIX 4: Deterministic export verification
 */

export default function ExportPanel({ datasetId, onExportGenerated, onVerifyRegeneration, verifying, exportStatus }) {
  const [generating, setGenerating] = useState({
    EXCEL: false,
    PDF: false,
    CSV: false
  });

  const exportConfigs = [
    {
      type: 'EXCEL',
      label: 'Excel Workbook',
      description: 'Multi-sheet spreadsheet with all modules',
      icon: '📊',
      color: 'emerald'
    },
    {
      type: 'PDF',
      label: 'PDF Report',
      description: 'Formatted audit package with TOC',
      icon: '📄',
      color: 'blue'
    },
    {
      type: 'CSV',
      label: 'CSV Data',
      description: 'Transaction-level raw data export',
      icon: '📋',
      color: 'amber'
    }
  ];

  const handleGenerateExport = async (exportType) => {
    setGenerating(prev => ({ ...prev, [exportType]: true }));
    try {
      const result = await auditHubService.generateExcelExport(datasetId);

      toast.success(`✓ ${exportType} export generated successfully`);

      // Trigger download
      if (result.downloadUrl) {
        const link = document.createElement('a');
        link.href = result.downloadUrl;
        link.download = result.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      onExportGenerated();
    } catch (err) {
      toast.error(`Failed to generate ${exportType}: ${err.message}`);
    } finally {
      setGenerating(prev => ({ ...prev, [exportType]: false }));
    }
  };

  const handleVerifyDeterministic = async (exportType) => {
    onVerifyRegeneration(exportType);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
          Export & Verification
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Generate deterministic exports from immutable snapshot (FIX 4)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {exportConfigs.map(config => {
          const isGenerating = generating[config.type];
          const status = exportStatus[config.type];

          return (
            <div
              key={config.type}
              className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
            >
              {/* Export Type Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xl">{config.icon}</p>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white mt-2">
                    {config.label}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    {config.description}
                  </p>
                </div>
              </div>

              {/* Verification Status */}
              {status && (
                <div className="mb-4 p-3 rounded bg-slate-50 dark:bg-slate-900">
                  {status.is_deterministic ? (
                    <div className="flex items-center gap-2 text-xs text-green-700 dark:text-green-300">
                      <CheckCircle className="w-4 h-4" />
                      <span>Deterministic verified</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-red-700 dark:text-red-300">
                      <AlertCircle className="w-4 h-4" />
                      <span>Hash mismatch!</span>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={() => handleGenerateExport(config.type)}
                  disabled={isGenerating || verifying}
                  className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isGenerating || verifying
                      ? 'opacity-50 cursor-not-allowed bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                      : `bg-${config.color}-100 dark:bg-${config.color}-900/30 text-${config.color}-700 dark:text-${config.color}-300 hover:bg-${config.color}-200 dark:hover:bg-${config.color}-900/50`
                  }`}
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Generate
                    </>
                  )}
                </button>

                <button
                  onClick={() => handleVerifyDeterministic(config.type)}
                  disabled={verifying || !status}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {verifying ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Verify
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* FIX 4 Explanation */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-xs text-blue-900 dark:text-blue-100">
          <strong>FIX 4 - Deterministic Snapshots:</strong> Exports use canonical ordering, fixed decimal places, and deterministic null handling. Regenerating the same export will produce byte-identical files. Click "Verify" to compare SHA-256 hashes.
        </p>
      </div>
    </div>
  );
}
