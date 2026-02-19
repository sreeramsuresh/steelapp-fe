import { AlertCircle, CheckCircle, Clock } from "lucide-react";

/**
 * Audit Trail View Component
 * Timeline visualization of period lifecycle events
 * Shows all sign-offs and state transitions
 */

export default function AuditTrailView({ datasetId: _datasetId, signOffs = [] }) {
  const getEventIcon = (stage) => {
    switch (stage) {
      case "PREPARED":
        return <CheckCircle className="w-4 h-4" />;
      case "REVIEWED":
        return <CheckCircle className="w-4 h-4" />;
      case "LOCKED":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getEventColor = (stage) => {
    switch (stage) {
      case "PREPARED":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300";
      case "REVIEWED":
        return "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300";
      case "LOCKED":
        return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300";
      default:
        return "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400";
    }
  };

  const sortedSignOffs = [...signOffs].sort((a, b) => new Date(a.signed_at) - new Date(b.signed_at));

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-6">Audit Trail</h2>

      {sortedSignOffs.length === 0 ? (
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">No audit events yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedSignOffs.map((event, idx) => (
            <div key={event.id || event.name || `event-${idx}`} className="flex gap-4">
              {/* Timeline Line */}
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getEventColor(event.stage)}`}>
                  {getEventIcon(event.stage)}
                </div>
                {idx < sortedSignOffs.length - 1 && <div className="w-1 h-12 mt-2 bg-slate-200 dark:bg-slate-700" />}
              </div>

              {/* Content */}
              <div className="flex-1 pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">
                      {event.stage === "PREPARED" && "Period Prepared"}
                      {event.stage === "REVIEWED" && "Period Reviewed"}
                      {event.stage === "LOCKED" && "Period Locked"}
                    </h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      {event.user_name} ({event.user_role})
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                      {new Date(event.signed_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        event.stage === "PREPARED"
                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                          : event.stage === "REVIEWED"
                            ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                            : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                      }`}
                    >
                      {event.stage}
                    </span>
                  </div>
                </div>

                {event.comments && (
                  <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded">
                    <p className="text-sm text-slate-700 dark:text-slate-300 italic">&quot;{event.comments}&quot;</p>
                  </div>
                )}

                {event.digital_signature && (
                  <div className="mt-2 text-xs text-slate-500 dark:text-slate-500 font-mono break-all">
                    Signature: {event.digital_signature.substring(0, 16)}...
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
