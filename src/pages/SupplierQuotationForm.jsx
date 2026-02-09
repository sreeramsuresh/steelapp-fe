import { ArrowLeft, FileText, Loader2, Plus, Save, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTheme } from "../contexts/ThemeContext";
import { suppliersAPI } from "../services/api";
import {
  createSupplierQuotation,
  getSupplierQuotation,
  updateSupplierQuotation,
} from "../services/supplierQuotationService";

/**
 * Supplier Quotation Form Page
 * Create or edit supplier quotations manually
 */
export function SupplierQuotationForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [suppliers, setSuppliers] = useState([]);

  const [formData, setFormData] = useState({
    supplierId: "",
    supplierReference: "",
    quoteDate: "",
    validityDate: "",
    receivedDate: new Date().toISOString().split("T")[0],
    deliveryTerms: "",
    paymentTerms: "",
    incoterms: "",
    notes: "",
    currency: "AED",
    exchangeRate: 1,
    discountType: "",
    discountPercentage: 0,
    discountAmount: 0,
    shippingCharges: 0,
    freightCharges: 0,
    otherCharges: 0,
    items: [],
  });

  // Load suppliers
  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        const response = await suppliersAPI.getAll();
        setSuppliers(response?.suppliers || []);
      } catch (err) {
        console.error("Failed to load suppliers:", err);
      }
    };
    loadSuppliers();
  }, []);

  const loadQuotation = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getSupplierQuotation(id);
      setFormData({
        supplierId: data.supplierId || "",
        supplierReference: data.supplierReference || "",
        quoteDate: data.quoteDate?.split("T")[0] || "",
        validityDate: data.validityDate?.split("T")[0] || "",
        receivedDate: data.receivedDate?.split("T")[0] || "",
        deliveryTerms: data.deliveryTerms || "",
        paymentTerms: data.paymentTerms || "",
        incoterms: data.incoterms || "",
        notes: data.notes || "",
        currency: data.currency || "AED",
        exchangeRate: data.exchangeRate || 1,
        discountType: data.discountType || "",
        discountPercentage: data.discountPercentage || 0,
        discountAmount: data.discountAmount || 0,
        shippingCharges: data.shippingCharges || 0,
        freightCharges: data.freightCharges || 0,
        otherCharges: data.otherCharges || 0,
        items: data.items || [],
      });
    } catch (err) {
      console.error("Failed to load quotation:", err);
      toast.error("Failed to load quotation");
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Load quotation if editing
  useEffect(() => {
    if (isEdit) {
      loadQuotation();
    }
  }, [isEdit, loadQuotation]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index, field, value) => {
    setFormData((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], [field]: value };

      // Auto-calculate amount
      if (field === "quantity" || field === "unitPrice") {
        const qty = parseFloat(items[index].quantity) || 0;
        const price = parseFloat(items[index].unitPrice) || 0;
        items[index].amount = qty * price;
      }

      return { ...prev, items };
    });
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          description: "",
          specifications: "",
          grade: "",
          finish: "",
          thickness: "",
          width: "",
          length: "",
          size: "",
          dimensions: "",
          originCountry: "",
          quantity: 0,
          unit: "KG",
          unitPrice: 0,
          amount: 0,
          vatRate: 5,
        },
      ],
    }));
  };

  const removeItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
    const discount = parseFloat(formData.discountAmount) || 0;
    const shipping = parseFloat(formData.shippingCharges) || 0;
    const freight = parseFloat(formData.freightCharges) || 0;
    const other = parseFloat(formData.otherCharges) || 0;
    const taxable = subtotal - discount + shipping + freight + other;
    const vat = taxable * 0.05;
    const total = taxable + vat;
    return { subtotal, discount, shipping, freight, other, vat, total };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.supplierId) {
      toast.error("Please select a supplier");
      return;
    }

    if (formData.items.length === 0) {
      toast.error("Please add at least one line item");
      return;
    }

    try {
      setSaving(true);

      if (isEdit) {
        await updateSupplierQuotation(id, formData);
        toast.success("Quotation updated");
      } else {
        const result = await createSupplierQuotation(formData);
        toast.success("Quotation created");
        navigate(`/app/supplier-quotations/${result.id}`);
        return;
      }

      navigate(`/app/supplier-quotations/${id}`);
    } catch (err) {
      console.error("Failed to save quotation:", err);
      toast.error("Failed to save quotation");
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: formData.currency || "AED",
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  const totals = calculateTotals();

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button type="button" variant="ghost" size="sm" onClick={() => navigate("/app/supplier-quotations")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {isEdit ? "Edit Quotation" : "New Supplier Quotation"}
          </h1>
        </div>
        <Button type="submit" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save
        </Button>
      </div>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quotation Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Supplier *</Label>
              <select
                value={formData.supplierId}
                onChange={(e) => handleChange("supplierId", e.target.value)}
                className={`w-full px-3 py-2 border rounded-md ${isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : ""}`}
                required
              >
                <option value="">Select Supplier</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Supplier Reference</Label>
              <Input
                value={formData.supplierReference}
                onChange={(e) => handleChange("supplierReference", e.target.value)}
                placeholder="Supplier's quote number"
              />
            </div>
            <div>
              <Label>Currency</Label>
              <select
                value={formData.currency}
                onChange={(e) => handleChange("currency", e.target.value)}
                className={`w-full px-3 py-2 border rounded-md ${isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : ""}`}
              >
                <option value="AED">AED</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
            <div>
              <Label>Quote Date</Label>
              <Input
                type="date"
                value={formData.quoteDate}
                onChange={(e) => handleChange("quoteDate", e.target.value)}
              />
            </div>
            <div>
              <Label>Validity Date</Label>
              <Input
                type="date"
                value={formData.validityDate}
                onChange={(e) => handleChange("validityDate", e.target.value)}
              />
            </div>
            <div>
              <Label>Received Date</Label>
              <Input
                type="date"
                value={formData.receivedDate}
                onChange={(e) => handleChange("receivedDate", e.target.value)}
              />
            </div>
            <div>
              <Label>Delivery Terms</Label>
              <Input
                value={formData.deliveryTerms}
                onChange={(e) => handleChange("deliveryTerms", e.target.value)}
                placeholder="e.g., 2 weeks"
              />
            </div>
            <div>
              <Label>Payment Terms</Label>
              <Input
                value={formData.paymentTerms}
                onChange={(e) => handleChange("paymentTerms", e.target.value)}
                placeholder="e.g., Net 30"
              />
            </div>
            <div>
              <Label>Incoterms</Label>
              <select
                value={formData.incoterms}
                onChange={(e) => handleChange("incoterms", e.target.value)}
                className={`w-full px-3 py-2 border rounded-md ${isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : ""}`}
              >
                <option value="">Select</option>
                <option value="EXW">EXW - Ex Works</option>
                <option value="FOB">FOB - Free on Board</option>
                <option value="CIF">CIF - Cost Insurance Freight</option>
                <option value="DDP">DDP - Delivered Duty Paid</option>
                <option value="CFR">CFR - Cost and Freight</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Line Items ({formData.items.length})</CardTitle>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="h-4 w-4 mr-2" />
            Add Item
          </Button>
        </CardHeader>
        <CardContent>
          {formData.items.length === 0 ? (
            <div className={`text-center py-8 ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
              No items added yet. Click &quot;Add Item&quot; to start.
            </div>
          ) : (
            <div className="space-y-4">
              {formData.items.map((item, index) => (
                <div
                  key={item.id || index}
                  className={`border rounded-lg p-4 space-y-3 ${isDarkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50"}`}
                >
                  <div className="flex justify-between items-start">
                    <span className={`text-sm font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                      Item #{index + 1}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div className="md:col-span-2">
                      <Label>Description *</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => handleItemChange(index, "description", e.target.value)}
                        placeholder="Product description"
                        required
                      />
                    </div>
                    <div>
                      <Label>Grade</Label>
                      <Input
                        value={item.grade}
                        onChange={(e) => handleItemChange(index, "grade", e.target.value)}
                        placeholder="e.g., 304, 316L"
                      />
                    </div>
                    <div>
                      <Label>Finish</Label>
                      <Input
                        value={item.finish}
                        onChange={(e) => handleItemChange(index, "finish", e.target.value)}
                        placeholder="e.g., 2B, BA"
                      />
                    </div>
                    <div>
                      <Label>Dimensions</Label>
                      <Input
                        value={item.dimensions}
                        onChange={(e) => handleItemChange(index, "dimensions", e.target.value)}
                        placeholder="e.g., 1.0mm x 1219mm x 2438mm"
                      />
                    </div>
                    <div>
                      <Label>Quantity *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, "quantity", parseFloat(e.target.value) || 0)}
                        required
                      />
                    </div>
                    <div>
                      <Label>Unit</Label>
                      <select
                        value={item.unit}
                        onChange={(e) => handleItemChange(index, "unit", e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md ${isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : ""}`}
                      >
                        <option value="KG">KG</option>
                        <option value="MT">MT</option>
                        <option value="PCS">PCS</option>
                        <option value="METER">METER</option>
                        <option value="LOT">LOT</option>
                      </select>
                    </div>
                    <div>
                      <Label>Unit Price *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(index, "unitPrice", parseFloat(e.target.value) || 0)}
                        required
                      />
                    </div>
                    <div>
                      <Label>Amount</Label>
                      <Input
                        value={formatCurrency(item.amount)}
                        disabled
                        className={isDarkMode ? "bg-gray-600" : "bg-gray-100"}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charges & Totals */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Charges & Total</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <Label>Discount Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.discountAmount}
                  onChange={(e) => handleChange("discountAmount", parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label>Shipping Charges</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.shippingCharges}
                  onChange={(e) => handleChange("shippingCharges", parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label>Freight Charges</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.freightCharges}
                  onChange={(e) => handleChange("freightCharges", parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label>Other Charges</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.otherCharges}
                  onChange={(e) => handleChange("otherCharges", parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className={`rounded-lg p-4 space-y-2 ${isDarkMode ? "bg-gray-700" : "bg-gray-50"}`}>
              <div className="flex justify-between text-sm">
                <span className={isDarkMode ? "text-gray-400" : "text-gray-500"}>Subtotal</span>
                <span>{formatCurrency(totals.subtotal)}</span>
              </div>
              {totals.discount > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(totals.discount)}</span>
                </div>
              )}
              {totals.shipping > 0 && (
                <div className="flex justify-between text-sm">
                  <span className={isDarkMode ? "text-gray-400" : "text-gray-500"}>Shipping</span>
                  <span>{formatCurrency(totals.shipping)}</span>
                </div>
              )}
              {totals.freight > 0 && (
                <div className="flex justify-between text-sm">
                  <span className={isDarkMode ? "text-gray-400" : "text-gray-500"}>Freight</span>
                  <span>{formatCurrency(totals.freight)}</span>
                </div>
              )}
              {totals.other > 0 && (
                <div className="flex justify-between text-sm">
                  <span className={isDarkMode ? "text-gray-400" : "text-gray-500"}>Other</span>
                  <span>{formatCurrency(totals.other)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className={isDarkMode ? "text-gray-400" : "text-gray-500"}>VAT (5%)</span>
                <span>{formatCurrency(totals.vat)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total</span>
                <span>{formatCurrency(totals.total)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => navigate("/app/supplier-quotations")}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          {isEdit ? "Update Quotation" : "Create Quotation"}
        </Button>
      </div>
    </form>
  );
}

export default SupplierQuotationForm;
