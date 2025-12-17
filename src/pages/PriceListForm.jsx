import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  TrendingUp,
  TrendingDown,
  Search,
  Package,
  CheckCircle,
  Star,
  Tag,
  Percent,
  X,
  Boxes,
  ExternalLink,
  Layers,
  Globe,
  Factory,
  MapPin,
  RotateCcw,
  Copy,
  History,
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import pricelistService from "../services/pricelistService";
import { productService } from "../services/dataService";
import { notificationService } from "../services/notificationService";
import PriceHistoryTab from "../components/pricelist/PriceHistoryTab";
import { FormSelect } from "../components/ui/form-select";
import { SelectItem } from "../components/ui/select";

// ==================== DESIGN TOKENS ====================
const COLORS = {
  bg: "#0b0f14",
  card: "#141a20",
  border: "#2a3640",
  text: "#e6edf3",
  muted: "#93a4b4",
  good: "#2ecc71",
  warn: "#f39c12",
  bad: "#e74c3c",
  accent: "#4aa3ff",
  accentHover: "#5bb2ff",
  inputBg: "#0f151b",
};

// Reusable class generators
const CARD_CLASSES = (isDarkMode) =>
  `${isDarkMode ? "bg-[#141a20] border-[#2a3640]" : "bg-white border-gray-200"} border rounded-2xl p-4`;

const INPUT_CLASSES = (isDarkMode) =>
  `w-full ${isDarkMode ? "bg-[#0f151b] border-[#2a3640] text-[#e6edf3]" : "bg-white border-gray-300 text-gray-900"} border rounded-xl py-2.5 px-3 text-[13px] outline-none focus:border-[#5bb2ff] focus:ring-2 focus:ring-[#4aa3ff]/20 transition-colors`;

const LABEL_CLASSES = (isDarkMode) =>
  `block text-xs ${isDarkMode ? "text-[#93a4b4]" : "text-gray-500"} mb-1.5`;

const BTN_CLASSES = (isDarkMode) =>
  `${isDarkMode ? "bg-[#0f151b] border-[#2a3640] text-[#e6edf3] hover:border-[#4aa3ff]" : "bg-white border-gray-300 text-gray-900 hover:border-blue-500"} border rounded-xl py-2.5 px-3 text-[13px] cursor-pointer transition-colors`;

const BTN_PRIMARY =
  "bg-[#4aa3ff] border-transparent text-[#001018] font-extrabold hover:bg-[#5bb2ff] rounded-xl py-2.5 px-3 text-[13px] cursor-pointer transition-colors";

const BTN_SMALL = (isDarkMode) =>
  `${isDarkMode ? "bg-[#0f151b] border-[#2a3640] text-[#e6edf3] hover:border-[#4aa3ff]" : "bg-white border-gray-300 text-gray-900 hover:border-blue-500"} border rounded-[10px] py-2 px-2.5 text-xs cursor-pointer transition-colors`;

const DIVIDER_CLASSES = (isDarkMode) =>
  `h-px ${isDarkMode ? "bg-[#2a3640]" : "bg-gray-200"} my-3`;

