import { ArrowLeft, FileText, Loader2, Plus, Save } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import LineItemCard from "../components/shared/LineItemCard";
import LineItemEmptyState from "../components/shared/LineItemEmptyState";
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
  // Supplier matching state: null = not needed, "matched" = auto-matched, "ambiguous" = needs user decision
  const [supplierMatch, setSupplierMatch] = useState(null); // { status, suggestion: {id, name, score} }

  // Fuzzy match extracted supplier name against master list
  const matchSupplier = useCallback((extractedName, supplierList) => {
    if (!extractedName || supplierList.length === 0) return null;

    const normalize = (s) =>
      s
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(
          /\b(co|ltd|llc|fze|fzc|inc|corp|trading|stainless|steel|international|industries|group|middle east|me)\b/g,
          ""
        )
        .replace(/\s+/g, " ")
        .trim();

    const wordOverlap = (a, b) => {
      const wa = new Set(normalize(a).split(" ").filter(Boolean));
      const wb = new Set(normalize(b).split(" ").filter(Boolean));
      const common = [...wa].filter((w) => wb.has(w)).length;
      return common / Math.max(wa.size, wb.size, 1);
    };

    const normExtracted = normalize(extractedName);
    let best = null;

    for (const s of supplierList) {
      const normName = normalize(s.name);
      // Exact normalized match
      if (normExtracted === normName) {
        return { status: "matched", suggestion: { id: s.id, name: s.name, score: 100 } };
      }
      // Substring containment
      const containScore = normExtracted.includes(normName) || normName.includes(normExtracted) ? 80 : 0;
      const overlapScore = Math.round(wordOverlap(extractedName, s.name) * 100);
      const score = Math.max(containScore, overlapScore);
      if (!best || score > best.score) best = { id: s.id, name: s.name, score };
    }

    if (!best) return null;
    if (best.score >= 70) return { status: "matched", suggestion: best };
    if (best.score >= 40) return { status: "ambiguous", suggestion: best };
    return { status: "no_match", suggestion: null };
  }, []);

  const [formData, setFormData] = useState({
    supplierId: "",
    supplierName: "",
    supplierReference: "",
    customerReference: "",
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

  // Load suppliers then trigger match if we already have an extracted name
  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        const response = await suppliersAPI.getAll();
        const list = response?.suppliers || [];
        setSuppliers(list);
        // If quotation already loaded with an unlinked extracted name, run match now
        setFormData((prev) => {
          if (!prev.supplierId && prev.supplierName) {
            const result = matchSupplier(prev.supplierName, list);
            if (result?.status === "matched") {
              setSupplierMatch(result);
              return { ...prev, supplierId: result.suggestion.id };
            }
            setSupplierMatch(result);
          }
          return prev;
        });
      } catch (err) {
        console.error("Failed to load suppliers:", err);
      }
    };
    loadSuppliers();
  }, [matchSupplier]);

  const loadQuotation = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getSupplierQuotation(id);
      setFormData({
        supplierId: data.supplierId || "",
        supplierName: data.supplierName || "",
        supplierReference: data.supplierReference || "",
        customerReference: data.customerReference || "",
        quoteDate: data.quoteDate?.split("T")[0] || "",
        validityDate: data.validityDate?.split("T")[0] || "",
        receivedDate: data.receivedDate?.split("T")[0] || "",
        deliveryTerms: data.deliveryTerms || "",
        paymentTerms: data.paymentTerms || "",
        incoterms: data.incoterms || "",
        notes: data.notes || "",
        currency: data.currency || "AED",
        exchangeRate: (() => {
          const saved = data.exchangeRate || 1;
          const currency = data.currency || "AED";
          // If rate was never set (still 1) and currency has a known pegged rate, use it
          if (saved === 1 && currency !== "AED" && { USD: 3.6725 }[currency]) {
            return { USD: 3.6725 }[currency];
          }
          return saved;
        })(),
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

  // Pegged rates (fixed, not dynamic)
  const PEGGED_RATES = { USD: 3.6725 };

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      // Auto-fill exchange rate when currency changes
      if (field === "currency") {
        if (value === "AED") {
          next.exchangeRate = 1;
        } else if (
          PEGGED_RATES[value] &&
          (prev.exchangeRate === 1 || prev.exchangeRate === PEGGED_RATES[prev.currency])
        ) {
          next.exchangeRate = PEGGED_RATES[value];
        }
      }
      return next;
    });
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
          extractionConfidence: 0,
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

  const fmtAED = (amount) =>
    new Intl.NumberFormat("en-AE", { style: "currency", currency: "AED", minimumFractionDigits: 2 }).format(
      (amount || 0) * (parseFloat(formData.exchangeRate) || 1)
    );

  const showAED = formData.currency !== "AED" && (parseFloat(formData.exchangeRate) || 1) !== 1;

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
              <Label>Supplier</Label>
              <select
                value={formData.supplierId}
                onChange={(e) => {
                  handleChange("supplierId", e.target.value);
                  setSupplierMatch(null);
                }}
                className={`w-full px-3 py-2 border rounded-md ${isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : ""}`}
              >
                <option value="">— Unlinked supplier —</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              {/* Auto-matched */}
              {supplierMatch?.status === "matched" && formData.supplierId && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ Auto-matched to <span className="font-medium">{supplierMatch.suggestion.name}</span> (
                  {supplierMatch.suggestion.score}% confidence) —{" "}
                  <button
                    type="button"
                    className="underline"
                    onClick={() => {
                      handleChange("supplierId", "");
                      setSupplierMatch({ ...supplierMatch, status: "dismissed" });
                    }}
                  >
                    unlink
                  </button>
                </p>
              )}

              {/* Ambiguous — needs user decision */}
              {supplierMatch?.status === "ambiguous" && !formData.supplierId && (
                <div className="mt-2 p-2 border border-amber-300 rounded bg-amber-50 text-xs text-amber-800">
                  <p>
                    Extracted: <span className="font-medium">{formData.supplierName}</span>
                  </p>
                  <p className="mt-1">
                    Possible match: <span className="font-medium">{supplierMatch.suggestion.name}</span> (
                    {supplierMatch.suggestion.score}% confidence)
                  </p>
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      className="px-2 py-1 bg-amber-600 text-white rounded text-xs"
                      onClick={() => {
                        handleChange("supplierId", supplierMatch.suggestion.id);
                        setSupplierMatch({ ...supplierMatch, status: "matched" });
                      }}
                    >
                      Yes, use this supplier
                    </button>
                    <button
                      type="button"
                      className="px-2 py-1 border border-amber-600 text-amber-700 rounded text-xs"
                      onClick={() => setSupplierMatch({ ...supplierMatch, status: "dismissed" })}
                    >
                      No, keep extracted name
                    </button>
                  </div>
                </div>
              )}

              {/* Dismissed or no match — show extracted name */}
              {(supplierMatch?.status === "dismissed" || supplierMatch?.status === "no_match") &&
                !formData.supplierId &&
                formData.supplierName && (
                  <p className="text-xs text-amber-600 mt-1">
                    Extracted: <span className="font-medium">{formData.supplierName}</span> — not linked to a supplier
                    record
                  </p>
                )}

              {/* No match at all */}
              {!supplierMatch && !formData.supplierId && formData.supplierName && (
                <p className="text-xs text-amber-600 mt-1">
                  Extracted: <span className="font-medium">{formData.supplierName}</span> — not linked to a supplier
                  record
                </p>
              )}
            </div>
            <div>
              <Label>Supplier Reference</Label>
              <Input
                value={formData.supplierReference}
                onChange={(e) => handleChange("supplierReference", e.target.value)}
                placeholder="Supplier's PI/quote number"
              />
            </div>
            <div>
              <Label>Our PO Reference</Label>
              <Input
                value={formData.customerReference}
                onChange={(e) => handleChange("customerReference", e.target.value)}
                placeholder="Our PO number (if on their doc)"
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
                <option value="CNY">CNY</option>
                <option value="INR">INR</option>
              </select>
            </div>
            {formData.currency !== "AED" && (
              <div>
                <Label>
                  Exchange Rate to AED{" "}
                  {PEGGED_RATES[formData.currency] && (
                    <span className="text-xs font-normal text-blue-500">(pegged — auto-filled)</span>
                  )}
                </Label>
                <Input
                  type="number"
                  min="0.0001"
                  step="0.0001"
                  value={formData.exchangeRate}
                  onChange={(e) => handleChange("exchangeRate", parseFloat(e.target.value) || 1)}
                  placeholder={`1 ${formData.currency} = ? AED`}
                />
                {formData.exchangeRate > 1 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Total ≈ AED{" "}
                    {new Intl.NumberFormat("en-AE", { minimumFractionDigits: 0 }).format(
                      (parseFloat(formData.exchangeRate) || 1) *
                        ((formData.total || 0) > 0
                          ? formData.total
                          : formData.items?.reduce((s, i) => s + (i.quantity || 0) * (i.unitPrice || 0), 0) || 0)
                    )}
                  </p>
                )}
              </div>
            )}
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
            <LineItemEmptyState
              title="No items added yet"
              description="Click the button below to start adding line items."
              buttonText="Add First Item"
              onAdd={addItem}
            />
          ) : (
            <div className="space-y-3">
              {formData.items.map((item, index) => (
                <LineItemCard
                  key={item.id || index}
                  index={index}
                  onDelete={() => removeItem(index)}
                  amountDisplay={formatCurrency(item.amount)}
                  amountBreakdown={
                    (parseFloat(item.quantity) || 0) > 0 && (parseFloat(item.unitPrice) || 0) > 0
                      ? `${item.quantity} ${item.unit || "KG"} × ${parseFloat(item.unitPrice).toFixed(2)}${showAED && (parseFloat(item.amount) || 0) > 0 ? ` · ${fmtAED(item.amount)}` : ""}`
                      : showAED && (parseFloat(item.amount) || 0) > 0
                        ? fmtAED(item.amount)
                        : null
                  }
                  row1Content={
                    <div className="grid grid-cols-1 sm:grid-cols-[1fr_100px_90px] gap-2 items-end">
                      <div>
                        <span className="text-[10.5px] font-semibold uppercase tracking-[0.05em] block mb-1 text-gray-400">
                          Description
                        </span>
                        <Input
                          value={item.description}
                          onChange={(e) => handleItemChange(index, "description", e.target.value)}
                          placeholder="Product description"
                          required
                        />
                      </div>
                      <div>
                        <span className="text-[10.5px] font-semibold uppercase tracking-[0.05em] block mb-1 text-gray-400">
                          Quantity
                        </span>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, "quantity", parseFloat(e.target.value) || 0)}
                          required
                        />
                      </div>
                      <div>
                        <span className="text-[10.5px] font-semibold uppercase tracking-[0.05em] block mb-1 text-gray-400">
                          Unit
                        </span>
                        <select
                          value={item.unit}
                          onChange={(e) => handleItemChange(index, "unit", e.target.value)}
                          className={`w-full px-3 py-2 text-sm border rounded-md ${isDarkMode ? "bg-gray-700 border-gray-600 text-gray-100" : "bg-white border-gray-300"}`}
                        >
                          <option value="KG">KG</option>
                          <option value="MT">MT</option>
                          <option value="PCS">PCS</option>
                          <option value="PC">PC</option>
                          <option value="METER">METER</option>
                          <option value="LOT">LOT</option>
                        </select>
                      </div>
                    </div>
                  }
                  row3Content={
                    <div>
                      <span className="text-[10.5px] font-semibold uppercase tracking-[0.05em] block mb-1 text-gray-400">
                        Specifications
                      </span>
                      <Input
                        value={item.specifications}
                        onChange={(e) => handleItemChange(index, "specifications", e.target.value)}
                        placeholder="Additional specs, remarks, part number..."
                      />
                    </div>
                  }
                  row2Content={
                    <>
                      <div className="w-[100px]">
                        <span className="text-[10.5px] font-semibold uppercase tracking-[0.05em] block mb-1 text-gray-400">
                          Grade
                        </span>
                        <Input
                          value={item.grade}
                          onChange={(e) => handleItemChange(index, "grade", e.target.value)}
                          placeholder="304, 316L"
                        />
                      </div>
                      <div className="w-[90px]">
                        <span className="text-[10.5px] font-semibold uppercase tracking-[0.05em] block mb-1 text-gray-400">
                          Finish
                        </span>
                        <Input
                          value={item.finish}
                          onChange={(e) => handleItemChange(index, "finish", e.target.value)}
                          placeholder="2B, BA"
                        />
                      </div>
                      <div className="w-[80px]">
                        <span className="text-[10.5px] font-semibold uppercase tracking-[0.05em] block mb-1 text-gray-400">
                          Thickness
                        </span>
                        <Input
                          value={item.thickness}
                          onChange={(e) => handleItemChange(index, "thickness", e.target.value)}
                          placeholder="1.5"
                        />
                      </div>
                      <div className="w-[80px]">
                        <span className="text-[10.5px] font-semibold uppercase tracking-[0.05em] block mb-1 text-gray-400">
                          Width
                        </span>
                        <Input
                          value={item.width}
                          onChange={(e) => handleItemChange(index, "width", e.target.value)}
                          placeholder="1219"
                        />
                      </div>
                      <div className="w-[80px]">
                        <span className="text-[10.5px] font-semibold uppercase tracking-[0.05em] block mb-1 text-gray-400">
                          Length
                        </span>
                        <Input
                          value={item.length}
                          onChange={(e) => handleItemChange(index, "length", e.target.value)}
                          placeholder="2438"
                        />
                      </div>
                      <div className="w-[120px]">
                        <span className="text-[10.5px] font-semibold uppercase tracking-[0.05em] block mb-1 text-gray-400">
                          Origin
                        </span>
                        <Input
                          value={item.originCountry}
                          onChange={(e) => handleItemChange(index, "originCountry", e.target.value)}
                          placeholder="China, Taiwan"
                        />
                      </div>
                      <div className="w-[110px]">
                        <span className="text-[10.5px] font-semibold uppercase tracking-[0.05em] block mb-1 text-gray-400">
                          Unit Price
                        </span>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(index, "unitPrice", parseFloat(e.target.value) || 0)}
                          required
                        />
                      </div>
                    </>
                  }
                />
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
              {showAED && totals.total > 0 && (
                <div className="flex justify-between text-sm pt-2 border-t border-dashed">
                  <span className="text-blue-500 font-medium">Total in AED</span>
                  <span className="text-blue-500 font-bold">{fmtAED(totals.total)}</span>
                </div>
              )}
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
