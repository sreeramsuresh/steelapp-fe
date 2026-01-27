import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAuditHub } from '../../contexts/AuditHubContext';
import auditHubService from '../../services/auditHubService';
import DatasetTabs from '../../components/audit/DatasetTabs';
import ExportPanel from '../../components/audit/ExportPanel';
import HashVerificationBadge from '../../components/audit/HashVerificationBadge';
import toast from 'react-hot-toast';

/**
 * Dataset Explorer Page
 * View and verify immutable snapshot data across all modules
 * Enables export generation and integrity verification
 */

export default function DatasetExplorer() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { datasetId } = useParams();
  const { selectDataset } = useAuditHub();

  const [dataset, setDataset] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeModule, setActiveModule] = useState('SALES');
  const [moduleData, setModuleData] = useState([]);
  const [verifying, setVerifying] = useState(false);
  const [exportStatus, setExportStatus] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);

  // Guard: Redirect if no company context
  useEffect(() => {
    if (!user?.companyId) {
      navigate('/select-company');
      return;
    }
  }, [user?.companyId, navigate]);

  // Load data for selected module
  const loadModuleData = useCallback(
    async (module) => {
      try {
        const data = await auditHubService.getDatasetTransactions(
          user.companyId,
          datasetId,
          module,
          { page: 1, limit: itemsPerPage },
        );
        setModuleData(data?.data || data || []);
        setCurrentPage(1);
      } catch (err) {
        toast.error(`Failed to load ${module} data: ${err.message}`);
      }
    },
    [user?.companyId, datasetId, itemsPerPage],
  );

  // Load dataset on mount or when ID changes
  useEffect(() => {
    if (!user?.companyId || !datasetId) return;

    const loadDataset = async () => {
      setLoading(true);
      try {
        const data = await auditHubService.getDatasetById(
          user.companyId,
          datasetId,
        );
        setDataset(data?.data || data);
        selectDataset(data?.data || data);

        // Load initial module data (SALES)
        await loadModuleData('SALES');
      } catch (err) {
        toast.error(`Failed to load dataset: ${err.message}`);
        navigate('/app/audit-hub');
      } finally {
        setLoading(false);
      }
    };

    loadDataset();
  }, [user?.companyId, datasetId, navigate, selectDataset, loadModuleData]);

  // Handle module tab change
  const handleModuleChange = async (module) => {
    setActiveModule(module);
    await loadModuleData(module);
  };

  // Verify export regeneration (FIX 4)
  const handleVerifyRegeneration = async (exportType) => {
    setVerifying(true);
    try {
      const result = await auditHubService.verifyExportRegeneration(
        user.companyId,
        datasetId,
        exportType,
      );

      setExportStatus((prev) => ({
        ...prev,
        [exportType]: result,
      }));

      if (result.is_deterministic) {
        toast.success(`✓ ${exportType} export is deterministic (byte-perfect)`);
      } else {
        toast.error(`✗ ${exportType} export hashes don't match!`);
      }
    } catch (err) {
      toast.error(`Verification failed: ${err.message}`);
    } finally {
      setVerifying(false);
    }
  };

  if (!user?.companyId) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin">
              <RefreshCw className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto" />
            </div>
            <p className="mt-4 text-slate-600 dark:text-slate-400">
              Loading dataset...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!dataset) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
            onClick={() => navigate('/audit-hub')}
            className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Periods
          </button>
          <div className="bg-white dark:bg-slate-800 rounded-lg p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 dark:text-red-400">Dataset not found</p>
          </div>
        </div>
      </div>
    );
  }

  const modules = ['SALES', 'PURCHASES', 'INVENTORY', 'VAT', 'BANK'];
  const totalPages = Math.ceil((moduleData.length || 0) / itemsPerPage);
  const paginatedData = moduleData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/audit-hub')}
              className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Periods
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Dataset Snapshot
              </h1>
              <p className="mt-2 text-slate-600 dark:text-slate-400">
                Period ID: {dataset.period_id || 'N/A'} • Dataset ID: {datasetId}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Records: {dataset.record_count}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Total Amount:{' '}
                {dataset.total_amount
                  ? `AED ${dataset.total_amount.toFixed(2)}`
                  : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Integrity Badge */}
        <div className="mb-8">
          <HashVerificationBadge hash={dataset.module_hash} verified={true} />
        </div>

        {/* Export Panel */}
        <div className="mb-8">
          <ExportPanel
            datasetId={datasetId}
            onExportGenerated={() => {
              toast.success('Export generated successfully');
              // Refresh export status
              handleVerifyRegeneration('EXCEL');
            }}
            onVerifyRegeneration={handleVerifyRegeneration}
            verifying={verifying}
            exportStatus={exportStatus}
          />
        </div>

        {/* Data Tabs */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow">
          <DatasetTabs
            modules={modules}
            activeModule={activeModule}
            onModuleChange={handleModuleChange}
            recordCounts={{
              SALES: dataset.module_name === 'SALES' ? dataset.record_count : 0,
              PURCHASES:
                dataset.module_name === 'PURCHASES' ? dataset.record_count : 0,
              INVENTORY:
                dataset.module_name === 'INVENTORY' ? dataset.record_count : 0,
              VAT: dataset.module_name === 'VAT' ? dataset.record_count : 0,
              BANK: dataset.module_name === 'BANK' ? dataset.record_count : 0,
            }}
          />

          {/* Table Section */}
          <div className="p-6">
            {moduleData.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-400">
                  No transactions in this module
                </p>
              </div>
            ) : (
              <>
                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-50 dark:bg-slate-900">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          Reference
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                          Hash
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {paginatedData.map((record) => (
                        <tr
                          key={record.record_hash || record.id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                            {record.transaction_date}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <a
                              href={record.reference_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              {record.reference_number}
                            </a>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                            {record.total_amount
                              ? `AED ${record.total_amount.toFixed(2)}`
                              : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Captured
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm font-mono text-slate-600 dark:text-slate-400 truncate">
                            {record.record_hash}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-between">
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                      {Math.min(currentPage * itemsPerPage, moduleData.length)}{' '}
                      of {moduleData.length}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.max(1, p - 1))
                        }
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-300 dark:hover:bg-slate-600"
                      >
                        Previous
                      </button>
                      <div className="flex items-center gap-2">
                        {Array.from(
                          { length: totalPages },
                          (_, i) => i + 1,
                        ).map((page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              currentPage === page
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() =>
                          setCurrentPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-300 dark:hover:bg-slate-600"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
