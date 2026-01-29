
import { Filter } from 'lucide-react';

/**
 * Period Filters Component
 * Allows filtering periods by year and status
 */

export default function PeriodFilters({ filters, onFilterChange }) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const statusOptions = [
    { value: null, label: 'All Status' },
    { value: 'OPEN', label: 'Open' },
    { value: 'REVIEW', label: 'In Review' },
    { value: 'LOCKED', label: 'Locked' },
    { value: 'FINALIZED', label: 'Finalized' },
  ];

  const handleYearChange = (year) => {
    onFilterChange({ ...filters, year });
  };

  const handleStatusChange = (status) => {
    onFilterChange({ ...filters, status });
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow border border-slate-200 dark:border-slate-700 p-4">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
          Filters
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Year Filter */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Year
          </label>
          <select
            value={filters.year || ''}
            onChange={(e) => handleYearChange(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Status
          </label>
          <select
            value={filters.status || ''}
            onChange={(e) => handleStatusChange(e.target.value || null)}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
          >
            {statusOptions.map((option) => (
              <option key={option.value || 'null'} value={option.value || ''}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
