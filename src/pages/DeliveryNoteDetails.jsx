import { AlertCircle, ArrowLeft, CheckCircle, Download, Edit, Package, Plus, Truck, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { useApiData } from "../hooks/useApi";
import { useStockValidation } from "../hooks/useStockValidation";
import { companyService } from "../services";
import { deliveryNoteService } from "../services/deliveryNoteService";
import { formatDate } from "../utils/invoiceUtils";

const DeliveryNoteDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isDarkMode } = useTheme();
  const { checkAvailability: _checkAvailability } = useStockValidation();

  const [deliveryNote, setDeliveryNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Partial delivery dialog
  const [partialDialog, setPartialDialog] = useState({
    open: false,
    item: null,
    quantity: "",
  });

  const statusLabels = {
    pending: "Pending",
    partial: "Partial Delivery",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  useEffect(() => {
    loadDeliveryNote();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadDeliveryNote]);

  const { data: _company } = useApiData(companyService.getCompany, [], true);

  const loadDeliveryNote = async () => {
    try {
      setLoading(true);
      const data = await deliveryNoteService.getById(id);
      setDeliveryNote(data);
    } catch (err) {
      setError(`Failed to load delivery note: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      // Use backend PDF generation only (per PDF_WORKFLOW.md)
      await deliveryNoteService.downloadPDF(id);
      setSuccess("PDF downloaded successfully");
    } catch (err) {
      console.error("Error downloading PDF:", err);
      setError(`Failed to download PDF: ${err.message}`);
    }
  };

  const handlePartialDelivery = async () => {
    try {
      const quantity = parseFloat(partialDialog.quantity);
      if (!quantity || quantity <= 0) {
        setError("Please enter a valid quantity");
        return;
      }

      if (quantity > partialDialog.item.remainingQuantity) {
        setError("Quantity exceeds remaining quantity");
        return;
      }

      await deliveryNoteService.updateDelivery(id, partialDialog.item.id, {
        quantity_delivered: quantity,
        notes: `Additional delivery of ${quantity} ${partialDialog.item.unit}`,
      });

      setSuccess("Delivery quantity updated successfully");
      setPartialDialog({ open: false, item: null, quantity: "" });
      loadDeliveryNote(); // Refresh data
    } catch (err) {
      setError(`Failed to update delivery: ${err.message}`);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      await deliveryNoteService.updateStatus(id, newStatus);
      setSuccess(`Status updated to ${statusLabels[newStatus]}`);
      // If marked completed, try to update related purchase order transit status
      if (newStatus === "completed" && deliveryNote?.purchaseOrderId) {
        try {
          const { purchaseOrderService } = await import("../services/purchaseOrderService");
          const { stockMovementService } = await import("../services/stockMovementService");
          // Update PO status to received
          await purchaseOrderService.updateStatus(deliveryNote.purchaseOrderId, "received");
          // Create IN stock movements for each PO item
          const po = await purchaseOrderService.getById(deliveryNote.purchaseOrderId);
          const items = Array.isArray(po?.items) ? po.items : [];
          for (const item of items) {
            if ((item.name || item.productId) && item.quantity > 0) {
              await stockMovementService.createMovement({
                date: new Date().toISOString().split("T")[0],
                movement: "IN",
                productType: item.name || "",
                grade: item.specification || "",
                thickness: "",
                size: "",
                finish: "",
                invoiceNo: po.poNumber,
                quantity: item.quantity,
                currentStock: 0,
                seller: po.supplierName || "",
                notes: `Received from PO #${po.poNumber} via Delivery Note`,
              });
            }
          }
        } catch (e) {
          console.warn("Failed to update PO transit status:", e);
        }
      }
      loadDeliveryNote(); // Refresh data
    } catch (err) {
      setError(`Failed to update status: ${err.message}`);
    }
  };

  const _formatDateLocal = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-AE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getTotalDeliveredPercentage = () => {
    if (!deliveryNote?.items?.length) return 0;

    const totalOrdered = deliveryNote.items.reduce((sum, item) => sum + item.orderedQuantity, 0);
    const totalDelivered = deliveryNote.items.reduce((sum, item) => sum + item.deliveredQuantity, 0);

    return totalOrdered > 0 ? Math.round((totalDelivered / totalOrdered) * 100) : 0;
  };

  /**
   * Render stock status badge for an item
   */
  const renderStockStatusBadge = (item) => {
    // Check if item has stock deduction information
    if (item.stockDeducted) {
      return (
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${
              isDarkMode
                ? "bg-green-900/30 text-green-300 border border-green-600"
                : "bg-green-100 text-green-800 border border-green-300"
            }`}
          >
            <CheckCircle size={12} />
            Stock Deducted ✓
          </span>
          {item.stockDeductedAt && (
            <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              {formatDate(item.stockDeductedAt)}
            </span>
          )}
        </div>
      );
    }

    // Check allocation status
    if (item.allocationStatus === "failed") {
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${
            isDarkMode
              ? "bg-red-900/30 text-red-300 border border-red-600"
              : "bg-red-100 text-red-800 border border-red-300"
          }`}
        >
          <X size={12} />
          Deduction Failed
        </span>
      );
    }

    // Pending deduction (default state)
    if (deliveryNote.status === "pending" || deliveryNote.status === "partial") {
      return (
        <span
          className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${
            isDarkMode
              ? "bg-orange-900/30 text-orange-300 border border-orange-600"
              : "bg-orange-100 text-orange-800 border border-orange-300"
          }`}
        >
          <AlertCircle size={12} />
          Pending Deduction
        </span>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <div className={`p-6 ${isDarkMode ? "bg-[#121418]" : "bg-[#FAFAFA]"}`}>
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
          <span className={`ml-4 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Loading delivery note...</span>
        </div>
      </div>
    );
  }

  if (!deliveryNote) {
    return (
      <div className={`p-6 ${isDarkMode ? "bg-[#121418]" : "bg-[#FAFAFA]"}`}>
        <div
          className={`text-center p-12 rounded-2xl border ${
            isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-[#E0E0E0]"
          }`}
        >
          <p className={`text-lg ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>Delivery note not found</p>
        </div>
      </div>
    );
  }

  const statusColors = {
    pending: isDarkMode
      ? "bg-yellow-900/30 text-yellow-300 border-yellow-600"
      : "bg-yellow-100 text-yellow-800 border-yellow-300",
    partial: isDarkMode
      ? "bg-orange-900/30 text-orange-300 border-orange-600"
      : "bg-orange-100 text-orange-800 border-orange-300",
    completed: isDarkMode
      ? "bg-green-900/30 text-green-300 border-green-600"
      : "bg-green-100 text-green-800 border-green-300",
    in_transit: isDarkMode
      ? "bg-blue-900/30 text-blue-300 border-blue-600"
      : "bg-blue-100 text-blue-800 border-blue-300",
    delivered: isDarkMode
      ? "bg-green-900/30 text-green-300 border-green-600"
      : "bg-green-100 text-green-800 border-green-300",
    cancelled: isDarkMode ? "bg-red-900/30 text-red-300 border-red-600" : "bg-red-100 text-red-800 border-red-300",
  };

  return (
    <div className={`p-6 ${isDarkMode ? "bg-[#121418]" : "bg-[#FAFAFA]"}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <button type="button" onClick={() => navigate("/delivery-notes")}
            className={`p-2 rounded mr-4 transition-colors bg-transparent ${
              isDarkMode ? "text-gray-400 hover:text-gray-300" : "hover:bg-gray-100 text-gray-600"
            }`}
          >
            <ArrowLeft size={20} />
          </button>
          <h1
            className={`text-2xl font-semibold flex items-center gap-3 ${isDarkMode ? "text-white" : "text-gray-900"}`}
          >
            <Truck size={32} className="text-teal-600" />
            {deliveryNote.deliveryNoteNumber}
          </h1>
          <span
            className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full border ml-4 ${
              statusColors[deliveryNote.status]
            }`}
          >
            {statusLabels[deliveryNote.status]}
          </span>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => navigate(`/delivery-notes/${id}/edit`)}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
              isDarkMode
                ? "border-gray-600 bg-gray-800 text-white hover:bg-gray-700"
                : "border-gray-300 bg-white text-gray-800 hover:bg-gray-50"
            }`}
          >
            <Edit size={18} />
            Edit
          </button>
          <button type="button" onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-500 hover:to-teal-600 transition-all duration-300 shadow-sm hover:shadow-md"
          >
            <Download size={18} />
            Download PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="md:col-span-2">
          {/* Basic Information */}
          <div
            className={`p-6 mb-6 rounded-xl border ${
              isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-[#E0E0E0]"
            }`}
          >
            <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              Delivery Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Related Invoice</p>
                <p className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {deliveryNote.invoiceNumber}
                </p>
              </div>
              <div>
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Delivery Date</p>
                <p className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {formatDate(deliveryNote.deliveryDate)}
                </p>
              </div>
              <div>
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Vehicle Number</p>
                <p className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {deliveryNote.vehicleNumber || "Not specified"}
                </p>
              </div>
              <div>
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Driver</p>
                <p className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {deliveryNote.driverName || "Not specified"}
                </p>
                {deliveryNote.driverPhone && (
                  <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {deliveryNote.driverPhone}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div
            className={`p-6 mb-6 rounded-xl border ${
              isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-[#E0E0E0]"
            }`}
          >
            <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              Customer Details
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Customer Name</p>
                <p className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {deliveryNote.customerDetails?.name}
                </p>
                {deliveryNote.customerDetails?.company && (
                  <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {deliveryNote.customerDetails.company}
                  </p>
                )}
              </div>
              <div>
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Contact</p>
                <p className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {deliveryNote.customerDetails?.phone}
                </p>
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  {deliveryNote.customerDetails?.email}
                </p>
              </div>
              <div className="sm:col-span-2">
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Delivery Address</p>
                <p className={`font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {deliveryNote.deliveryAddress?.street || deliveryNote.customerDetails?.address?.street}
                  <br />
                  {deliveryNote.deliveryAddress?.city || deliveryNote.customerDetails?.address?.city}{" "}
                  {deliveryNote.deliveryAddress?.poBox || deliveryNote.customerDetails?.address?.poBox}
                </p>
              </div>
            </div>
          </div>

          {/* Items */}
          <div
            className={`p-6 mb-6 rounded-xl border ${
              isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-[#E0E0E0]"
            }`}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Items</h2>
              <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                Delivery Progress: {getTotalDeliveredPercentage()}%
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={isDarkMode ? "bg-[#2E3B4E]" : "bg-gray-50"}>
                  <tr>
                    <th
                      className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                    >
                      Item
                    </th>
                    <th
                      className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                    >
                      Specification
                    </th>
                    <th
                      className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                    >
                      Unit
                    </th>
                    <th
                      className={`px-4 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                    >
                      Ordered
                    </th>
                    <th
                      className={`px-4 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                    >
                      Delivered
                    </th>
                    <th
                      className={`px-4 py-3 text-right text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                    >
                      Remaining
                    </th>
                    <th
                      className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                    >
                      Status
                    </th>
                    <th
                      className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                    >
                      Stock Status
                    </th>
                    <th
                      className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}
                    >
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDarkMode ? "divide-gray-700" : "divide-gray-200"}`}>
                  {deliveryNote.items?.map((item, index) => (
                    <tr key={item.id || item.name || `item-${index}`}>
                      <td className="px-4 py-3">
                        <div className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                          {item.name}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                          {item.specification || "-"}
                        </div>
                      </td>
                      <td className={`px-4 py-3 text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                        {item.unit}
                      </td>
                      <td className={`px-4 py-3 text-right text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                        {item.orderedQuantity}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div
                          className={`text-sm font-medium ${
                            item.deliveredQuantity > 0
                              ? isDarkMode
                                ? "text-green-400"
                                : "text-green-600"
                              : isDarkMode
                                ? "text-white"
                                : "text-gray-900"
                          }`}
                        >
                          {item.deliveredQuantity}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div
                          className={`text-sm font-medium ${
                            item.remainingQuantity === 0
                              ? isDarkMode
                                ? "text-green-400"
                                : "text-green-600"
                              : isDarkMode
                                ? "text-yellow-400"
                                : "text-yellow-600"
                          }`}
                        >
                          {item.remainingQuantity}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            item.isFullyDelivered
                              ? isDarkMode
                                ? "bg-green-900/30 text-green-300"
                                : "bg-green-100 text-green-800"
                              : isDarkMode
                                ? "bg-yellow-900/30 text-yellow-300"
                                : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {item.isFullyDelivered ? "Complete" : "Partial"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {renderStockStatusBadge(item)}
                        {item.stockDeductedBy && (
                          <div className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                            by {item.stockDeductedBy}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {!item.isFullyDelivered &&
                          deliveryNote.status !== "completed" &&
                          deliveryNote.status !== "cancelled" && (
                            <button type="button" onClick={() =>
                                setPartialDialog({
                                  open: true,
                                  item,
                                  quantity: "",
                                })
                              }
                              className={`flex items-center gap-1 px-3 py-1 text-sm border rounded-lg transition-colors ${
                                isDarkMode
                                  ? "border-gray-600 bg-gray-800 text-white hover:bg-gray-700"
                                  : "border-gray-300 bg-white text-gray-800 hover:bg-gray-50"
                              }`}
                            >
                              <Plus size={14} />
                              Add Delivery
                            </button>
                          )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes */}
          {deliveryNote.notes && (
            <div
              className={`p-6 mb-6 rounded-xl border ${
                isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-[#E0E0E0]"
              }`}
            >
              <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>Notes</h2>
              <p className={`text-sm ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>{deliveryNote.notes}</p>
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="md:col-span-1">
          {/* Quick Actions */}
          <div
            className={`p-6 mb-6 rounded-xl border ${
              isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-[#E0E0E0]"
            }`}
          >
            <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              Quick Actions
            </h2>
            <div className="flex flex-col gap-3">
              {deliveryNote.status === "pending" && (
                <>
                  <button type="button" onClick={() => handleStatusUpdate("completed")}
                    className={`flex items-center justify-center gap-2 w-full px-4 py-3 border rounded-lg transition-colors ${
                      isDarkMode
                        ? "border-green-600 text-green-400 hover:bg-green-900/20"
                        : "border-green-300 text-green-700 hover:bg-green-50"
                    }`}
                  >
                    <CheckCircle size={18} />
                    Mark as Completed
                  </button>
                  <button type="button" onClick={() => handleStatusUpdate("cancelled")}
                    className={`flex items-center justify-center gap-2 w-full px-4 py-3 border rounded-lg transition-colors ${
                      isDarkMode
                        ? "border-red-600 text-red-400 hover:bg-red-900/20"
                        : "border-red-300 text-red-700 hover:bg-red-50"
                    }`}
                  >
                    <X size={18} />
                    Cancel Delivery
                  </button>
                </>
              )}

              {deliveryNote.status === "partial" && (
                <button type="button" onClick={() => handleStatusUpdate("completed")}
                  className={`flex items-center justify-center gap-2 w-full px-4 py-3 border rounded-lg transition-colors ${
                    isDarkMode
                      ? "border-green-600 text-green-400 hover:bg-green-900/20"
                      : "border-green-300 text-green-700 hover:bg-green-50"
                  }`}
                >
                  <CheckCircle size={18} />
                  Mark as Completed
                </button>
              )}
            </div>
          </div>

          {/* Delivery Summary */}
          <div
            className={`p-6 mb-6 rounded-xl border ${
              isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-[#E0E0E0]"
            }`}
          >
            <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              Delivery Summary
            </h2>
            <div className="flex flex-col gap-4">
              <div className="flex justify-between">
                <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Total Items</span>
                <span className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {deliveryNote.items?.length || 0}
                </span>
              </div>

              <div className="flex justify-between">
                <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Fully Delivered</span>
                <span className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {deliveryNote.items?.filter((item) => item.isFullyDelivered).length || 0}
                </span>
              </div>

              <div className="flex justify-between">
                <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Pending</span>
                <span className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {deliveryNote.items?.filter((item) => !item.isFullyDelivered).length || 0}
                </span>
              </div>

              <hr className={`my-2 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`} />

              <div className="flex justify-between items-center">
                <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Is Partial Delivery</span>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    deliveryNote.isPartial
                      ? isDarkMode
                        ? "bg-yellow-900/30 text-yellow-300"
                        : "bg-yellow-100 text-yellow-800"
                      : isDarkMode
                        ? "bg-green-900/30 text-green-300"
                        : "bg-green-100 text-green-800"
                  }`}
                >
                  {deliveryNote.isPartial ? "Yes" : "No"}
                </span>
              </div>
            </div>
          </div>

          {/* Stock Deduction Summary */}
          <div
            className={`p-6 mb-6 rounded-xl border ${
              isDarkMode ? "bg-[#1E2328] border-[#37474F]" : "bg-white border-[#E0E0E0]"
            }`}
          >
            <h2
              className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}
            >
              <Package size={20} className="text-teal-600" />
              Stock Status
            </h2>
            <div className="flex flex-col gap-4">
              <div className="flex justify-between">
                <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Stock Deducted</span>
                <span className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {deliveryNote.items?.filter((item) => item.stockDeducted).length || 0} /{" "}
                  {deliveryNote.items?.length || 0}
                </span>
              </div>

              <div className="flex justify-between">
                <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Pending Deduction</span>
                <span className={`text-sm font-medium ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                  {deliveryNote.items?.filter((item) => !item.stockDeducted && item.allocationStatus !== "failed")
                    .length || 0}
                </span>
              </div>

              <div className="flex justify-between">
                <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Failed Deductions</span>
                <span
                  className={`text-sm font-medium ${
                    deliveryNote.items?.filter((item) => item.allocationStatus === "failed").length > 0
                      ? isDarkMode
                        ? "text-red-400"
                        : "text-red-600"
                      : isDarkMode
                        ? "text-white"
                        : "text-gray-900"
                  }`}
                >
                  {deliveryNote.items?.filter((item) => item.allocationStatus === "failed").length || 0}
                </span>
              </div>

              {deliveryNote.items?.some((item) => item.stockDeducted && item.stockDeductedAt) && (
                <>
                  <hr className={`my-2 ${isDarkMode ? "border-gray-700" : "border-gray-200"}`} />
                  <div>
                    <span className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Last Deduction</span>
                    <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                      {formatDate(
                        deliveryNote.items
                          .filter((item) => item.stockDeductedAt)
                          .sort((a, b) => new Date(b.stockDeductedAt) - new Date(a.stockDeductedAt))[0]?.stockDeductedAt
                      )}
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Partial Delivery Dialog */}
      {partialDialog.open && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-xl max-w-md w-full ${isDarkMode ? "bg-[#1E2328]" : "bg-white"}`}>
            <div className={`p-6 border-b ${isDarkMode ? "border-[#37474F]" : "border-gray-200"}`}>
              <h2 className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                Add Partial Delivery
              </h2>
            </div>
            <div className="p-6">
              {partialDialog.item && (
                <div className="space-y-4">
                  <div>
                    <p className={`font-semibold mb-2 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                      {partialDialog.item.name}
                    </p>
                    <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      Remaining quantity: {partialDialog.item.remainingQuantity} {partialDialog.item.unit}
                    </p>
                  </div>
                  <div>
                    <label
                      htmlFor="quantity-to-deliver"
                      className={`block text-sm font-medium mb-2 ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
                    >
                      Quantity to Deliver
                    </label>
                    <input
                      id="quantity-to-deliver"
                      type="number"
                      value={partialDialog.quantity}
                      onChange={(e) =>
                        setPartialDialog((prev) => ({
                          ...prev,
                          quantity: e.target.value,
                        }))
                      }
                      min={0}
                      max={partialDialog.item.remainingQuantity}
                      step={0.01}
                      className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
                        isDarkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
                      }`}
                    />
                    <p className={`text-xs mt-1 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      Maximum: {partialDialog.item.remainingQuantity} {partialDialog.item.unit}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div
              className={`p-6 border-t flex gap-3 justify-end ${isDarkMode ? "border-[#37474F]" : "border-gray-200"}`}
            >
              <button type="button" onClick={() => setPartialDialog({ open: false, item: null, quantity: "" })}
                className={`px-4 py-2 rounded-lg transition-colors bg-transparent ${
                  isDarkMode ? "text-white hover:text-gray-300" : "hover:bg-gray-100 text-gray-800"
                }`}
              >
                Cancel
              </button>
              <button type="button" onClick={handlePartialDelivery}
                className="px-4 py-2 bg-gradient-to-br from-teal-600 to-teal-700 text-white rounded-lg hover:from-teal-500 hover:to-teal-600 transition-all duration-300"
              >
                Update Delivery
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success/Error Notifications */}
      {error && (
        <div className="fixed top-4 right-4 z-50">
          <div
            className={`p-4 rounded-lg border shadow-lg ${
              isDarkMode ? "bg-red-900/20 border-red-700 text-red-300" : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            <div className="flex items-center gap-2">
              <AlertCircle size={20} />
              <span>{error}</span>
              <button type="button" onClick={() => setError("")} className="ml-2">
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="fixed top-4 right-4 z-50">
          <div
            className={`p-4 rounded-lg border shadow-lg ${
              isDarkMode
                ? "bg-green-900/20 border-green-700 text-green-300"
                : "bg-green-50 border-green-200 text-green-800"
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle size={20} />
              <span>{success}</span>
              <button type="button" onClick={() => setSuccess("")} className="ml-2">
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryNoteDetails;
