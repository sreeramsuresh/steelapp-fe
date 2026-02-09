import { format } from "date-fns";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle,
  DollarSign,
  Edit,
  ExternalLink,
  FileText,
  Loader2,
  ShoppingCart,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTheme } from "../contexts/ThemeContext";
import ConfirmDialog from "../components/ConfirmDialog";
import {
  approveSupplierQuotation,
  convertToPurchaseOrder,
  getConfidenceColor,
  getStatusColor,
  getStatusText,
  getSupplierQuotation,
  rejectSupplierQuotation,
} from "../services/supplierQuotationService";

/**
 * Supplier Quotation Detail Page
 * Shows quotation details with approval/rejection/conversion actions
 */
export function SupplierQuotationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();

  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  // Dialog states
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [convertNotes, setConvertNotes] = useState("");
  const [approveConfirm, setApproveConfirm] = useState({
    open: false,
  });

  const loadQuotation = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSupplierQuotation(id);
      setQuotation(data);
    } catch (err) {
      console.error("Failed to load quotation:", err);
      setError(err.message || "Failed to load quotation");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadQuotation();
  }, [loadQuotation]);

  const handleApprove = async () => {
    setApproveConfirm({ open: true });
  };

  const confirmApprove = async () => {
    try {
      setProcessing(true);
      await approveSupplierQuotation(id);
      toast.success("Quotation approved");
      loadQuotation();
    } catch (_err) {
      toast.error("Failed to approve quotation");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }

    try {
      setProcessing(true);
      await rejectSupplierQuotation(id, rejectReason);
      toast.success("Quotation rejected");
      setShowRejectDialog(false);
      setRejectReason("");
      loadQuotation();
    } catch (_err) {
      toast.error("Failed to reject quotation");
    } finally {
      setProcessing(false);
    }
  };

  const handleConvert = async () => {
    try {
      setProcessing(true);
      const result = await convertToPurchaseOrder(id, { notes: convertNotes });
      toast.success("Purchase order created");
      setShowConvertDialog(false);
      if (result.purchaseOrder?.id) {
        navigate(`/purchase-orders/${result.purchaseOrder.id}`);
      } else {
        loadQuotation();
      }
    } catch (_err) {
      toast.error("Failed to convert to purchase order");
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      return format(new Date(dateStr), "dd MMM yyyy");
    } catch {
      return dateStr;
    }
  };

  const formatCurrency = (amount, currency = "AED") => {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-red-500">{error}</p>
          <Button onClick={loadQuotation} className="mt-4">
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!quotation) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p>Quotation not found</p>
        </CardContent>
      </Card>
    );
  }

  const canEdit = quotation.status === "draft";
  const canApprove = quotation.status === "draft" || quotation.status === "pending_review";
  const canReject = quotation.status === "draft" || quotation.status === "pending_review";
  const canConvert = quotation.status === "approved";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/app/supplier-quotations")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {quotation.internalReference}
            </h1>
            <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              {quotation.supplierReference && <>Supplier Ref: {quotation.supplierReference}</>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={`bg-${getStatusColor(quotation.status)}-100 text-${getStatusColor(quotation.status)}-800`}>
            {getStatusText(quotation.status)}
          </Badge>
          {canEdit && (
            <Button variant="outline" onClick={() => navigate(`/app/supplier-quotations/${id}/edit`)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          {canApprove && (
            <Button onClick={handleApprove} disabled={processing} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>
          )}
          {canReject && (
            <Button variant="destructive" onClick={() => setShowRejectDialog(true)} disabled={processing}>
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
          )}
          {canConvert && (
            <Button
              onClick={() => setShowConvertDialog(true)}
              disabled={processing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Convert to PO
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-8 w-8 text-blue-600" />
              <div>
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Supplier</p>
                <p className="font-medium">{quotation.supplierName || "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-green-600" />
              <div>
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Quote Date</p>
                <p className="font-medium">{formatDate(quotation.quoteDate)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-orange-600" />
              <div>
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Valid Until</p>
                <p className="font-medium">{formatDate(quotation.validityDate)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <DollarSign className="h-8 w-8 text-purple-600" />
              <div>
                <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Total Amount</p>
                <p className="font-medium text-lg">{formatCurrency(quotation.total, quotation.currency)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Extraction Info */}
      {quotation.extractionConfidence > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Extraction Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full bg-${getConfidenceColor(quotation.extractionConfidence)}-500`} />
                <span>Confidence: {Math.round(quotation.extractionConfidence)}%</span>
              </div>
              <span>Method: {quotation.extractionMethod?.replace("_", " ")}</span>
              <span>PDF Type: {quotation.pdfType}</span>
              {quotation.pdfFilePath && (
                <a
                  href={`/uploads${quotation.pdfFilePath.split("uploads")[1]}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-blue-600 hover:underline"
                >
                  View PDF
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            {quotation.extractionWarnings?.length > 0 && (
              <div className={`mt-3 p-3 rounded-lg ${isDarkMode ? "bg-yellow-900/30" : "bg-yellow-50"}`}>
                <p className={`text-sm font-medium flex items-center gap-1 ${isDarkMode ? "text-yellow-300" : "text-yellow-800"}`}>
                  <AlertTriangle className="h-4 w-4" />
                  Extraction Warnings
                </p>
                <ul className={`mt-1 text-sm list-disc list-inside ${isDarkMode ? "text-yellow-400" : "text-yellow-700"}`}>
                  {quotation.extractionWarnings.map((w, _i) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Terms & Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Terms</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className={isDarkMode ? "text-gray-400" : "text-gray-500"}>Delivery Terms</span>
              <span>{quotation.deliveryTerms || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className={isDarkMode ? "text-gray-400" : "text-gray-500"}>Payment Terms</span>
              <span>{quotation.paymentTerms || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className={isDarkMode ? "text-gray-400" : "text-gray-500"}>Incoterms</span>
              <span>{quotation.incoterms || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className={isDarkMode ? "text-gray-400" : "text-gray-500"}>Currency</span>
              <span>{quotation.currency}</span>
            </div>
          </CardContent>
        </Card>
        {quotation.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{quotation.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Line Items ({quotation.items?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className={isDarkMode ? "bg-gray-700" : "bg-gray-50"}>
                <tr>
                  <th className="px-4 py-3 text-left">#</th>
                  <th className="px-4 py-3 text-left">Description</th>
                  <th className="px-4 py-3 text-left">Grade/Specs</th>
                  <th className="px-4 py-3 text-right">Quantity</th>
                  <th className="px-4 py-3 text-right">Unit Price</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {(quotation.items || []).map((item, idx) => (
                  <tr key={item.id || idx} className="border-t">
                    <td className={`px-4 py-3 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{item.lineNumber}</td>
                    <td className="px-4 py-3">
                      <div>
                        <p>{item.description || "-"}</p>
                        {item.dimensions && <p className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{item.dimensions}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {item.grade && <span className="font-medium">{item.grade}</span>}
                      {item.finish && <span className={`ml-2 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>{item.finish}</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {item.quantity} {item.unit}
                    </td>
                    <td className="px-4 py-3 text-right">{formatCurrency(item.unitPrice, quotation.currency)}</td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatCurrency(item.amount, quotation.currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="mt-4 flex justify-end">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className={isDarkMode ? "text-gray-400" : "text-gray-500"}>Subtotal</span>
                <span>{formatCurrency(quotation.subtotal, quotation.currency)}</span>
              </div>
              {quotation.discountAmount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(quotation.discountAmount, quotation.currency)}</span>
                </div>
              )}
              {quotation.shippingCharges > 0 && (
                <div className="flex justify-between">
                  <span className={isDarkMode ? "text-gray-400" : "text-gray-500"}>Shipping</span>
                  <span>{formatCurrency(quotation.shippingCharges, quotation.currency)}</span>
                </div>
              )}
              {quotation.freightCharges > 0 && (
                <div className="flex justify-between">
                  <span className={isDarkMode ? "text-gray-400" : "text-gray-500"}>Freight</span>
                  <span>{formatCurrency(quotation.freightCharges, quotation.currency)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className={isDarkMode ? "text-gray-400" : "text-gray-500"}>VAT</span>
                <span>{formatCurrency(quotation.vatAmount, quotation.currency)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total</span>
                <span>{formatCurrency(quotation.total, quotation.currency)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Quotation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Rejection Reason *</Label>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Please provide a reason for rejection..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={processing || !rejectReason.trim()}>
              {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Convert Dialog */}
      <Dialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convert to Purchase Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
              This will create a new Purchase Order based on this quotation. The quotation will be marked as converted.
            </p>
            <div>
              <Label>Notes (Optional)</Label>
              <Textarea
                value={convertNotes}
                onChange={(e) => setConvertNotes(e.target.value)}
                placeholder="Add any notes for the purchase order..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConvertDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleConvert} disabled={processing}>
              {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create Purchase Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Confirmation Dialog */}
      {approveConfirm.open && (
        <ConfirmDialog
          title="Approve Quotation?"
          message="Are you sure you want to approve this quotation?"
          variant="warning"
          onConfirm={() => {
            confirmApprove();
            setApproveConfirm({ open: false });
          }}
          onCancel={() => setApproveConfirm({ open: false })}
        />
      )}
    </div>
  );
}

export default SupplierQuotationDetail;
