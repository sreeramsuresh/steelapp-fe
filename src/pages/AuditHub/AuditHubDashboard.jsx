import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, Lock, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAuditHub } from '../../contexts/AuditHubContext';
import PeriodCard from '../../components/audit/PeriodCard';
import PeriodFilters from '../../components/audit/PeriodFilters';
import PeriodStatusBadge from '../../components/audit/PeriodStatusBadge';
import CreatePeriodModal from '../../components/audit/CreatePeriodModal';
import toast from 'react-hot-toast';

/**
 * Audit Hub Dashboard
 * Main landing page for period management and snapshot viewing
 * Enforces multi-tenancy with company context
 */

export default function AuditHubDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const {
    periods,
    loading,
    error,
    filters,
    updateFilters,
    createPeriod,
    closePeriod,
    lockPeriod
  } = useAuditHub();

  const [creatingPeriod, setCreatingPeriod] = useState(false);
  const [closingPeriodId, setClosingPeriodId] = useState(null);
  const [lockingPeriodId, setLockingPeriodId] = useState(null);

  // Guard: Redirect if no company context
  useEffect(() => {
    if (!user?.companyId) {
      navigate('/select-company');
      return;
    }
  }, [user?.companyId, navigate]);

  // Handle create period
  const handleCreatePeriod = async (periodType, year, month) => {
    try {
      await createPeriod(periodType, year, month);
      setCreatingPeriod(false);
      toast.success('Period created successfully!');
    } catch (err) {
      toast.error(`Failed to create period: ${err.message}`);
    }
  };

  // Handle close period
  const handleClosePeriod = async (periodId) => {
    setClosingPeriodId(periodId);
    try {
      await closePeriod(periodId);
      toast.success('Period closed successfully. Snapshots are being generated...');
    } catch (err) {
      toast.error(`Failed to close period: ${err.message}`);
    } finally {
      setClosingPeriodId(null);
    }
  };

  // Handle lock period
  const handleLockPeriod = async (periodId) => {
    setLockingPeriodId(periodId);
    try {
      await lockPeriod(periodId);
      toast.success('Period locked successfully!');
    } catch (err) {
      toast.error(`Failed to lock period: ${err.message}`);
    } finally {
      setLockingPeriodId(null);
    }
  };

  if (!user?.companyId) {
    return null; // Guard handled by useEffect
  }

  // Count periods by status
  const statusCounts = {
    OPEN: periods.filter(p => p.status === 'OPEN').length,
    REVIEW: periods.filter(p => p.status === 'REVIEW').length,
    LOCKED: periods.filter(p => p.status === 'LOCKED').length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Create Period Modal */}
      <CreatePeriodModal
        isOpen={creatingPeriod}
        onClose={() => setCreatingPeriod(false)}
        onCreatePeriod={handleCreatePeriod}
        isLoading={loading}
      />

      {/* Header */}
      <div className="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                <Calendar className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                Audit Hub
              </h1>
              <p className="mt-2 text-slate-600 dark:text-slate-400">
                {user.companyName} • Accounting Period Management
              </p>
            </div>
            <button
              onClick={() => setCreatingPeriod(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Period
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Open Periods</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{statusCounts.OPEN}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 border-l-4 border-amber-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">In Review</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{statusCounts.REVIEW}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-amber-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Locked</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{statusCounts.LOCKED}</p>
              </div>
              <Lock className="w-8 h-8 text-green-500 opacity-20" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <PeriodFilters filters={filters} onFilterChange={updateFilters} />
        </div>

        {/* Periods List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin">
                <Calendar className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto" />
              </div>
              <p className="mt-4 text-slate-600 dark:text-slate-400">Loading periods...</p>
            </div>
          ) : periods.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-12 text-center">
              <Calendar className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400">No periods found</p>
              <button
                onClick={() => setCreatingPeriod(true)}
                className="mt-4 text-blue-600 dark:text-blue-400 hover:underline"
              >
                Create your first period
              </button>
            </div>
          ) : (
            periods.map(period => (
              <PeriodCard
                key={period.id}
                period={period}
                onClose={() => handleClosePeriod(period.id)}
                onLock={() => handleLockPeriod(period.id)}
                onView={() => navigate(`/audit-hub/datasets/${period.id}`)}
                isClosing={closingPeriodId === period.id}
                isLocking={lockingPeriodId === period.id}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