// Custom Button component
const Button = ({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  onClick,
  className = "",
  type = "button",
  ...props
}) => {
  const { isDarkMode } = useTheme();

  const baseClasses =
    "inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2";

  const getVariantClasses = () => {
    if (variant === "primary") {
      return isDarkMode
        ? `bg-gradient-to-br from-teal-600 to-teal-700 text-white hover:from-teal-500 hover:to-teal-600 hover:-translate-y-0.5 focus:ring-teal-500 disabled:bg-gray-600 disabled:hover:translate-y-0 shadow-sm hover:shadow-md focus:ring-offset-gray-800`
        : `bg-gradient-to-br from-teal-500 to-teal-600 text-white hover:from-teal-400 hover:to-teal-500 hover:-translate-y-0.5 focus:ring-teal-500 disabled:bg-gray-400 disabled:hover:translate-y-0 shadow-sm hover:shadow-md focus:ring-offset-white`;
    } else if (variant === "secondary") {
      return `${isDarkMode ? "bg-gray-700 hover:bg-gray-600" : "bg-gray-200 hover:bg-gray-300"} ${isDarkMode ? "text-white" : "text-gray-800"} focus:ring-gray-400`;
    } else if (variant === "danger") {
      return isDarkMode
        ? "bg-red-600 hover:bg-red-500 text-white focus:ring-red-500"
        : "bg-red-500 hover:bg-red-400 text-white focus:ring-red-500";
    } else {
      // outline
      return `border ${isDarkMode ? "border-gray-600 bg-transparent text-white hover:bg-gray-700" : "border-gray-300 bg-white text-gray-800 hover:bg-gray-50"} focus:ring-teal-500`;
    }
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      type={type}
      className={`${baseClasses} ${getVariantClasses()} ${sizes[size]} ${disabled ? "cursor-not-allowed opacity-50" : ""} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

// Custom Input component
const Input = ({
  label,
  error,
  className = "",
  type = "text",
  isDarkMode,
  ...props
}) => {
  return (
    <div className="space-y-1">
      {label && (
        <label
          className={`block text-sm font-medium ${isDarkMode ? "text-gray-400" : "text-gray-700"}`}
        >
          {label}
        </label>
      )}
      <input
        type={type}
        className={`w-full px-3 py-2 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${
          isDarkMode
            ? "bg-gray-800 border-gray-600 text-white placeholder-gray-400"
            : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
        } ${error ? "border-red-500" : ""} ${className}`}
        {...props}
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
};

// Custom Toggle component
const Toggle = ({ checked, onChange, label, isDarkMode }) => {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div
        className={`w-11 h-6 rounded-full relative transition-colors ${
          checked ? "bg-teal-500" : isDarkMode ? "bg-gray-600" : "bg-gray-300"
        }`}
        onClick={() => onChange(!checked)}
      >
        <div
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </div>
      <span
        className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}
      >
        {label}
      </span>
    </label>
  );
};

// Product Detail Drawer component
const ProductDetailDrawer = ({
  product,
  isOpen,
  onClose,
  isDarkMode,
  navigate,
}) => {
  if (!isOpen || !product) return null;

  const InfoRow = ({ icon: Icon, label, value, valueClassName = "" }) => (
    <div className="flex items-start gap-3 py-2">
      <Icon
        size={16}
        className={`mt-0.5 ${isDarkMode ? "text-[#93a4b4]" : "text-gray-400"}`}
      />
      <div className="flex-1 min-w-0">
        <p
          className={`text-[11px] ${isDarkMode ? "text-[#93a4b4]" : "text-gray-500"}`}
        >
          {label}
        </p>
        <p
          className={`text-[13px] font-medium truncate ${valueClassName || (isDarkMode ? "text-[#e6edf3]" : "text-gray-900")}`}
        >
          {value || "-"}
        </p>
      </div>
    </div>
  );

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/55 z-30 transition-opacity ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />
      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-[min(520px,92vw)] z-[31] overflow-auto transition-transform duration-300 ease-out ${
          isDarkMode
            ? "bg-[#141a20] border-l border-[#2a3640]"
            : "bg-white border-l border-gray-200"
        } ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Inner padding */}
        <div className="p-4">
          {/* Sticky Header */}
          <div
            className={`sticky top-0 flex justify-between items-start gap-2.5 p-4 -m-4 mb-3 z-[1] ${
              isDarkMode
                ? "bg-[#141a20] border-b border-[#2a3640]"
                : "bg-white border-b border-gray-200"
            }`}
          >
            <div>
              <div className="flex items-center gap-2">
                <Package size={18} className="text-[#4aa3ff]" />
                <span
                  className={`text-sm font-extrabold ${isDarkMode ? "text-[#e6edf3]" : "text-gray-900"}`}
                >
                  Product Details
                </span>
              </div>
              <p
                className={`text-xs mt-0.5 ${isDarkMode ? "text-[#93a4b4]" : "text-gray-500"}`}
              >
                View product information
              </p>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-colors ${isDarkMode ? "hover:bg-[#0f151b] text-[#93a4b4]" : "hover:bg-gray-100 text-gray-600"}`}
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="mt-3">
            {/* Product Name */}
            <div className="mb-3">
              <h4
                className={`text-base font-bold ${isDarkMode ? "text-[#e6edf3]" : "text-gray-900"}`}
              >
                {product.displayName ||
                  product.display_name ||
                  product.name ||
                  "N/A"}
              </h4>
              <p
                className={`text-xs ${isDarkMode ? "text-[#93a4b4]" : "text-gray-500"}`}
              >
                {product.sku || product.product_code || `ID: ${product.id}`}
              </p>
            </div>

            {/* Category & Grade */}
            <div className="flex flex-wrap gap-2 mb-3">
              {product.category && (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] rounded-full border ${
                    isDarkMode
                      ? "border-[#4aa3ff]/35 text-[#4aa3ff]"
                      : "border-blue-300 text-blue-700"
                  }`}
                >
                  <Layers size={12} />
                  {product.category}
                </span>
              )}
              {product.grade && (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] rounded-full border ${
                    isDarkMode
                      ? "border-purple-500/35 text-purple-400"
                      : "border-purple-300 text-purple-700"
                  }`}
                >
                  {product.grade}
                </span>
              )}
            </div>

            {/* Pricing Section */}
            <div
              className={`rounded-[14px] p-3 mb-3 ${isDarkMode ? "bg-[#0f151b] border border-[#2a3640]" : "bg-gray-50 border border-gray-200"}`}
            >
              <h5
                className={`text-[11px] font-bold uppercase mb-2.5 ${isDarkMode ? "text-[#93a4b4]" : "text-gray-600"}`}
              >
                Pricing
              </h5>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p
                    className={`text-[11px] ${isDarkMode ? "text-[#93a4b4]" : "text-gray-500"}`}
                  >
                    Selling Price
                  </p>
                  <p className="text-sm font-extrabold text-[#4aa3ff] font-mono">
                    AED{" "}
                    {product.sellingPrice?.toFixed(2) ||
                      product.selling_price?.toFixed(2) ||
                      "0.00"}
                  </p>
                </div>
                <div>
                  <p
                    className={`text-[11px] ${isDarkMode ? "text-[#93a4b4]" : "text-gray-500"}`}
                  >
                    Cost Price
                  </p>
                  <p
                    className={`text-sm font-bold font-mono ${isDarkMode ? "text-[#e6edf3]" : "text-gray-700"}`}
                  >
                    AED{" "}
                    {product.costPrice?.toFixed(2) ||
                      product.cost_price?.toFixed(2) ||
                      "0.00"}
                  </p>
                </div>
              </div>
              {product.sellingPrice && product.costPrice && (
                <div
                  className={`mt-2.5 pt-2.5 border-t border-dashed ${isDarkMode ? "border-[#2a3640]" : "border-gray-300"}`}
                >
                  <p
                    className={`text-[11px] ${isDarkMode ? "text-[#93a4b4]" : "text-gray-500"}`}
                  >
                    Margin
                  </p>
                  <p
                    className={`text-sm font-bold font-mono ${
                      ((product.sellingPrice - product.costPrice) /
                        product.sellingPrice) *
                        100 >
                      20
                        ? "text-[#2ecc71]"
                        : "text-[#f39c12]"
                    }`}
                  >
                    {(
                      ((product.sellingPrice - product.costPrice) /
                        product.sellingPrice) *
                      100
                    ).toFixed(1)}
                    %
                  </p>
                </div>
              )}
            </div>

            {/* Source Section */}
            <div
              className={`rounded-[14px] p-3 mb-3 ${isDarkMode ? "bg-[#0f151b] border border-[#2a3640]" : "bg-gray-50 border border-gray-200"}`}
            >
              <h5
                className={`text-[11px] font-bold uppercase mb-2.5 ${isDarkMode ? "text-[#93a4b4]" : "text-gray-600"}`}
              >
                Source
              </h5>
              <div className="space-y-1">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-1 text-[11px] font-medium rounded-full border ${
                      product.isImported || product.is_imported
                        ? isDarkMode
                          ? "border-[#4aa3ff]/35 text-[#4aa3ff]"
                          : "border-blue-300 text-blue-700"
                        : isDarkMode
                          ? "border-green-500/35 text-green-400"
                          : "border-green-300 text-green-700"
                    }`}
                  >
                    {product.isImported || product.is_imported ? (
                      <>
                        <Globe size={12} /> Imported
                      </>
                    ) : (
                      <>
                        <MapPin size={12} /> Local
                      </>
                    )}
                  </span>
                </div>
                {(product.isImported || product.is_imported) && (
                  <div className="space-y-1">
                    <InfoRow
                      icon={Globe}
                      label="Country of Origin"
                      value={
                        product.countryOfOrigin ||
                        product.country_of_origin ||
                        product.origin_country
                      }
                    />
                    <InfoRow
                      icon={Factory}
                      label="Mill / Manufacturer"
                      value={
                        product.millName ||
                        product.mill_name ||
                        product.manufacturer
                      }
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Stock Section */}
            <div
              className={`rounded-[14px] p-3 ${isDarkMode ? "bg-[#0f151b] border border-[#2a3640]" : "bg-gray-50 border border-gray-200"}`}
            >
              <h5
                className={`text-[11px] font-bold uppercase mb-2.5 ${isDarkMode ? "text-[#93a4b4]" : "text-gray-600"}`}
              >
                Stock Information
              </h5>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p
                    className={`text-[11px] ${isDarkMode ? "text-[#93a4b4]" : "text-gray-500"}`}
                  >
                    Available Stock
                  </p>
                  <p
                    className={`text-sm font-extrabold font-mono ${
                      (product.stockQuantity || product.stock_quantity || 0) > 0
                        ? "text-[#2ecc71]"
                        : "text-[#e74c3c]"
                    }`}
                  >
                    {product.stockQuantity || product.stock_quantity || 0}
                  </p>
                </div>
                <div>
                  <p
                    className={`text-[11px] ${isDarkMode ? "text-[#93a4b4]" : "text-gray-500"}`}
                  >
                    Reserved
                  </p>
                  <p
                    className={`text-sm font-bold font-mono ${isDarkMode ? "text-[#e6edf3]" : "text-gray-700"}`}
                  >
                    {product.reservedQuantity || product.reserved_quantity || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Footer */}
          <div
            className="sticky bottom-0 pt-4 mt-4"
            style={{
              background: isDarkMode
                ? "linear-gradient(to top, rgba(20,26,32,1) 70%, rgba(20,26,32,0))"
                : "linear-gradient(to top, rgba(255,255,255,1) 70%, rgba(255,255,255,0))",
            }}
          >
            <button
              onClick={() => {
                onClose();
                navigate(`/products/${product.id}`);
              }}
              className={`${BTN_CLASSES(isDarkMode)} w-full flex items-center justify-center gap-2`}
            >
              <ExternalLink size={16} />
              View Full Product Page
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default function PriceListForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const copyFromId = searchParams.get("copyFrom");
  const isEdit = !!id;
  const { isDarkMode } = useTheme();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [bulkOperation, setBulkOperation] = useState({
    type: "increase",
    percentage: 0,
  });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [activeTab, setActiveTab] = useState("prices"); // 'prices' or 'history'

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    currency: "AED",
    isActive: true,
    isDefault: false,
    effectiveFrom: "",
    effectiveTo: "",
    items: [],
  });

  useEffect(() => {
    fetchProducts();
    if (isEdit) {
      fetchPricelist();
    } else if (copyFromId) {
      copyPricelist(copyFromId);
    } else {
      // New pricelist - load default prices as starting point
      loadDefaultPrices();
    }
  }, [id, copyFromId]);

  const fetchProducts = async () => {
    try {
      const response = await productService.getProducts();
      setProducts(response.products || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      notificationService.error("Failed to load products");
    }
  };

  const fetchPricelist = async () => {
    try {
      setLoading(true);
      const response = await pricelistService.getById(id);
      const pricelist = response.pricelist;
      const items = response.items || [];

      setFormData({
        name: pricelist.name,
        description: pricelist.description || "",
        currency: pricelist.currency || "AED",
        isActive: pricelist.isActive,
        isDefault: pricelist.isDefault,
        effectiveFrom: pricelist.effectiveFrom || "",
        effectiveTo: pricelist.effectiveTo || "",
        items,
      });
    } catch (error) {
      console.error("Error fetching pricelist:", error);
      notificationService.error("Failed to load price list");
    } finally {
      setLoading(false);
    }
  };

  const copyPricelist = async (sourceId) => {
    try {
      setLoading(true);
      const response = await pricelistService.getById(sourceId);
      const source = response.pricelist;
      const items = response.items || [];

      setFormData({
        name: `${source.name} (Copy)`,
        description: source.description || "",
        currency: source.currency || "AED",
        isActive: true,
        isDefault: false,
        effectiveFrom: "",
        effectiveTo: "",
        items,
      });
    } catch (error) {
      console.error("Error copying pricelist:", error);
      notificationService.error("Failed to copy price list");
    } finally {
      setLoading(false);
    }
  };

  const loadDefaultPrices = async () => {
    try {
      setLoading(true);
      // Get all pricelists to find the default one
      const response = await pricelistService.getAll();
      const pricelists = response.pricelists || [];
      const defaultPricelist = pricelists.find((p) => p.isDefault);

      if (defaultPricelist) {
        // Fetch the default pricelist's items
        const detailResponse = await pricelistService.getById(
          defaultPricelist.id,
        );
        const items = detailResponse.items || [];

        setFormData((prev) => ({
          ...prev,
          items,
        }));
      }
    } catch (error) {
      console.error("Error loading default prices:", error);
      // Non-critical - don't show error, just start with empty prices
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePriceChange = (productId, newPrice) => {
    setFormData((prev) => {
      const existingIndex = prev.items.findIndex(
        (item) => item.productId === productId,
      );

      if (existingIndex >= 0) {
        const updatedItems = [...prev.items];
        updatedItems[existingIndex] = {
          ...updatedItems[existingIndex],
          sellingPrice: parseFloat(newPrice) || 0,
        };
        return { ...prev, items: updatedItems };
      } else {
        const product = products.find((p) => p.id === productId);
        return {
          ...prev,
          items: [
            ...prev.items,
            {
              productId,
              productName: product?.displayName || product?.name,
              sellingPrice: parseFloat(newPrice) || 0,
              minQuantity: 1,
            },
          ],
        };
      }
    });
  };

  const handleBulkApply = () => {
    const { type, percentage } = bulkOperation;
    const multiplier =
      type === "increase" ? 1 + percentage / 100 : 1 - percentage / 100;

    setFormData((prev) => ({
      ...prev,
      items: prev.items.map((item) => ({
        ...item,
        sellingPrice: parseFloat((item.sellingPrice * multiplier).toFixed(2)),
      })),
    }));

    notificationService.success(`Applied ${percentage}% ${type} to all prices`);
    setShowBulkDialog(false);
  };

  const handleResetToDefaults = () => {
    // Reset ALL products to their default selling prices
    const allItems = products.map((product) => ({
      productId: product.id,
      productName: product.displayName || product.name,
      sellingPrice: product.sellingPrice || 0,
      minQuantity: 1,
    }));
    setFormData((prev) => ({
      ...prev,
      items: allItems,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name) {
      notificationService.error("Price list name is required");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        ...formData,
        items: formData.items.map((item) => ({
          product_id: item.productId,
          selling_price: item.sellingPrice,
          min_quantity: item.minQuantity || 1,
        })),
      };

      if (isEdit) {
        await pricelistService.update(id, payload);
        notificationService.success("Price list updated successfully");
      } else {
        await pricelistService.create(payload);
        notificationService.success("Price list created successfully");
      }

      navigate("/pricelists");
    } catch (error) {
      console.error("Error saving pricelist:", error);
      notificationService.error(
        error.response?.data?.message || "Failed to save price list",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAsNew = async () => {
    if (!formData.name) {
      notificationService.error("Price list name is required");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: formData.name,
        description: formData.description,
        currency: formData.currency,
        isActive: formData.isActive,
        isDefault: false, // New pricelist should not be default
        items: formData.items.map((item) => ({
          product_id: item.productId,
          selling_price: item.sellingPrice,
          min_quantity: item.minQuantity || 1,
        })),
      };

      await pricelistService.create(payload);
      notificationService.success("New price list created successfully");
      navigate("/pricelists");
    } catch (error) {
      console.error("Error creating new pricelist:", error);
      notificationService.error(
        error.response?.data?.message || "Failed to create price list",
      );
    } finally {
      setSaving(false);
    }
  };

  const getProductPrice = (productId) => {
    const item = formData.items.find((i) => i.productId === productId);
    return item?.sellingPrice || "";
  };

  const getProductCurrentPrice = (productId) => {
    const product = products.find((p) => p.id === productId);
    return product?.sellingPrice || 0;
  };

  const getProductCostPrice = (productId) => {
    const product = products.find((p) => p.id === productId);
    return product?.costPrice || product?.cost_price || 0;
  };

  const calculateMargin = (sellingPrice, costPrice) => {
    if (!sellingPrice || !costPrice || sellingPrice === 0) return null;
    return (((sellingPrice - costPrice) / sellingPrice) * 100).toFixed(1);
  };

  const getPriceDiff = (productId) => {
    const newPrice = getProductPrice(productId);
    const currentPrice = getProductCurrentPrice(productId);

    if (!newPrice || !currentPrice) return null;

    const diff = newPrice - currentPrice;
    const diffPercent = ((diff / currentPrice) * 100).toFixed(1);

    return { diff, diffPercent };
  };

  // Filtered products by search
  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    const search = searchTerm.toLowerCase();
    return products.filter(
      (p) =>
        p.displayName?.toLowerCase().includes(search) ||
        p.display_name?.toLowerCase().includes(search) ||
        p.name?.toLowerCase().includes(search) ||
        p.category?.toLowerCase().includes(search) ||
        p.grade?.toLowerCase().includes(search),
    );
  }, [products, searchTerm]);

  // Stats
  const stats = useMemo(
    () => ({
      totalProducts: products.length,
      configuredProducts: formData.items.length,
      increasedPrices: formData.items.filter((item) => {
        const currentPrice = getProductCurrentPrice(item.productId);
        return item.sellingPrice > currentPrice;
      }).length,
      decreasedPrices: formData.items.filter((item) => {
        const currentPrice = getProductCurrentPrice(item.productId);
        return item.sellingPrice < currentPrice && item.sellingPrice > 0;
      }).length,
    }),
    [formData.items, products],
  );

  if (loading) {
    return (
      <div
        className={`p-4 min-h-screen ${isDarkMode ? "bg-[#121418]" : "bg-[#FAFAFA]"}`}
      >
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen ${isDarkMode ? "bg-[#0b0f14]" : "bg-[#FAFAFA]"}`}
    >
      {/* Sticky Header with Blur */}
      <div
        className={`sticky top-0 z-10 backdrop-blur-md ${
          isDarkMode
            ? "bg-[#0f151b]/94 border-b border-[#2a3640]"
            : "bg-white/94 border-b border-gray-200"
        } px-4 py-3`}
      >
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/pricelists")}
              className={`p-2 rounded-xl transition-colors ${
                isDarkMode
                  ? "hover:bg-[#141a20] text-[#93a4b4]"
                  : "hover:bg-gray-100 text-gray-600"
              }`}
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1
                className={`text-lg font-extrabold ${isDarkMode ? "text-[#e6edf3]" : "text-gray-900"}`}
              >
                {isEdit ? "Edit Price List" : "New Price List"}
              </h1>
              <p
                className={`text-xs ${isDarkMode ? "text-[#93a4b4]" : "text-gray-500"}`}
              >
                {isEdit
                  ? "Update pricing for your products"
                  : "Create a new price list to manage product pricing"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Status Pills */}
            {formData.isActive && (
              <span
                className={`px-2.5 py-1 text-xs rounded-full border ${
                  isDarkMode
                    ? "border-green-500/35 text-green-400"
                    : "border-green-300 text-green-700 bg-green-50"
                }`}
              >
                Active
              </span>
            )}
            {formData.isDefault && (
              <span
                className={`px-2.5 py-1 text-xs rounded-full border ${
                  isDarkMode
                    ? "border-[#4aa3ff]/35 text-[#4aa3ff]"
                    : "border-blue-300 text-blue-700 bg-blue-50"
                }`}
              >
                Default
              </span>
            )}
            {/* Header Action Buttons */}
            <button
              type="button"
              onClick={() => navigate("/pricelists")}
              className={BTN_CLASSES(isDarkMode)}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className={BTN_PRIMARY}
            >
              <Save size={16} className="inline mr-1.5" />
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <form onSubmit={handleSubmit} className="p-4 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-12 gap-3">
          {/* Left Column - Main Form (8 cols) */}
          <div className="col-span-12 lg:col-span-8 space-y-3">
            {/* Basic Information Card - Collapsible Details */}
            <details open className={`${CARD_CLASSES(isDarkMode)} group`}>
              <summary className="list-none cursor-pointer flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tag size={16} className="text-[#4aa3ff]" />
                  <span
                    className={`text-sm font-bold ${isDarkMode ? "text-[#e6edf3]" : "text-gray-900"}`}
                  >
                    Price List Details
                  </span>
                </div>
                <svg
                  className={`w-4 h-4 transition-transform group-open:rotate-180 ${isDarkMode ? "text-[#93a4b4]" : "text-gray-500"}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </summary>
              <div
                className={`mt-3 pt-3 border-t ${isDarkMode ? "border-[#2a3640]" : "border-gray-200"}`}
              >
                <div className="grid grid-cols-12 gap-3">
                  {/* Name - full width */}
                  <div className="col-span-12 sm:col-span-6">
                    <label className={LABEL_CLASSES(isDarkMode)}>
                      Price List Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleChange("name", e.target.value)}
                      placeholder="e.g., Wholesale Prices Q1 2024"
                      required
                      className={INPUT_CLASSES(isDarkMode)}
                    />
                  </div>

                  {/* Currency */}
                  <div className="col-span-6 sm:col-span-3">
                    <FormSelect
                      label="Currency"
                      value={formData.currency}
                      onValueChange={(value) => handleChange("currency", value)}
                      showValidation={false}
                    >
                      <SelectItem value="AED">AED</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                    </FormSelect>
                  </div>

                  {/* Toggles */}
                  <div className="col-span-6 sm:col-span-3 flex items-end gap-4 pb-1">
                    <Toggle
                      checked={formData.isActive}
                      onChange={(val) => handleChange("isActive", val)}
                      label="Active"
                      isDarkMode={isDarkMode}
                    />
                    <Toggle
                      checked={formData.isDefault}
                      onChange={(val) => handleChange("isDefault", val)}
                      label="Default"
                      isDarkMode={isDarkMode}
                    />
                  </div>

                  {/* Description */}
                  <div className="col-span-12 sm:col-span-6">
                    <label className={LABEL_CLASSES(isDarkMode)}>
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        handleChange("description", e.target.value)
                      }
                      placeholder="Optional description..."
                      rows={2}
                      className={`${INPUT_CLASSES(isDarkMode)} resize-none`}
                    />
                  </div>

                  {/* Effective From */}
                  <div className="col-span-6 sm:col-span-3">
                    <label className={LABEL_CLASSES(isDarkMode)}>
                      Effective From
                    </label>
                    <input
                      type="date"
                      value={formData.effectiveFrom}
                      onChange={(e) =>
                        handleChange("effectiveFrom", e.target.value)
                      }
                      className={INPUT_CLASSES(isDarkMode)}
                    />
                  </div>

                  {/* Effective To */}
                  <div className="col-span-6 sm:col-span-3">
                    <label className={LABEL_CLASSES(isDarkMode)}>
                      Effective To
                    </label>
                    <input
                      type="date"
                      value={formData.effectiveTo}
                      onChange={(e) =>
                        handleChange("effectiveTo", e.target.value)
                      }
                      className={INPUT_CLASSES(isDarkMode)}
                    />
                  </div>
                </div>
              </div>
            </details>

            {/* Product Prices Card with Tabs */}
            <div className={CARD_CLASSES(isDarkMode)}>
              {/* Tab Navigation */}
              <div
                className={`flex border-b -mx-4 px-4 ${isDarkMode ? "border-[#2a3640]" : "border-gray-200"}`}
              >
                <button
                  type="button"
                  onClick={() => setActiveTab("prices")}
                  className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-bold transition-colors border-b-2 -mb-px ${
                    activeTab === "prices"
                      ? `border-[#4aa3ff] ${isDarkMode ? "text-[#4aa3ff]" : "text-blue-600"}`
                      : `border-transparent ${isDarkMode ? "text-[#93a4b4] hover:text-[#e6edf3]" : "text-gray-500 hover:text-gray-700"}`
                  }`}
                >
                  <Package size={16} />
                  Product Prices
                  <span
                    className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                      isDarkMode ? "bg-[#0f151b]" : "bg-gray-100"
                    }`}
                  >
                    {stats.configuredProducts}
                  </span>
                </button>
                {isEdit && (
                  <button
                    type="button"
                    onClick={() => setActiveTab("history")}
                    className={`flex items-center gap-2 px-4 py-2.5 text-[13px] font-bold transition-colors border-b-2 -mb-px ${
                      activeTab === "history"
                        ? `border-[#4aa3ff] ${isDarkMode ? "text-[#4aa3ff]" : "text-blue-600"}`
                        : `border-transparent ${isDarkMode ? "text-[#93a4b4] hover:text-[#e6edf3]" : "text-gray-500 hover:text-gray-700"}`
                    }`}
                  >
                    <History size={16} />
                    Price History
                  </button>
                )}
              </div>

              {/* Tab Content */}
              <div className="pt-3">
                {activeTab === "prices" ? (
                  <>
                    {/* Product Prices Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs ${isDarkMode ? "text-[#93a4b4]" : "text-gray-500"}`}
                        >
                          {stats.configuredProducts} of {stats.totalProducts}{" "}
                          configured
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowBulkDialog(true)}
                          className={BTN_SMALL(isDarkMode)}
                        >
                          <Percent size={14} className="inline mr-1" />
                          Bulk Adjust
                        </button>
                        <button
                          type="button"
                          onClick={handleResetToDefaults}
                          disabled={formData.items.length === 0}
                          className={BTN_SMALL(isDarkMode)}
                        >
                          <RotateCcw size={14} className="inline mr-1" />
                          Reset
                        </button>
                      </div>
                    </div>

                    {/* Search */}
                    <div className="relative mb-3">
                      <Search
                        className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDarkMode ? "text-[#93a4b4]" : "text-gray-500"}`}
                      />
                      <input
                        type="text"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={`${INPUT_CLASSES(isDarkMode)} pl-10`}
                      />
                    </div>

                    {/* Products Table */}
                    <div className="overflow-x-auto -mx-4">
                      <table className="w-full">
                        <thead>
                          <tr
                            className={`border-b ${isDarkMode ? "border-[#2a3640]" : "border-gray-200"}`}
                          >
                            <th
                              className={`text-left py-2.5 px-4 text-xs font-bold ${isDarkMode ? "text-[#93a4b4]" : "text-gray-600"}`}
                            >
                              Product
                            </th>
                            <th
                              className={`text-right py-2.5 px-3 text-xs font-bold ${isDarkMode ? "text-[#93a4b4]" : "text-gray-600"}`}
                            >
                              Current
                            </th>
                            <th
                              className={`text-right py-2.5 px-3 text-xs font-bold ${isDarkMode ? "text-[#93a4b4]" : "text-gray-600"}`}
                            >
                              New Price
                            </th>
                            <th
                              className={`text-right py-2.5 px-4 text-xs font-bold ${isDarkMode ? "text-[#93a4b4]" : "text-gray-600"}`}
                            >
                              Change
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredProducts.map((product) => {
                            const priceDiff = getPriceDiff(product.id);
                            const newPrice = getProductPrice(product.id);
                            const costPrice = getProductCostPrice(product.id);
                            const margin =
                              newPrice && costPrice
                                ? calculateMargin(
                                    parseFloat(newPrice),
                                    costPrice,
                                  )
                                : null;
                            const isNegativeMargin =
                              margin !== null && parseFloat(margin) < 0;

                            return (
                              <tr
                                key={product.id}
                                className={`border-b transition-colors ${
                                  isDarkMode
                                    ? "border-[#2a3640] hover:bg-[#0f151b]/50"
                                    : "border-gray-100 hover:bg-gray-50"
                                }`}
                              >
                                <td className="py-2.5 px-4">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedProduct(product)}
                                    className={`font-medium text-[13px] text-left hover:text-[#4aa3ff] transition-colors ${isDarkMode ? "text-[#e6edf3]" : "text-gray-900"}`}
                                  >
                                    {product.uniqueName ||
                                      product.unique_name ||
                                      "N/A"}
                                  </button>
                                  <p
                                    className={`text-[11px] ${isDarkMode ? "text-[#93a4b4]" : "text-gray-500"}`}
                                  >
                                    {product.isImported || product.is_imported
                                      ? `Imported - ${product.countryOfOrigin || product.country_of_origin || product.origin_country || "Unknown"}`
                                      : "Local"}
                                  </p>
                                </td>
                                <td className={`py-2.5 px-3 text-right`}>
                                  <div
                                    className={`text-[13px] font-mono ${isDarkMode ? "text-[#93a4b4]" : "text-gray-600"}`}
                                  >
                                    {formData.currency}{" "}
                                    {product.sellingPrice?.toFixed(2) || "0.00"}
                                  </div>
                                  <div
                                    className={`text-[11px] font-mono ${isDarkMode ? "text-[#93a4b4]/70" : "text-gray-400"}`}
                                  >
                                    Cost: {costPrice?.toFixed(2) || "0.00"}
                                  </div>
                                </td>
                                <td className="py-2.5 px-3">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <span
                                      className={`text-[11px] ${isDarkMode ? "text-[#93a4b4]" : "text-gray-500"}`}
                                    >
                                      {formData.currency}
                                    </span>
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={getProductPrice(product.id)}
                                      onChange={(e) =>
                                        handlePriceChange(
                                          product.id,
                                          e.target.value,
                                        )
                                      }
                                      placeholder="0.00"
                                      className={`w-24 py-1.5 px-2 text-[13px] text-right border rounded-xl focus:outline-none focus:ring-2 font-mono ${
                                        isNegativeMargin
                                          ? "border-[#e74c3c] focus:ring-[#e74c3c]/20 bg-red-900/10"
                                          : "focus:ring-[#4aa3ff]/20 focus:border-[#5bb2ff]"
                                      } ${
                                        isDarkMode
                                          ? "bg-[#0f151b] border-[#2a3640] text-[#e6edf3] placeholder-[#93a4b4]/50"
                                          : "bg-white border-gray-300 text-gray-900 placeholder-gray-400"
                                      }`}
                                    />
                                  </div>
                                  {margin !== null && (
                                    <div
                                      className={`text-[11px] text-right mt-1 font-bold font-mono ${
                                        isNegativeMargin
                                          ? "text-[#e74c3c]"
                                          : parseFloat(margin) < 10
                                            ? "text-[#f39c12]"
                                            : "text-[#2ecc71]"
                                      }`}
                                    >
                                      {margin}%{isNegativeMargin && " !"}
                                    </div>
                                  )}
                                </td>
                                <td className="py-2.5 px-4 text-right">
                                  {priceDiff && (
                                    <span
                                      className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] rounded-full font-bold border ${
                                        priceDiff.diff >= 0
                                          ? isDarkMode
                                            ? "border-green-500/35 text-green-400"
                                            : "border-green-300 text-green-700"
                                          : isDarkMode
                                            ? "border-red-500/35 text-red-400"
                                            : "border-red-300 text-red-700"
                                      }`}
                                    >
                                      {priceDiff.diff >= 0 ? (
                                        <TrendingUp size={12} />
                                      ) : (
                                        <TrendingDown size={12} />
                                      )}
                                      {priceDiff.diff >= 0 ? "+" : ""}
                                      {priceDiff.diffPercent}%
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {filteredProducts.length === 0 && (
                      <div
                        className={`text-center py-8 ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}
                      >
                        <Package
                          size={48}
                          className="mx-auto mb-2 opacity-50"
                        />
                        <p>No products found</p>
                      </div>
                    )}
                  </>
                ) : (
                  /* History Tab Content */
                  <PriceHistoryTab
                    pricelistId={parseInt(id)}
                    products={products}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Sticky Summary (4 cols) */}
          <div className="col-span-12 lg:col-span-4">
            <div className="lg:sticky lg:top-[72px]">
              {/* Summary Card */}
              <div className={CARD_CLASSES(isDarkMode)}>
                <div
                  className={`text-sm font-bold mb-3 ${isDarkMode ? "text-[#e6edf3]" : "text-gray-900"}`}
                >
                  Price List Summary
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 gap-2.5 mb-3">
                  <div
                    className={`${isDarkMode ? "bg-[#0f151b] border-[#2a3640]" : "bg-gray-50 border-gray-200"} border rounded-[14px] p-2.5`}
                  >
                    <div
                      className={`text-[11px] ${isDarkMode ? "text-[#93a4b4]" : "text-gray-500"}`}
                    >
                      Total Products
                    </div>
                    <div
                      className={`text-sm font-extrabold mt-1 font-mono ${isDarkMode ? "text-[#e6edf3]" : "text-gray-900"}`}
                    >
                      {stats.totalProducts}
                    </div>
                  </div>
                  <div
                    className={`${isDarkMode ? "bg-[#0f151b] border-[#2a3640]" : "bg-gray-50 border-gray-200"} border rounded-[14px] p-2.5`}
                  >
                    <div
                      className={`text-[11px] ${isDarkMode ? "text-[#93a4b4]" : "text-gray-500"}`}
                    >
                      Configured
                    </div>
                    <div
                      className={`text-sm font-extrabold mt-1 font-mono ${isDarkMode ? "text-[#4aa3ff]" : "text-blue-600"}`}
                    >
                      {stats.configuredProducts}
                    </div>
                  </div>
                </div>

                {/* Price Changes */}
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className={`flex-1 flex items-center gap-2 px-2.5 py-2 rounded-[10px] ${isDarkMode ? "bg-green-900/20 border border-green-500/20" : "bg-green-50 border border-green-200"}`}
                  >
                    <TrendingUp size={14} className="text-green-500" />
                    <span
                      className={`text-sm font-bold ${isDarkMode ? "text-green-400" : "text-green-700"}`}
                    >
                      {stats.increasedPrices}
                    </span>
                    <span
                      className={`text-[11px] ${isDarkMode ? "text-green-400/70" : "text-green-600"}`}
                    >
                      increased
                    </span>
                  </div>
                  <div
                    className={`flex-1 flex items-center gap-2 px-2.5 py-2 rounded-[10px] ${isDarkMode ? "bg-red-900/20 border border-red-500/20" : "bg-red-50 border border-red-200"}`}
                  >
                    <TrendingDown size={14} className="text-red-500" />
                    <span
                      className={`text-sm font-bold ${isDarkMode ? "text-red-400" : "text-red-700"}`}
                    >
                      {stats.decreasedPrices}
                    </span>
                    <span
                      className={`text-[11px] ${isDarkMode ? "text-red-400/70" : "text-red-600"}`}
                    >
                      decreased
                    </span>
                  </div>
                </div>

                {/* Divider */}
                <div className={DIVIDER_CLASSES(isDarkMode)} />

                {/* Actions */}
                <div className="space-y-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className={`w-full flex items-center justify-center gap-2 ${BTN_PRIMARY}`}
                  >
                    <Save size={16} />
                    {saving ? "Saving..." : "Save Price List"}
                  </button>
                  {isEdit && (
                    <button
                      type="button"
                      onClick={handleSaveAsNew}
                      disabled={saving}
                      className={`w-full flex items-center justify-center gap-2 ${BTN_CLASSES(isDarkMode)}`}
                    >
                      <Copy size={16} />
                      Save As New
                    </button>
                  )}
                </div>

                {/* Quick Info */}
                {formData.name && (
                  <>
                    <div className={DIVIDER_CLASSES(isDarkMode)} />
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span
                          className={`text-xs ${isDarkMode ? "text-[#93a4b4]" : "text-gray-500"}`}
                        >
                          Name
                        </span>
                        <span
                          className={`text-xs font-medium ${isDarkMode ? "text-[#e6edf3]" : "text-gray-900"}`}
                        >
                          {formData.name}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span
                          className={`text-xs ${isDarkMode ? "text-[#93a4b4]" : "text-gray-500"}`}
                        >
                          Currency
                        </span>
                        <span
                          className={`text-xs font-mono font-medium ${isDarkMode ? "text-[#e6edf3]" : "text-gray-900"}`}
                        >
                          {formData.currency}
                        </span>
                      </div>
                      {formData.effectiveFrom && (
                        <div className="flex justify-between items-center">
                          <span
                            className={`text-xs ${isDarkMode ? "text-[#93a4b4]" : "text-gray-500"}`}
                          >
                            Effective From
                          </span>
                          <span
                            className={`text-xs font-mono ${isDarkMode ? "text-[#e6edf3]" : "text-gray-900"}`}
                          >
                            {formData.effectiveFrom}
                          </span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Product Detail Drawer */}
      <ProductDetailDrawer
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        isDarkMode={isDarkMode}
        navigate={navigate}
      />

      {/* Bulk Adjustment Modal */}
      {showBulkDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/55"
            onClick={() => setShowBulkDialog(false)}
          />
          {/* Modal */}
          <div
            className={`relative z-10 w-full max-w-md rounded-2xl p-4 ${
              isDarkMode
                ? "bg-[#141a20] border border-[#2a3640]"
                : "bg-white border border-gray-200"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Percent size={18} className="text-[#4aa3ff]" />
                  <h3
                    className={`text-sm font-extrabold ${isDarkMode ? "text-[#e6edf3]" : "text-gray-900"}`}
                  >
                    Bulk Price Adjustment
                  </h3>
                </div>
                <p
                  className={`text-xs mt-0.5 ${isDarkMode ? "text-[#93a4b4]" : "text-gray-500"}`}
                >
                  Apply percentage change to all prices
                </p>
              </div>
              <button
                onClick={() => setShowBulkDialog(false)}
                className={`p-2 rounded-xl transition-colors ${isDarkMode ? "hover:bg-[#0f151b] text-[#93a4b4]" : "hover:bg-gray-100 text-gray-600"}`}
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-3">
              <div>
                <FormSelect
                  label="Operation"
                  value={bulkOperation.type}
                  onValueChange={(value) =>
                    setBulkOperation({ ...bulkOperation, type: value })
                  }
                  showValidation={false}
                >
                  <SelectItem value="increase">Increase Prices</SelectItem>
                  <SelectItem value="decrease">Decrease Prices</SelectItem>
                </FormSelect>
              </div>

              <div>
                <label className={LABEL_CLASSES(isDarkMode)}>
                  Percentage (%)
                </label>
                <input
                  type="number"
                  value={bulkOperation.percentage}
                  onChange={(e) =>
                    setBulkOperation({
                      ...bulkOperation,
                      percentage: parseFloat(e.target.value),
                    })
                  }
                  placeholder="e.g., 10"
                  className={INPUT_CLASSES(isDarkMode)}
                />
              </div>

              {/* Preview */}
              {bulkOperation.percentage > 0 && (
                <div
                  className={`rounded-[14px] p-3 ${isDarkMode ? "bg-[#0f151b] border border-[#2a3640]" : "bg-gray-50 border border-gray-200"}`}
                >
                  <div
                    className={`text-[11px] ${isDarkMode ? "text-[#93a4b4]" : "text-gray-500"}`}
                  >
                    Preview
                  </div>
                  <div
                    className={`text-sm font-bold mt-1 ${bulkOperation.type === "increase" ? "text-[#2ecc71]" : "text-[#e74c3c]"}`}
                  >
                    {bulkOperation.type === "increase" ? "+" : "-"}
                    {bulkOperation.percentage}% on {stats.configuredProducts}{" "}
                    products
                  </div>
                </div>
              )}

              {/* Divider */}
              <div className={DIVIDER_CLASSES(isDarkMode)} />

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowBulkDialog(false)}
                  className={`flex-1 ${BTN_CLASSES(isDarkMode)}`}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleBulkApply}
                  className={`flex-1 ${BTN_PRIMARY}`}
                >
                  Apply Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
