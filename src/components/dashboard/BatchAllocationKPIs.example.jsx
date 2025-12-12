/**
 * USAGE EXAMPLE: BatchAllocationKPIs Component
 *
 * This example shows how to integrate the BatchAllocationKPIs component
 * into your Stock Dashboard or any other dashboard page.
 */

import { useState } from 'react';
import BatchAllocationKPIs from './BatchAllocationKPIs';

// Example 1: Basic usage
function StockDashboard() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Stock Dashboard</h1>

      {/* Add the KPI cards */}
      <BatchAllocationKPIs />

      {/* Other dashboard content */}
      <div className="grid grid-cols-2 gap-4">
        {/* Other widgets */}
      </div>
    </div>
  );
}

// Example 2: With refresh trigger
function StockDashboardWithRefresh() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRefreshAll = () => {
    // Increment trigger to force refresh
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Stock Dashboard</h1>
        <button
          onClick={handleRefreshAll}
          className="px-4 py-2 bg-blue-500 text-white rounded-md"
        >
          Refresh All
        </button>
      </div>

      {/* Pass refreshTrigger to force re-fetch */}
      <BatchAllocationKPIs refreshTrigger={refreshTrigger} />

      {/* Other dashboard content that also uses refreshTrigger */}
    </div>
  );
}

// Example 3: Inside a dashboard section
function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Stock Management Dashboard
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Monitor batch allocations, stock levels, and inventory metrics
          </p>
        </div>

        {/* Batch Allocation KPIs Section */}
        <section className="mb-8">
          <BatchAllocationKPIs />
        </section>

        {/* Other sections */}
        <section className="mb-8">
          {/* Stock levels, warehouse status, etc. */}
        </section>
      </div>
    </div>
  );
}

export { StockDashboard, StockDashboardWithRefresh, DashboardPage };
