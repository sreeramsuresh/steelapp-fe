/**
 * CreditNoteStatusActions - Status transition action buttons
 *
 * Fetches allowed transitions from backend and renders appropriate action buttons.
 * Backend is source of truth for what transitions are valid.
 */

import { Banknote, CheckCircle, ClipboardCheck, CreditCard, Loader2, Package, Send, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { creditNoteService } from "../../services/creditNoteService";
import { notificationService } from "../../services/notificationService";
import ConfirmDialog from "../ConfirmDialog";

// Action configuration - maps status to button config
const ACTION_CONFIG = {
  issued: {
    label: "Issue",
    icon: Send,
    color: "bg-blue-600 hover:bg-blue-700",
    confirm: "Issue this credit note?",
  },
  items_received: {
    label: "Mark Received",
    icon: Package,
    color: "bg-yellow-600 hover:bg-yellow-700",
    confirm: "Mark items as received?",
  },
  items_inspected: {
    label: "Inspect Items",
    icon: ClipboardCheck,
    color: "bg-purple-600 hover:bg-purple-700",
    requiresModal: true,
  },
  applied: {
    label: "Apply Credit",
    icon: CreditCard,
    color: "bg-green-600 hover:bg-green-700",
    confirm: "Apply credit to customer account?",
  },
  refunded: {
    label: "Refund",
    icon: Banknote,
    color: "bg-emerald-600 hover:bg-emerald-700",
    requiresModal: true,
  },
  completed: {
    label: "Complete",
    icon: CheckCircle,
    color: "bg-teal-600 hover:bg-teal-700",
    confirm: "Mark this credit note as completed?",
  },
  cancelled: {
    label: "Cancel",
    icon: XCircle,
    color: "bg-red-600 hover:bg-red-700",
    requiresReason: true,
  },
};

const CreditNoteStatusActions = ({
  creditNoteId,
  currentStatus,
  onStatusChange,
  onOpenQCModal,
  onOpenRefundModal,
  compact = false,
}) => {
  const [allowedTransitions, setAllowedTransitions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [confirmAction, setConfirmAction] = useState({
    open: false,
    targetStatus: null,
    message: null,
  });

  useEffect(() => {
    if (creditNoteId) {
      loadAllowedTransitions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creditNoteId, loadAllowedTransitions]); // loadAllowedTransitions is stable

  const loadAllowedTransitions = async () => {
    try {
      setLoading(true);
      const response = await creditNoteService.getAllowedTransitions(creditNoteId);
      setAllowedTransitions(response.allowed_transitions || response.allowedTransitions || []);
    } catch (error) {
      console.error("Failed to load allowed transitions:", error);
      setAllowedTransitions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (targetStatus) => {
    const config = ACTION_CONFIG[targetStatus];
    if (!config) return;

    if (targetStatus === "items_inspected" && onOpenQCModal) {
      onOpenQCModal();
      return;
    }

    if (targetStatus === "refunded" && onOpenRefundModal) {
      onOpenRefundModal();
      return;
    }

    if (targetStatus === "cancelled") {
      const reason = window.prompt("Please provide a reason for cancellation:");
      if (reason === null) return;
      await executeTransition(targetStatus, { cancellationReason: reason });
      return;
    }

    if (config.confirm) {
      setConfirmAction({
        open: true,
        targetStatus,
        message: config.confirm,
      });
      return;
    }

    await executeTransition(targetStatus);
  };

  const executeTransition = async (targetStatus, extraData = {}) => {
    try {
      setActionLoading(targetStatus);
      let result;

      switch (targetStatus) {
        case "issued":
          result = await creditNoteService.issueCreditNote(creditNoteId);
          break;
        case "items_received":
          result = await creditNoteService.markItemsReceived(creditNoteId, extraData);
          break;
        case "applied":
          result = await creditNoteService.applyCreditNote(creditNoteId, extraData.notes);
          break;
        case "completed":
          result = await creditNoteService.completeCreditNote(creditNoteId, extraData.notes);
          break;
        case "cancelled":
          result = await creditNoteService.cancelCreditNote(creditNoteId, extraData.cancellationReason);
          break;
        default:
          throw new Error(`Unknown transition: ${targetStatus}`);
      }

      notificationService.success(`Credit note ${targetStatus.replace("_", " ")} successfully`);
      if (onStatusChange) {
        onStatusChange(result);
      }
      loadAllowedTransitions();
    } catch (error) {
      console.error(`Failed to transition to ${targetStatus}:`, error);
      notificationService.error(error.message || `Failed to ${targetStatus.replace("_", " ")} credit note`);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  if (allowedTransitions.length === 0) {
    return null;
  }

  return (
    <>
      <div className={`flex ${compact ? "gap-1" : "gap-2"} flex-wrap`}>
        {allowedTransitions.map((transition) => {
          const config = ACTION_CONFIG[transition];
          if (!config) return null;

          const Icon = config.icon;
          const isLoading = actionLoading === transition;

          return (
            <button
              key={transition}
              onClick={() => handleAction(transition)}
              disabled={isLoading || actionLoading !== null}
              className={`
                inline-flex items-center gap-1.5
                ${compact ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm"}
                font-medium text-white rounded-md
                ${config.color}
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors
              `}
            >
              {isLoading ? (
                <Loader2 className={`${compact ? "w-3 h-3" : "w-4 h-4"} animate-spin`} />
              ) : (
                <Icon className={compact ? "w-3 h-3" : "w-4 h-4"} />
              )}
              {config.label}
            </button>
          );
        })}
      </div>

      {/* Action Confirmation Dialog */}
      {confirmAction.open && (
        <ConfirmDialog
          title="Confirm Action?"
          message={confirmAction.message}
          variant="warning"
          onConfirm={() => {
            executeTransition(confirmAction.targetStatus);
            setConfirmAction({ open: false, targetStatus: null, message: null });
          }}
          onCancel={() => setConfirmAction({ open: false, targetStatus: null, message: null })}
        />
      )}
    </>
  );
};

export default CreditNoteStatusActions;
