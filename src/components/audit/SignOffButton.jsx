import React from 'react';
import { CheckCircle } from 'lucide-react';

/**
 * Sign-Off Button Component
 * Role-based button for signing off periods at different stages
 */

export default function SignOffButton({
  stage,
  label,
  onClick,
  disabled = false,
  loading = false,
  canUserSignOff = false,
}) {
  if (!canUserSignOff) {
    return (
      <button
        disabled
        className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg font-medium cursor-not-allowed opacity-50"
        title={`You don't have permission to sign off as ${stage}`}
      >
        <CheckCircle className="w-4 h-4" />
        {label}
      </button>
    );
  }

  const colorClasses = {
    PREPARED: 'bg-blue-600 hover:bg-blue-700 text-white',
    REVIEWED: 'bg-amber-600 hover:bg-amber-700 text-white',
    LOCKED: 'bg-green-600 hover:bg-green-700 text-white',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        colorClasses[stage] || 'bg-blue-600 hover:bg-blue-700 text-white'
      }`}
    >
      <CheckCircle className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
      {loading ? 'Signing off...' : label}
    </button>
  );
}
