import React from 'react';
import { Clock, CheckCircle, Lock, AlertCircle } from 'lucide-react';

/**
 * Period Status Badge Component
 * Visual indicator for period status
 */

export default function PeriodStatusBadge({ status }) {
  const statusConfig = {
    OPEN: {
      icon: Clock,
      bgColor: 'bg-gray-100 dark:bg-gray-800',
      textColor: 'text-gray-700 dark:text-gray-300',
      label: 'Open',
      dotColor: 'bg-gray-500'
    },
    REVIEW: {
      icon: CheckCircle,
      bgColor: 'bg-amber-100 dark:bg-amber-900/30',
      textColor: 'text-amber-700 dark:text-amber-300',
      label: 'In Review',
      dotColor: 'bg-amber-500'
    },
    LOCKED: {
      icon: Lock,
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      textColor: 'text-green-700 dark:text-green-300',
      label: 'Locked',
      dotColor: 'bg-green-500'
    },
    FINALIZED: {
      icon: Lock,
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      textColor: 'text-blue-700 dark:text-blue-300',
      label: 'Finalized',
      dotColor: 'bg-blue-500'
    },
    AMENDED: {
      icon: AlertCircle,
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
      textColor: 'text-orange-700 dark:text-orange-300',
      label: 'Amended',
      dotColor: 'bg-orange-500'
    }
  };

  const config = statusConfig[status] || statusConfig.OPEN;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${config.bgColor} ${config.textColor}`}>
      <span className={`w-2 h-2 rounded-full ${config.dotColor}`}></span>
      <Icon className="w-4 h-4" />
      {config.label}
    </span>
  );
}
