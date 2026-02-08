import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { invoiceService } from "../services/invoiceService";
import notificationService from "../services/notificationService";
import { warehouseService } from "../services/warehouseService";
import ConfirmDialog from "./ConfirmDialog";

/**
 * Invoice Allocation Confirmation Screen
 *
 * Displays allocated batches with countdown timer (5 minutes)
 * User can confirm allocation or edit invoice
 *
 * Phase 2.1: Hybrid Auto-Confirm Strategy
 * - Invoice gets created immediately (not cancelled)
 * - Batches are reserved with PENDING_CONFIRMATION status
 * - User has 5 minutes to confirm or edit
 * - Auto-confirms after 5 minutes to prevent orphaned reservations
 */
const InvoiceAllocationConfirmation = () => {
  const { invoiceId } = useParams();
  const navigate = useNavigate();

  const [invoice, setInvoice] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const [timeRemaining, setTimeRemaining] = useState(null); // seconds
  const [isConfirming, setIsConfirming] = useState(false);
  const [isReleasing, setIsReleasing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editConfirm, setEditConfirm] = useState({
    open: false,
  });

  // Fetch invoice data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [invoiceData, warehouseData] = await Promise.all([
          invoiceService.getInvoice(invoiceId),
          warehouseService.getWarehouses(),
        ]);

        setInvoice(invoiceData);
        setWarehouses(warehouseData);

        // Calculate time remaining
        if (invoiceData.expiresAt) {
          const expiryTime = new Date(invoiceData.expiresAt).getTime();
          const now = Date.now();
          const remainingMs = expiryTime - now;
          setTimeRemaining(Math.max(0, Math.floor(remainingMs / 1000)));
        }
      } catch (err) {
        console.error("Failed to load invoice:", err);
        setError("Failed to load invoice details. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [invoiceId]);

  // Countdown timer
  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Time expired - auto-confirm will happen on backend
          notificationService.info("Time expired. Allocation has been automatically confirmed.");
          navigate("/app/invoices");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, navigate]);

  const handleConfirm = async () => {
    if (isConfirming) return;

    try {
      setIsConfirming(true);
      await invoiceService.confirmInvoiceAllocation(invoiceId);
      notificationService.success("Batch allocation confirmed successfully!");
      navigate("/app/invoices");
    } catch (err) {
      console.error("Failed to confirm allocation:", err);
      notificationService.error("Failed to confirm allocation. Please try again.");
    } finally {
      setIsConfirming(false);
    }
  };

  const handleEditInvoice = async () => {
    if (isReleasing) return;
    setEditConfirm({ open: true });
  };

  const confirmEditInvoice = async () => {
    try {
      setIsReleasing(true);
      await invoiceService.releaseInvoiceReservation(invoiceId);
      notificationService.info("Reservation released. You can now edit the invoice.");
      navigate(`/edit/${invoiceId}`);
    } catch (err) {
      console.error("Failed to release reservation:", err);
      notificationService.error("Failed to release reservation. Please try again.");
    } finally {
      setIsReleasing(false);
    }
  };

  // Format time remaining as MM:SS
  const formatTime = (seconds) => {
    if (seconds === null) return "--:--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading invoice details...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 text-lg">{error || "Invoice not found"}</p>
          <button
            type="button"
            onClick={() => navigate("/app/invoices")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Invoices
          </button>
        </div>
      </div>
    );
  }

  // Check if invoice has pending confirmation
  if (!invoice.expiresAt) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 text-lg">This invoice does not require confirmation.</p>
          <button
            type="button"
            onClick={() => navigate("/app/invoices")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Invoices
          </button>
        </div>
      </div>
    );
  }

  const isExpired = timeRemaining === 0;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header with countdown */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Confirm Batch Allocation</h1>
            <p className="text-gray-600 mt-1">Invoice: {invoice.invoiceNumber}</p>
          </div>

          {/* Countdown Timer */}
          <div className="text-center">
            <div
              className={`text-4xl font-bold ${
                timeRemaining > 60 ? "text-green-600" : timeRemaining > 30 ? "text-yellow-600" : "text-red-600"
              }`}
            >
              {formatTime(timeRemaining)}
            </div>
            <p className="text-sm text-gray-600 mt-1">Time remaining</p>
          </div>
        </div>

        {/* Warning banner */}
        {!isExpired && (
          <div className="mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
            <div className="flex items-start">
              <svg aria-label="icon" className="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <title>Icon</title>
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="ml-3">
                <p className="text-sm text-yellow-800">
                  <strong>Action Required:</strong> Please review the batch allocation below and confirm within{" "}
                  {formatTime(timeRemaining)}. If no action is taken, the allocation will be automatically confirmed.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Invoice Items with Batch Allocations */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Allocated Batches</h2>

        <div className="space-y-6">
          {invoice.items?.map((item, itemIndex) => {
            const allocations = item.batchAllocations || [];
            if (allocations.length === 0) return null;

            return (
              <div key={item.id || item.name || `item-${itemIndex}`} className="border rounded-lg p-4">
                {/* Item Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-800">{item.name}</h3>
                    <p className="text-sm text-gray-600">
                      Quantity: {item.quantity} {item.unit}
                    </p>
                  </div>

                  {/* Stock Availability Summary */}
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500">Stock availability:</span>
                    <div className="flex items-center gap-4 ml-2">
                      {warehouses.map((wh) => {
                        const whAllocations = allocations.filter((a) => a.warehouseId === wh.id);
                        const totalQty = whAllocations.reduce((sum, a) => sum + (a.quantity || 0), 0);
                        const hasStock = totalQty > 0;

                        return (
                          <span
                            key={wh.id}
                            className={`text-xs font-medium ${hasStock ? "text-gray-700" : "text-red-500"}`}
                          >
                            {wh.name || wh.code}{" "}
                            <span className={hasStock ? "text-green-600 font-bold" : "text-red-500 font-bold"}>
                              {totalQty}
                            </span>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Batch Allocation Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Batch</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Warehouse</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Procurement</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Origin</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {allocations.map((allocation, allocationIndex) => {
                        const warehouse = warehouses.find((w) => w.id === allocation.warehouseId);
                        return (
                          <tr key={allocation.id || allocation.name || `allocation-${allocationIndex}`}>
                            <td className="px-4 py-2 text-sm text-gray-900">{allocation.batchNumber || "N/A"}</td>
                            <td className="px-4 py-2 text-sm text-gray-600">
                              {warehouse?.name || warehouse?.code || "N/A"}
                            </td>
                            <td className="px-4 py-2 text-sm">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                  allocation.procurementChannel === "IMPORT"
                                    ? "bg-blue-100 text-blue-800"
                                    : allocation.procurementChannel === "LOCAL"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {allocation.procurementChannel || "N/A"}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm text-right font-medium text-gray-900">
                              {allocation.quantity}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-600">{allocation.origin || "N/A"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex items-center justify-end gap-4">
        <button
          type="button"
          onClick={handleEditInvoice}
          disabled={isReleasing || isExpired}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isReleasing ? "Releasing..." : "Edit Invoice"}
        </button>

        <button
          type="button"
          onClick={handleConfirm}
          disabled={isConfirming || isExpired}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isConfirming ? "Confirming..." : "Confirm Allocation"}
        </button>
      </div>

      {/* Edit Invoice Confirmation Dialog */}
      {editConfirm.open && (
        <ConfirmDialog
          title="Edit Invoice?"
          message="Are you sure you want to edit this invoice? The current batch allocation will be released."
          variant="warning"
          onConfirm={() => {
            confirmEditInvoice();
            setEditConfirm({ open: false });
          }}
          onCancel={() => setEditConfirm({ open: false })}
        />
      )}
    </div>
  );
};

export default InvoiceAllocationConfirmation;
