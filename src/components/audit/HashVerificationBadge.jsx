
import { CheckCircle, AlertTriangle, Copy } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Hash Verification Badge Component
 * Displays SHA-256 hash with verification status
 * Indicates data integrity with visual indicators
 */

export default function HashVerificationBadge({ hash, verified = true }) {
  const copyToClipboard = () => {
    navigator.clipboard.writeText(hash);
    toast.success('Hash copied to clipboard');
  };

  return (
    <div
      className={`p-4 rounded-lg border-2 ${
        verified
          ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
          : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
      }`}
    >
      <div className="flex items-start gap-3">
        {verified ? (
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
        ) : (
          <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
        )}

        <div className="flex-1 min-w-0">
          <h4
            className={`font-semibold text-sm mb-2 ${
              verified
                ? 'text-green-900 dark:text-green-100'
                : 'text-red-900 dark:text-red-100'
            }`}
          >
            {verified ? '✓ Data Integrity Verified' : '✗ Data Integrity Issue'}
          </h4>

          <p
            className={`text-xs mb-3 ${
              verified
                ? 'text-green-800 dark:text-green-200'
                : 'text-red-800 dark:text-red-200'
            }`}
          >
            {verified
              ? 'SHA-256 hash matches immutable snapshot. Data has not been modified.'
              : 'Hash mismatch detected! Data may have been modified after lock.'}
          </p>

          {hash && (
            <div className="flex items-center gap-2">
              <code
                className={`text-xs font-mono flex-1 truncate p-2 rounded ${
                  verified
                    ? 'bg-green-100 dark:bg-green-900/50 text-green-900 dark:text-green-100'
                    : 'bg-red-100 dark:bg-red-900/50 text-red-900 dark:text-red-100'
                }`}
              >
                {hash}
              </code>
              <button
                onClick={copyToClipboard}
                className={`p-2 rounded hover:bg-opacity-80 transition-colors ${
                  verified
                    ? 'hover:bg-green-200 dark:hover:bg-green-800'
                    : 'hover:bg-red-200 dark:hover:bg-red-800'
                }`}
                title="Copy hash to clipboard"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
