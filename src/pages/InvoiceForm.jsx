import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Plus, Trash2, Save, Eye, Download } from "lucide-react";
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Divider,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Autocomplete,
  Chip,
  useTheme,
  useMediaQuery,
  Alert,
  AlertTitle,
  Collapse,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  createInvoice,
  createCompany,
  createSteelItem,
  STEEL_UNITS,
  PAYMENT_MODES,
  DELIVERY_TERMS,
  DISCOUNT_TYPES,
} from "../types";
import {
  generateInvoiceNumber,
  calculateItemAmount,
  calculateSubtotal,
  calculateTotalGST,
  calculateTotal,
  formatCurrency,
} from "../utils/invoiceUtils";
import { generateInvoicePDF } from "../utils/pdfGenerator";
import InvoicePreview from "../components/InvoicePreview";
import { invoiceService, companyService } from "../services";
import { customerService } from "../services/customerService";
import { productService } from "../services/productService";
import { useApiData, useApi } from "../hooks/useApi";

// Styled Components
const InvoiceContainer = styled(Box)(({ theme }) => ({
  paddingTop: theme.spacing(1),
  paddingBottom: theme.spacing(1),
  paddingLeft: 0,
  paddingRight: 0,
  background: theme.palette.background.default,
  minHeight: "calc(100vh - 64px)",
  overflow: "auto",
  [theme.breakpoints.up("sm")]: {
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(2),
    paddingLeft: 0,
    paddingRight: 0,
  },
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(0),
  },
}));

const InvoiceFormPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  background: theme.palette.background.paper,
  borderRadius: theme.spacing(1),
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: theme.shadows[1],
  margin: 0,
  [theme.breakpoints.up("sm")]: {
    padding: theme.spacing(3),
    borderRadius: theme.spacing(2),
    boxShadow: theme.shadows[2],
  },
}));

const SectionCard = styled(Card)(({ theme }) => ({
  background: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.spacing(1),
  boxShadow: theme.shadows[0],
  [theme.breakpoints.up("sm")]: {
    borderRadius: theme.spacing(2),
    boxShadow: theme.shadows[1],
  },
}));

const SectionHeader = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  color: theme.palette.text.primary,
  marginBottom: theme.spacing(2),
  display: "flex",
  alignItems: "center",
  gap: theme.spacing(1),
  fontSize: "1rem",
  [theme.breakpoints.up("sm")]: {
    fontSize: "1.25rem",
  },
}));

const MobileTableContainer = styled(Box)(({ theme }) => ({
  display: "block",
  [theme.breakpoints.up("md")]: {
    display: "none",
  },
}));

const DesktopTableContainer = styled(TableContainer)(({ theme }) => ({
  display: "none",
  [theme.breakpoints.up("md")]: {
    display: "block",
  },
}));

const MobileItemCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  border: `1px solid ${theme.palette.divider}`,
}));

const HeaderActions = styled(Box)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(1),
  width: "100%",
  [theme.breakpoints.up("sm")]: {
    flexDirection: "row",
    width: "auto",
  },
}));

const InvoiceForm = ({ onSave }) => {
  const { id } = useParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const [showPreview, setShowPreview] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProductData, setNewProductData] = useState({
    name: "",
    category: "rebar",
    grade: "",
    size: "",
    weight: "",
    unit: "kg",
    description: "",
    current_stock: 0,
    min_stock: 10,
    max_stock: 1000,
    cost_price: 0,
    selling_price: 0,
    supplier: "",
    location: "",
    specifications: {
      length: "",
      width: "",
      thickness: "",
      diameter: "",
      tensileStrength: "",
      yieldStrength: "",
      carbonContent: "",
      coating: "",
      standard: "",
    },
  });
  const [selectedProductForRow, setSelectedProductForRow] = useState(-1);
  const [searchInputs, setSearchInputs] = useState({});
  const [tradeLicenseStatus, setTradeLicenseStatus] = useState(null);
  const [showTradeLicenseAlert, setShowTradeLicenseAlert] = useState(false);
  const [invoice, setInvoice] = useState(() => {
    const newInvoice = createInvoice();
    newInvoice.invoiceNumber = generateInvoiceNumber();
    return newInvoice;
  });

  const { data: company, loading: loadingCompany } = useApiData(
    companyService.getCompany,
    [],
    true
  );
  const { execute: saveInvoice, loading: savingInvoice } = useApi(
    invoiceService.createInvoice
  );
  const { execute: updateInvoice, loading: updatingInvoice } = useApi(
    invoiceService.updateInvoice
  );
  const { data: existingInvoice, loading: loadingInvoice } = useApiData(
    () => (id ? invoiceService.getInvoice(id) : null),
    [id],
    !!id
  );
  const { data: nextInvoiceData } = useApiData(
    () => invoiceService.getNextInvoiceNumber(),
    [],
    !id
  );
  const { data: customersData, loading: loadingCustomers } = useApiData(
    () => customerService.getCustomers({ status: "active" }),
    []
  );
  const {
    data: productsData,
    loading: loadingProducts,
    refetch: refetchProducts,
  } = useApiData(() => productService.getProducts({}), []);
  const { execute: createProduct, loading: creatingProduct } = useApi(
    productService.createProduct
  );

  useEffect(() => {
    const subtotal = calculateSubtotal(invoice.items);
    const gstAmount = calculateTotalGST(invoice.items);
    const total = calculateTotal(subtotal, gstAmount);

    setInvoice((prev) => ({
      ...prev,
      subtotal,
      gstAmount,
      total,
    }));
  }, [invoice.items]);

  useEffect(() => {
    if (nextInvoiceData && nextInvoiceData.nextNumber && !id) {
      setInvoice((prev) => ({
        ...prev,
        invoiceNumber: nextInvoiceData.nextNumber,
      }));
    }
  }, [nextInvoiceData, id]);

  useEffect(() => {
    if (existingInvoice && id) {
      setInvoice(existingInvoice);
    }
  }, [existingInvoice, id]);

  const checkTradeLicenseStatus = async (customerId) => {
    try {
      const response = await fetch(`/api/customers/${customerId}/trade-license-status`);
      if (response.ok) {
        const licenseStatus = await response.json();
        setTradeLicenseStatus(licenseStatus);
        
        // Show alert for expired or expiring licenses
        if (licenseStatus.hasLicense && (licenseStatus.status === 'expired' || licenseStatus.status === 'expiring_soon')) {
          setShowTradeLicenseAlert(true);
        } else {
          setShowTradeLicenseAlert(false);
        }
      }
    } catch (error) {
      console.error('Error checking trade license status:', error);
    }
  };

  const handleCustomerSelect = (customerId) => {
    const customers = customersData?.customers || [];
    const selectedCustomer = customers.find((c) => c.id === customerId);

    if (selectedCustomer) {
      setInvoice((prev) => ({
        ...prev,
        customer: {
          id: selectedCustomer.id,
          name: selectedCustomer.name,
          email: selectedCustomer.email || "",
          phone: selectedCustomer.phone || "",
          vatNumber: selectedCustomer.vat_number || "",
          address: {
            street: selectedCustomer.address?.street || "",
            city: selectedCustomer.address?.city || "",
            emirate: selectedCustomer.address?.emirate || "",
            poBox: selectedCustomer.address?.poBox || "",
          },
        },
      }));
      
      // Check trade license status
      checkTradeLicenseStatus(customerId);
    }
  };

  const handleCustomerChange = (field, value) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      setInvoice((prev) => ({
        ...prev,
        customer: {
          ...prev.customer,
          [parent]: {
            ...prev.customer[parent],
            [child]: value,
          },
        },
      }));
    } else {
      setInvoice((prev) => ({
        ...prev,
        customer: {
          ...prev.customer,
          [field]: value,
        },
      }));
    }
  };

  const handleProductSelect = (index, product) => {
    if (product && typeof product === "object") {
      setInvoice((prev) => {
        const newItems = [...prev.items];
        newItems[index] = {
          ...newItems[index],
          productId: product.id,
          name: product.name,
          specification:
            product.specifications?.standard || product.grade || "",
          hsnCode: getHSNCodeForProduct(product),
          unit: product.unit,
          rate: product.selling_price || 0,
          amount: calculateItemAmount(
            newItems[index].quantity,
            product.selling_price || 0
          ),
        };

        return {
          ...prev,
          items: newItems,
        };
      });

      // Clear search input for this row
      setSearchInputs((prev) => ({ ...prev, [index]: "" }));
    }
  };

  const handleSearchInputChange = (index, value) => {
    setSearchInputs((prev) => ({ ...prev, [index]: value }));

    // Update the item name as user types
    setInvoice((prev) => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        name: value,
        productId: null, // Clear product ID when typing custom name
      };
      return {
        ...prev,
        items: newItems,
      };
    });
  };

  const isProductExisting = (index) => {
    const searchValue = searchInputs[index] || "";
    const products = productsData?.products || [];
    return products.some(
      (product) => product.name.toLowerCase() === searchValue.toLowerCase()
    );
  };

  const getHSNCodeForProduct = (product) => {
    // Map product categories to common HSN codes for steel products
    const hsnMap = {
      rebar: "7214",
      structural: "7216",
      sheet: "7209",
      pipe: "7306",
      angle: "7216",
      round: "7214",
      flat: "7214",
      wire: "7217",
    };
    return hsnMap[product.category] || "7214";
  };

  const handleItemChange = (index, field, value) => {
    setInvoice((prev) => {
      const newItems = [...prev.items];
      newItems[index] = {
        ...newItems[index],
        [field]: value,
      };

      if (field === "quantity" || field === "rate") {
        newItems[index].amount = calculateItemAmount(
          newItems[index].quantity,
          newItems[index].rate
        );
      }

      return {
        ...prev,
        items: newItems,
      };
    });
  };

  const handleAddNewProduct = async () => {
    try {
      const productData = {
        name: newProductData.name,
        category: newProductData.category,
        grade: newProductData.grade,
        size: newProductData.size,
        weight: newProductData.weight,
        unit: newProductData.unit,
        description: newProductData.description,
        current_stock: newProductData.current_stock,
        min_stock: newProductData.min_stock,
        max_stock: newProductData.max_stock,
        cost_price: newProductData.cost_price,
        selling_price: newProductData.selling_price,
        supplier: newProductData.supplier,
        location: newProductData.location,
        specifications: newProductData.specifications,
      };

      const newProduct = await createProduct(productData);

      // Refresh products list
      await refetchProducts();

      // Auto-select the new product for the current row
      if (selectedProductForRow >= 0) {
        handleProductSelect(selectedProductForRow, newProduct.id);
      }

      // Reset form and close modal
      setNewProductData({
        name: "",
        category: "rebar",
        grade: "",
        size: "",
        weight: "",
        unit: "kg",
        description: "",
        current_stock: 0,
        min_stock: 10,
        max_stock: 1000,
        cost_price: 0,
        selling_price: 0,
        supplier: "",
        location: "",
        specifications: {
          length: "",
          width: "",
          thickness: "",
          diameter: "",
          tensileStrength: "",
          yieldStrength: "",
          carbonContent: "",
          coating: "",
          standard: "",
        },
      });
      setShowAddProductModal(false);
      setSelectedProductForRow(-1);

      alert("Product added successfully!");
    } catch (error) {
      console.error("Error adding product:", error);
      alert("Failed to add product. Please try again.");
    }
  };

  const openAddProductModal = (rowIndex, productName = "") => {
    setSelectedProductForRow(rowIndex);
    setNewProductData((prev) => ({ ...prev, name: productName }));
    setShowAddProductModal(true);
  };

  const getProductOptions = () => {
    return (productsData?.products || []).map((product) => ({
      ...product,
      label: product.name,
      subtitle: `${product.category} • ${product.grade || "N/A"} • ₹${
        product.selling_price || 0
      }/${product.unit}`,
    }));
  };

  const categories = [
    { value: "rebar", label: "Rebar & Reinforcement" },
    { value: "structural", label: "Structural Steel" },
    { value: "sheet", label: "Steel Sheets" },
    { value: "pipe", label: "Pipes & Tubes" },
    { value: "angle", label: "Angles & Channels" },
    { value: "round", label: "Round Bars" },
    { value: "flat", label: "Flat Bars" },
    { value: "wire", label: "Wire & Mesh" },
  ];

  const grades = [
    "Fe415",
    "Fe500",
    "Fe550",
    "Fe600",
    "IS2062",
    "ASTM A36",
    "ASTM A572",
    "SS304",
    "SS316",
    "MS",
    "Galvanized",
  ];

  const addItem = () => {
    setInvoice((prev) => ({
      ...prev,
      items: [...prev.items, createSteelItem()],
    }));
  };

  const removeItem = (index) => {
    setInvoice((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async () => {
    try {
      if (id) {
        // Update existing invoice
        const updatedInvoice = await updateInvoice(invoice.id, invoice);
        if (onSave) onSave(updatedInvoice);
        alert("Invoice updated successfully!");
      } else {
        // Create new invoice
        const newInvoice = await saveInvoice(invoice);
        if (onSave) onSave(newInvoice);
        alert("Invoice saved successfully!");
      }
    } catch (error) {
      console.error("Error saving invoice:", error);
      alert("Failed to save invoice. Please try again.");
    }
  };

  const handleDownloadPDF = async () => {
    if (!company) {
      alert("Company data is still loading. Please wait...");
      return;
    }

    setIsGeneratingPDF(true);

    try {
      await generateInvoicePDF(invoice, company);
    } catch (error) {
      alert(error.message);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Mobile Item Card Component
  const MobileItemCard = ({ item, index }) => (
    <Card sx={{ mb: 2, border: 1, borderColor: "divider" }}>
      <CardContent sx={{ p: 2 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 2,
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Item #{index + 1}
          </Typography>
          <IconButton
            onClick={() => removeItem(index)}
            disabled={invoice.items.length === 1}
            color="error"
            size="small"
          >
            <Trash2 size={16} />
          </IconButton>
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <Autocomplete
            size="small"
            options={getProductOptions()}
            getOptionLabel={(option) =>
              typeof option === "string" ? option : option.name
            }
            value={
              item.productId
                ? getProductOptions().find((p) => p.id === item.productId)
                : null
            }
            inputValue={searchInputs[index] || item.name || ""}
            onInputChange={(event, newInputValue) => {
              handleSearchInputChange(index, newInputValue);
            }}
            onChange={(event, newValue) => {
              if (newValue) {
                handleProductSelect(index, newValue);
              }
            }}
            filterOptions={(options, { inputValue }) => {
              const filtered = options.filter(
                (option) =>
                  option.name
                    .toLowerCase()
                    .includes(inputValue.toLowerCase()) ||
                  option.category
                    .toLowerCase()
                    .includes(inputValue.toLowerCase()) ||
                  (option.grade &&
                    option.grade
                      .toLowerCase()
                      .includes(inputValue.toLowerCase()))
              );
              return filtered;
            }}
            freeSolo
            disabled={loadingProducts}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Product"
                placeholder="Search products..."
                size="small"
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      {(searchInputs[index] || item.name) &&
                        !item.productId &&
                        !isProductExisting(index) && (
                          <IconButton
                            size="small"
                            onClick={() =>
                              openAddProductModal(
                                index,
                                searchInputs[index] || item.name
                              )
                            }
                            color="primary"
                            title="Add as new product"
                            sx={{ mr: 1 }}
                          >
                            <Plus size={16} />
                          </IconButton>
                        )}
                      {params.InputProps.endAdornment}
                    </Box>
                  ),
                }}
              />
            )}
            renderOption={(props, option) => {
              const { key, ...optionProps } = props;
              return (
                <Box component="li" key={key} {...optionProps}>
                  <Box
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {option.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.subtitle}
                    </Typography>
                  </Box>
                </Box>
              );
            }}
            noOptionsText={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 1 }}>
                <Typography variant="body2" color="text.secondary">
                  No products found
                </Typography>
                {(searchInputs[index] || item.name) && (
                  <Button
                    size="small"
                    startIcon={<Plus size={16} />}
                    onClick={() =>
                      openAddProductModal(
                        index,
                        searchInputs[index] || item.name
                      )
                    }
                  >
                    Add "{searchInputs[index] || item.name}"
                  </Button>
                )}
              </Box>
            }
          />

          <TextField
            size="small"
            label="Specification"
            value={item.specification}
            onChange={(e) =>
              handleItemChange(index, "specification", e.target.value)
            }
            placeholder="e.g., 12mm dia"
            multiline
            maxRows={2}
          />

          <TextField
            size="small"
            label="Description"
            value={item.description || ""}
            onChange={(e) =>
              handleItemChange(index, "description", e.target.value)
            }
            placeholder="Additional description"
            multiline
            maxRows={2}
          />

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
            <TextField
              size="small"
              label="HSN Code"
              value={item.hsnCode}
              onChange={(e) =>
                handleItemChange(index, "hsnCode", e.target.value)
              }
              placeholder="HSN"
            />
            <FormControl size="small">
              <InputLabel>Unit</InputLabel>
              <Select
                value={item.unit}
                label="Unit"
                onChange={(e) =>
                  handleItemChange(index, "unit", e.target.value)
                }
              >
                {STEEL_UNITS.map((unit) => (
                  <MenuItem key={unit} value={unit}>
                    {unit}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box
            sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1 }}
          >
            <TextField
              size="small"
              label="Qty"
              type="number"
              value={item.quantity}
              onChange={(e) =>
                handleItemChange(
                  index,
                  "quantity",
                  parseFloat(e.target.value) || 0
                )
              }
              inputProps={{ min: 0, step: 0.01 }}
            />
            <TextField
              size="small"
              label="Rate"
              type="number"
              value={item.rate}
              onChange={(e) =>
                handleItemChange(index, "rate", parseFloat(e.target.value) || 0)
              }
              inputProps={{ min: 0, step: 0.01 }}
            />
            <TextField
              size="small"
              label="VAT %"
              type="number"
              value={item.gstRate}
              onChange={(e) =>
                handleItemChange(
                  index,
                  "gstRate",
                  parseFloat(e.target.value) || 0
                )
              }
              inputProps={{ min: 0, max: 100 }}
            />
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 1 }}>
            <TextField
              size="small"
              label="Discount"
              type="number"
              value={item.discount || 0}
              onChange={(e) =>
                handleItemChange(
                  index,
                  "discount",
                  parseFloat(e.target.value) || 0
                )
              }
              inputProps={{ min: 0, step: 0.01 }}
            />
            <FormControl size="small">
              <InputLabel>Type</InputLabel>
              <Select
                value={item.discountType || "amount"}
                label="Type"
                onChange={(e) =>
                  handleItemChange(index, "discountType", e.target.value)
                }
              >
                {DISCOUNT_TYPES.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type === "amount" ? "₹" : "%"}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              p: 1,
              bgcolor: "background.default",
              borderRadius: 1,
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Amount: {formatCurrency(item.amount)}
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  if (showPreview) {
    return (
      <InvoicePreview
        invoice={invoice}
        company={company || {}}
        onClose={() => setShowPreview(false)}
      />
    );
  }

  if (loadingInvoice) {
    return (
      <InvoiceContainer>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: 400,
          }}
        >
          <CircularProgress size={40} />
          <Typography variant="body1" sx={{ ml: 2 }}>
            Loading invoice...
          </Typography>
        </Box>
      </InvoiceContainer>
    );
  }

  return (
    <InvoiceContainer>
      <Container maxWidth={false} sx={{ p: 0, width: "100%" }}>
        <InvoiceFormPaper>
          {/* Header */}
          <Box
            sx={{
              display: "flex",
              flexDirection: isSmallScreen ? "column" : "row",
              justifyContent: "space-between",
              alignItems: isSmallScreen ? "stretch" : "center",
              mb: 3,
              pb: 2,
              borderBottom: 1,
              borderColor: "divider",
              gap: 2,
            }}
          >
            <Typography
              variant={isSmallScreen ? "h5" : "h4"}
              component="h1"
              sx={{ fontWeight: 600, color: "text.primary" }}
            >
              {id ? "Edit Invoice" : "Create Invoice"}
            </Typography>
            <HeaderActions>
              <Button
                onClick={() => {
                  if (!company) {
                    alert("Company data is still loading. Please wait...");
                    return;
                  }
                  setShowPreview(true);
                }}
                variant="outlined"
                startIcon={<Eye size={18} />}
                disabled={loadingCompany}
                size={isSmallScreen ? "medium" : "medium"}
                fullWidth={isSmallScreen}
                sx={{ borderRadius: 2 }}
              >
                Preview
              </Button>
              <Button
                onClick={handleDownloadPDF}
                variant="outlined"
                startIcon={
                  isGeneratingPDF ? (
                    <CircularProgress size={18} />
                  ) : (
                    <Download size={18} />
                  )
                }
                disabled={isGeneratingPDF || loadingCompany}
                size={isSmallScreen ? "medium" : "medium"}
                fullWidth={isSmallScreen}
                sx={{ borderRadius: 2 }}
              >
                {isGeneratingPDF ? "Generating..." : "Download PDF"}
              </Button>
              <Button
                onClick={handleSave}
                variant="contained"
                startIcon={
                  savingInvoice || updatingInvoice ? (
                    <CircularProgress size={18} />
                  ) : (
                    <Save size={18} />
                  )
                }
                disabled={savingInvoice || updatingInvoice}
                size={isSmallScreen ? "medium" : "medium"}
                fullWidth={isSmallScreen}
                sx={{ borderRadius: 2 }}
              >
                {savingInvoice || updatingInvoice
                  ? "Saving..."
                  : "Save Invoice"}
              </Button>
            </HeaderActions>
          </Box>

          {/* Form Grid */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 3 }}>
            {/* Invoice Details */}
            <Box>
              <SectionCard>
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <SectionHeader variant="h6">📄 Invoice Details</SectionHeader>
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                  >
                    <TextField
                      label="Invoice Number"
                      variant="outlined"
                      fullWidth
                      size={isSmallScreen ? "small" : "medium"}
                      value={invoice.invoiceNumber}
                      onChange={(e) =>
                        setInvoice((prev) => ({
                          ...prev,
                          invoiceNumber: e.target.value,
                        }))
                      }
                    />
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                      <Box>
                        <TextField
                          label="Date"
                          type="date"
                          variant="outlined"
                          fullWidth
                          size={isSmallScreen ? "small" : "medium"}
                          value={invoice.date}
                          onChange={(e) =>
                            setInvoice((prev) => ({
                              ...prev,
                              date: e.target.value,
                            }))
                          }
                          InputLabelProps={{ shrink: true }}
                        />
                      </Box>
                      <Box>
                        <TextField
                          label="Due Date"
                          type="date"
                          variant="outlined"
                          fullWidth
                          size={isSmallScreen ? "small" : "medium"}
                          value={invoice.dueDate}
                          onChange={(e) =>
                            setInvoice((prev) => ({
                              ...prev,
                              dueDate: e.target.value,
                            }))
                          }
                          InputLabelProps={{ shrink: true }}
                        />
                      </Box>
                    </Box>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                      <Box>
                        <TextField
                          label="Purchase Order Number"
                          variant="outlined"
                          fullWidth
                          size={isSmallScreen ? "small" : "medium"}
                          value={invoice.purchaseOrderNumber || ""}
                          onChange={(e) =>
                            setInvoice((prev) => ({
                              ...prev,
                              purchaseOrderNumber: e.target.value,
                            }))
                          }
                          placeholder="PO Number (Optional)"
                          helperText="Can be added later if not available now"
                        />
                      </Box>
                      <Box>
                        <TextField
                          label="PO Date"
                          type="date"
                          variant="outlined"
                          fullWidth
                          size={isSmallScreen ? "small" : "medium"}
                          value={invoice.purchaseOrderDate || ""}
                          onChange={(e) =>
                            setInvoice((prev) => ({
                              ...prev,
                              purchaseOrderDate: e.target.value,
                            }))
                          }
                          InputLabelProps={{ shrink: true }}
                          helperText="Optional - link to PO later if needed"
                        />
                      </Box>
                    </Box>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                      <Box>
                        <TextField
                          label="Delivery Note"
                          variant="outlined"
                          fullWidth
                          size={isSmallScreen ? "small" : "medium"}
                          value={invoice.deliveryNote || ""}
                          onChange={(e) =>
                            setInvoice((prev) => ({
                              ...prev,
                              deliveryNote: e.target.value,
                            }))
                          }
                          placeholder="Delivery challan reference"
                        />
                      </Box>
                      <Box>
                        <FormControl
                          fullWidth
                          size={isSmallScreen ? "small" : "medium"}
                        >
                          <InputLabel>Mode of Payment</InputLabel>
                          <Select
                            value={invoice.modeOfPayment || ""}
                            label="Mode of Payment"
                            onChange={(e) =>
                              setInvoice((prev) => ({
                                ...prev,
                                modeOfPayment: e.target.value,
                              }))
                            }
                          >
                            <MenuItem value="">
                              <em>Select payment mode</em>
                            </MenuItem>
                            {PAYMENT_MODES.map((mode) => (
                              <MenuItem key={mode} value={mode}>
                                {mode}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </SectionCard>
            </Box>

            {/* Customer Details */}
            <Box>
              <SectionCard>
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <SectionHeader variant="h6">
                    👤 Customer Details
                  </SectionHeader>
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                  >
                    <FormControl
                      fullWidth
                      size={isSmallScreen ? "small" : "medium"}
                    >
                      <InputLabel>Select Customer</InputLabel>
                      <Select
                        value={invoice.customer.id || ""}
                        label="Select Customer"
                        onChange={(e) => handleCustomerSelect(e.target.value)}
                        disabled={loadingCustomers}
                      >
                        <MenuItem value="">
                          <em>Select a customer</em>
                        </MenuItem>
                        {(customersData?.customers || []).map((customer) => (
                          <MenuItem key={customer.id} value={customer.id}>
                            <Box
                              sx={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "flex-start",
                              }}
                            >
                              <Typography variant="body2">
                                {customer.name}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {customer.company && `${customer.company} • `}
                                {customer.email}
                              </Typography>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    {/* Display selected customer details */}
                    {invoice.customer.name && (
                      <Box
                        sx={{
                          p: 2,
                          bgcolor: "background.default",
                          borderRadius: 1,
                          border: 1,
                          borderColor: "divider",
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{ mb: 1, fontWeight: 600 }}
                        >
                          Selected Customer:
                        </Typography>
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                          <strong>Name:</strong> {invoice.customer.name}
                        </Typography>
                        {invoice.customer.email && (
                          <Typography variant="body2" sx={{ mb: 0.5 }}>
                            <strong>Email:</strong> {invoice.customer.email}
                          </Typography>
                        )}
                        {invoice.customer.phone && (
                          <Typography variant="body2" sx={{ mb: 0.5 }}>
                            <strong>Phone:</strong> {invoice.customer.phone}
                          </Typography>
                        )}
                        {invoice.customer.vatNumber && (
                          <Typography variant="body2" sx={{ mb: 0.5 }}>
                            <strong>VAT:</strong> {invoice.customer.vatNumber}
                          </Typography>
                        )}
                        {(invoice.customer.address.street ||
                          invoice.customer.address.city) && (
                          <Typography variant="body2">
                            <strong>Address:</strong>{" "}
                            {[
                              invoice.customer.address.street,
                              invoice.customer.address.city,
                              invoice.customer.address.emirate,
                              invoice.customer.address.poBox,
                            ]
                              .filter(Boolean)
                              .join(", ")}
                          </Typography>
                        )}
                      </Box>
                    )}

                    {/* Trade License Status Alert */}
                    <Collapse in={showTradeLicenseAlert}>
                      <Alert 
                        severity={tradeLicenseStatus?.severity || 'warning'}
                        sx={{ mt: 2 }}
                        onClose={() => setShowTradeLicenseAlert(false)}
                      >
                        <AlertTitle>Trade License Alert</AlertTitle>
                        {tradeLicenseStatus?.message}
                        {tradeLicenseStatus?.licenseNumber && (
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            <strong>License Number:</strong> {tradeLicenseStatus.licenseNumber}
                          </Typography>
                        )}
                        {tradeLicenseStatus?.expiryDate && (
                          <Typography variant="body2">
                            <strong>Expiry Date:</strong> {new Date(tradeLicenseStatus.expiryDate).toLocaleDateString()}
                          </Typography>
                        )}
                      </Alert>
                    </Collapse>

                    {loadingCustomers && (
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1, mt: 2 }}
                      >
                        <CircularProgress size={16} />
                        <Typography variant="body2" color="text.secondary">
                          Loading customers...
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </SectionCard>
            </Box>
          </Box>

          {/* Transport & Delivery Details */}
          <SectionCard sx={{ mb: 3 }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <SectionHeader variant="h6">
                🚚 Transport & Delivery Details
              </SectionHeader>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <Box>
                  <TextField
                    label="Despatched Through"
                    variant="outlined"
                    fullWidth
                    size={isSmallScreen ? "small" : "medium"}
                    value={invoice.despatchedThrough || ""}
                    onChange={(e) =>
                      setInvoice((prev) => ({
                        ...prev,
                        despatchedThrough: e.target.value,
                      }))
                    }
                    placeholder="Transport company/agent"
                  />
                </Box>
                <Box>
                  <TextField
                    label="Destination"
                    variant="outlined"
                    fullWidth
                    size={isSmallScreen ? "small" : "medium"}
                    value={invoice.destination || ""}
                    onChange={(e) =>
                      setInvoice((prev) => ({
                        ...prev,
                        destination: e.target.value,
                      }))
                    }
                    placeholder="Delivery destination"
                  />
                </Box>
                <Box>
                  <FormControl
                    fullWidth
                    size={isSmallScreen ? "small" : "medium"}
                  >
                    <InputLabel>Terms of Delivery</InputLabel>
                    <Select
                      value={invoice.termsOfDelivery || ""}
                      label="Terms of Delivery"
                      onChange={(e) =>
                        setInvoice((prev) => ({
                          ...prev,
                          termsOfDelivery: e.target.value,
                        }))
                      }
                    >
                      <MenuItem value="">
                        <em>Select delivery terms</em>
                      </MenuItem>
                      {DELIVERY_TERMS.map((term) => (
                        <MenuItem key={term} value={term}>
                          {term}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
                <Box>
                  <TextField
                    label="Other Reference"
                    variant="outlined"
                    fullWidth
                    size={isSmallScreen ? "small" : "medium"}
                    value={invoice.otherReference || ""}
                    onChange={(e) =>
                      setInvoice((prev) => ({
                        ...prev,
                        otherReference: e.target.value,
                      }))
                    }
                    placeholder="Additional reference"
                  />
                </Box>
              </Box>
            </CardContent>
          </SectionCard>

          {/* Items Section */}
          <SectionCard sx={{ mb: 3 }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: isSmallScreen ? "column" : "row",
                  justifyContent: "space-between",
                  alignItems: isSmallScreen ? "stretch" : "center",
                  mb: 3,
                  gap: 2,
                }}
              >
                <SectionHeader variant="h6">🏗️ Steel Items</SectionHeader>
                <Button
                  onClick={addItem}
                  variant="contained"
                  startIcon={<Plus size={18} />}
                  size={isSmallScreen ? "medium" : "medium"}
                  fullWidth={isSmallScreen}
                  sx={{
                    borderRadius: 2,
                    maxWidth: isSmallScreen ? "none" : "200px",
                  }}
                >
                  Add Item
                </Button>
              </Box>

              {/* Mobile View - Cards */}
              <MobileTableContainer>
                {invoice.items.map((item, index) => (
                  <MobileItemCard key={item.id} item={item} index={index} />
                ))}
              </MobileTableContainer>

              {/* Desktop View - Table */}
              <DesktopTableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ minWidth: 200 }}>
                        Product Selection
                      </TableCell>
                      <TableCell sx={{ minWidth: 150 }}>
                        Specification
                      </TableCell>
                      <TableCell sx={{ minWidth: 120 }}>Description</TableCell>
                      <TableCell>HSN Code</TableCell>
                      <TableCell>Unit</TableCell>
                      <TableCell>Qty</TableCell>
                      <TableCell>Rate</TableCell>
                      <TableCell>Discount</TableCell>
                      <TableCell>VAT %</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoice.items.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell sx={{ minWidth: 200 }}>
                          <Autocomplete
                            size="small"
                            options={getProductOptions()}
                            getOptionLabel={(option) =>
                              typeof option === "string" ? option : option.name
                            }
                            value={
                              item.productId
                                ? getProductOptions().find(
                                    (p) => p.id === item.productId
                                  )
                                : null
                            }
                            inputValue={searchInputs[index] || item.name || ""}
                            onInputChange={(event, newInputValue) => {
                              handleSearchInputChange(index, newInputValue);
                            }}
                            onChange={(event, newValue) => {
                              if (newValue) {
                                handleProductSelect(index, newValue);
                              }
                            }}
                            filterOptions={(options, { inputValue }) => {
                              const filtered = options.filter(
                                (option) =>
                                  option.name
                                    .toLowerCase()
                                    .includes(inputValue.toLowerCase()) ||
                                  option.category
                                    .toLowerCase()
                                    .includes(inputValue.toLowerCase()) ||
                                  (option.grade &&
                                    option.grade
                                      .toLowerCase()
                                      .includes(inputValue.toLowerCase()))
                              );
                              return filtered;
                            }}
                            freeSolo
                            disabled={loadingProducts}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Search or select product"
                                placeholder="Type to search products..."
                                InputProps={{
                                  ...params.InputProps,
                                  endAdornment: (
                                    <Box
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                      }}
                                    >
                                      {(searchInputs[index] || item.name) &&
                                        !item.productId &&
                                        !isProductExisting(index) && (
                                          <IconButton
                                            size="small"
                                            onClick={() =>
                                              openAddProductModal(
                                                index,
                                                searchInputs[index] || item.name
                                              )
                                            }
                                            color="primary"
                                            title="Add as new product"
                                            sx={{ mr: 1 }}
                                          >
                                            <Plus size={16} />
                                          </IconButton>
                                        )}
                                      {params.InputProps.endAdornment}
                                    </Box>
                                  ),
                                }}
                              />
                            )}
                            renderOption={(props, option) => {
                              const { key, ...optionProps } = props;
                              return (
                                <Box component="li" key={key} {...optionProps}>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      flexDirection: "column",
                                      alignItems: "flex-start",
                                    }}
                                  >
                                    <Typography
                                      variant="body2"
                                      sx={{ fontWeight: 500 }}
                                    >
                                      {option.name}
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      {option.subtitle}
                                    </Typography>
                                  </Box>
                                </Box>
                              );
                            }}
                            noOptionsText={
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                  p: 1,
                                }}
                              >
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  No products found
                                </Typography>
                                {(searchInputs[index] || item.name) && (
                                  <Button
                                    size="small"
                                    startIcon={<Plus size={16} />}
                                    onClick={() =>
                                      openAddProductModal(
                                        index,
                                        searchInputs[index] || item.name
                                      )
                                    }
                                  >
                                    Add "{searchInputs[index] || item.name}"
                                  </Button>
                                )}
                              </Box>
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            value={item.specification}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "specification",
                                e.target.value
                              )
                            }
                            placeholder="e.g., 12mm dia"
                            multiline
                            maxRows={2}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            value={item.description || ""}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "description",
                                e.target.value
                              )
                            }
                            placeholder="Description"
                            multiline
                            maxRows={2}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            value={item.hsnCode}
                            onChange={(e) =>
                              handleItemChange(index, "hsnCode", e.target.value)
                            }
                            placeholder="HSN Code"
                          />
                        </TableCell>
                        <TableCell>
                          <FormControl size="small" sx={{ minWidth: 80 }}>
                            <Select
                              value={item.unit}
                              onChange={(e) =>
                                handleItemChange(index, "unit", e.target.value)
                              }
                            >
                              {STEEL_UNITS.map((unit) => (
                                <MenuItem key={unit} value={unit}>
                                  {unit}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "quantity",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            inputProps={{ min: 0, step: 0.01 }}
                            sx={{ width: 80 }}
                          />
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={item.rate}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "rate",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            inputProps={{ min: 0, step: 0.01 }}
                            sx={{ width: 80 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 1,
                            }}
                          >
                            <TextField
                              size="small"
                              type="number"
                              value={item.discount || 0}
                              onChange={(e) =>
                                handleItemChange(
                                  index,
                                  "discount",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              inputProps={{ min: 0, step: 0.01 }}
                              sx={{ width: 70 }}
                              placeholder="0"
                            />
                            <FormControl size="small" sx={{ minWidth: 60 }}>
                              <Select
                                value={item.discountType || "amount"}
                                onChange={(e) =>
                                  handleItemChange(
                                    index,
                                    "discountType",
                                    e.target.value
                                  )
                                }
                                displayEmpty
                              >
                                <MenuItem value="amount">₹</MenuItem>
                                <MenuItem value="percentage">%</MenuItem>
                              </Select>
                            </FormControl>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <TextField
                            size="small"
                            type="number"
                            value={item.gstRate}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "gstRate",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            inputProps={{ min: 0, max: 100 }}
                            sx={{ width: 60 }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {formatCurrency(item.amount)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <IconButton
                            onClick={() => removeItem(index)}
                            disabled={invoice.items.length === 1}
                            color="error"
                            size="small"
                          >
                            <Trash2 size={16} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </DesktopTableContainer>
            </CardContent>
          </SectionCard>

          {/* Summary and Notes */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            <Box>
              <SectionCard>
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <SectionHeader variant="h6">📝 Notes</SectionHeader>
                  <TextField
                    multiline
                    rows={4}
                    fullWidth
                    size={isSmallScreen ? "small" : "medium"}
                    value={invoice.notes}
                    onChange={(e) =>
                      setInvoice((prev) => ({ ...prev, notes: e.target.value }))
                    }
                    placeholder="Additional notes..."
                    variant="outlined"
                  />
                </CardContent>
              </SectionCard>
            </Box>
            <Box>
              <SectionCard>
                <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                  <SectionHeader variant="h6">💰 Invoice Summary</SectionHeader>
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Typography variant="body1">Subtotal:</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {formatCurrency(invoice.subtotal)}
                      </Typography>
                    </Box>

                    {/* Additional Charges Section */}
                    <Box
                      sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                    >
                      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                        <Box>
                          <TextField
                            size="small"
                            label="Packing Charges"
                            type="number"
                            value={invoice.packingCharges || 0}
                            onChange={(e) =>
                              setInvoice((prev) => ({
                                ...prev,
                                packingCharges: parseFloat(e.target.value) || 0,
                              }))
                            }
                            inputProps={{ min: 0, step: 0.01 }}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  ₹
                                </InputAdornment>
                              ),
                            }}
                          />
                        </Box>
                        <Box>
                          <TextField
                            size="small"
                            label="Freight Charges"
                            type="number"
                            value={invoice.freightCharges || 0}
                            onChange={(e) =>
                              setInvoice((prev) => ({
                                ...prev,
                                freightCharges: parseFloat(e.target.value) || 0,
                              }))
                            }
                            inputProps={{ min: 0, step: 0.01 }}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  ₹
                                </InputAdornment>
                              ),
                            }}
                          />
                        </Box>
                        <Box>
                          <TextField
                            size="small"
                            label="Loading Charges"
                            type="number"
                            value={invoice.loadingCharges || 0}
                            onChange={(e) =>
                              setInvoice((prev) => ({
                                ...prev,
                                loadingCharges: parseFloat(e.target.value) || 0,
                              }))
                            }
                            inputProps={{ min: 0, step: 0.01 }}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  ₹
                                </InputAdornment>
                              ),
                            }}
                          />
                        </Box>
                        <Box>
                          <TextField
                            size="small"
                            label="Other Charges"
                            type="number"
                            value={invoice.otherCharges || 0}
                            onChange={(e) =>
                              setInvoice((prev) => ({
                                ...prev,
                                otherCharges: parseFloat(e.target.value) || 0,
                              }))
                            }
                            inputProps={{ min: 0, step: 0.01 }}
                            InputProps={{
                              startAdornment: (
                                <InputAdornment position="start">
                                  ₹
                                </InputAdornment>
                              ),
                            }}
                          />
                        </Box>
                      </Box>
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Typography variant="body1">VAT Amount:</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {formatCurrency(invoice.gstAmount)}
                      </Typography>
                    </Box>

                    <Divider />

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>
                        Total:
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 700, color: "primary.main" }}
                      >
                        {formatCurrency(invoice.total)}
                      </Typography>
                    </Box>

                    {/* Advance and Balance */}
                    <Box
                      sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                    >
                      <TextField
                        size="small"
                        label="Advance Received"
                        type="number"
                        value={invoice.advanceReceived || 0}
                        onChange={(e) =>
                          setInvoice((prev) => ({
                            ...prev,
                            advanceReceived: parseFloat(e.target.value) || 0,
                          }))
                        }
                        inputProps={{ min: 0, step: 0.01 }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">₹</InputAdornment>
                          ),
                        }}
                      />
                      {invoice.advanceReceived > 0 && (
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            p: 1,
                            bgcolor: "primary.50",
                            borderRadius: 1,
                          }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            Balance Amount:
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 600, color: "primary.main" }}
                          >
                            {formatCurrency(
                              Math.max(
                                0,
                                invoice.total - (invoice.advanceReceived || 0)
                              )
                            )}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </SectionCard>
            </Box>
          </Box>

          {/* Terms & Conditions */}
          <SectionCard sx={{ mt: 3 }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <SectionHeader variant="h6">📋 Terms & Conditions</SectionHeader>
              <TextField
                multiline
                rows={3}
                fullWidth
                size={isSmallScreen ? "small" : "medium"}
                value={invoice.terms}
                onChange={(e) =>
                  setInvoice((prev) => ({ ...prev, terms: e.target.value }))
                }
                placeholder="Payment terms and conditions..."
                variant="outlined"
              />
            </CardContent>
          </SectionCard>

          {/* Add New Product Modal */}
          <Dialog
            open={showAddProductModal}
            onClose={() => setShowAddProductModal(false)}
            maxWidth="md"
            fullWidth
            fullScreen={isSmallScreen}
          >
            <DialogTitle>
              <Typography variant="h6">Add New Product</Typography>
            </DialogTitle>
            <DialogContent sx={{ pt: 2, px: { xs: 2, sm: 3 } }}>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                {/* Basic Information */}
                <Box>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ color: "primary.main", mb: 2 }}
                  >
                    Basic Information
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                    <Box>
                      <TextField
                        label="Product Name *"
                        value={newProductData.name}
                        onChange={(e) =>
                          setNewProductData((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        fullWidth
                        size={isSmallScreen ? "small" : "medium"}
                        placeholder="Enter product name"
                      />
                    </Box>
                    <Box>
                      <FormControl
                        fullWidth
                        size={isSmallScreen ? "small" : "medium"}
                      >
                        <InputLabel>Category</InputLabel>
                        <Select
                          value={newProductData.category}
                          label="Category"
                          onChange={(e) =>
                            setNewProductData((prev) => ({
                              ...prev,
                              category: e.target.value,
                            }))
                          }
                        >
                          {categories.map((cat) => (
                            <MenuItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Box>
                    <Box>
                      <Autocomplete
                        freeSolo
                        options={grades}
                        value={newProductData.grade}
                        onInputChange={(event, newValue) => {
                          setNewProductData((prev) => ({
                            ...prev,
                            grade: newValue || "",
                          }));
                        }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Grade"
                            placeholder="Enter grade (e.g., Fe415)"
                            size={isSmallScreen ? "small" : "medium"}
                          />
                        )}
                      />
                    </Box>
                    <Box>
                      <TextField
                        label="Size"
                        value={newProductData.size}
                        onChange={(e) =>
                          setNewProductData((prev) => ({
                            ...prev,
                            size: e.target.value,
                          }))
                        }
                        fullWidth
                        size={isSmallScreen ? "small" : "medium"}
                        placeholder="e.g., 12mm, 50x50x6"
                      />
                    </Box>
                    <Box>
                      <TextField
                        label="Weight"
                        value={newProductData.weight}
                        onChange={(e) =>
                          setNewProductData((prev) => ({
                            ...prev,
                            weight: e.target.value,
                          }))
                        }
                        fullWidth
                        size={isSmallScreen ? "small" : "medium"}
                        placeholder="Enter weight"
                      />
                    </Box>
                    <Box>
                      <FormControl
                        fullWidth
                        size={isSmallScreen ? "small" : "medium"}
                      >
                        <InputLabel>Unit</InputLabel>
                        <Select
                          value={newProductData.unit}
                          label="Unit"
                          onChange={(e) =>
                            setNewProductData((prev) => ({
                              ...prev,
                              unit: e.target.value,
                            }))
                          }
                        >
                          <MenuItem value="kg">kg</MenuItem>
                          <MenuItem value="kg/m">kg/m</MenuItem>
                          <MenuItem value="kg/sheet">kg/sheet</MenuItem>
                          <MenuItem value="tonnes">tonnes</MenuItem>
                          <MenuItem value="pieces">pieces</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                    <Box>
                      <TextField
                        label="Description"
                        value={newProductData.description}
                        onChange={(e) =>
                          setNewProductData((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        fullWidth
                        size={isSmallScreen ? "small" : "medium"}
                        placeholder="Enter product description"
                        multiline
                        rows={3}
                      />
                    </Box>
                  </Box>
                </Box>

                {/* Inventory Information */}
                <Box>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ color: "primary.main", mb: 2 }}
                  >
                    Inventory Information
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2 }}>
                    <Box>
                      <TextField
                        label="Current Stock"
                        type="number"
                        value={newProductData.current_stock}
                        onChange={(e) =>
                          setNewProductData((prev) => ({
                            ...prev,
                            current_stock: Number(e.target.value),
                          }))
                        }
                        fullWidth
                        size={isSmallScreen ? "small" : "medium"}
                        placeholder="Enter current stock"
                      />
                    </Box>
                    <Box>
                      <TextField
                        label="Minimum Stock"
                        type="number"
                        value={newProductData.min_stock}
                        onChange={(e) =>
                          setNewProductData((prev) => ({
                            ...prev,
                            min_stock: Number(e.target.value),
                          }))
                        }
                        fullWidth
                        size={isSmallScreen ? "small" : "medium"}
                        placeholder="Enter minimum stock level"
                      />
                    </Box>
                    <Box>
                      <TextField
                        label="Maximum Stock"
                        type="number"
                        value={newProductData.max_stock}
                        onChange={(e) =>
                          setNewProductData((prev) => ({
                            ...prev,
                            max_stock: Number(e.target.value),
                          }))
                        }
                        fullWidth
                        size={isSmallScreen ? "small" : "medium"}
                        placeholder="Enter maximum stock level"
                      />
                    </Box>
                  </Box>
                </Box>

                {/* Pricing Information */}
                <Box>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ color: "primary.main", mb: 2 }}
                  >
                    Pricing Information
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                    <Box>
                      <TextField
                        label="Cost Price"
                        type="number"
                        value={newProductData.cost_price}
                        onChange={(e) =>
                          setNewProductData((prev) => ({
                            ...prev,
                            cost_price: Number(e.target.value),
                          }))
                        }
                        fullWidth
                        size={isSmallScreen ? "small" : "medium"}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">₹</InputAdornment>
                          ),
                        }}
                        placeholder="Enter cost price"
                      />
                    </Box>
                    <Box>
                      <TextField
                        label="Selling Price"
                        type="number"
                        value={newProductData.selling_price}
                        onChange={(e) =>
                          setNewProductData((prev) => ({
                            ...prev,
                            selling_price: Number(e.target.value),
                          }))
                        }
                        fullWidth
                        size={isSmallScreen ? "small" : "medium"}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">₹</InputAdornment>
                          ),
                        }}
                        placeholder="Enter selling price"
                      />
                    </Box>
                  </Box>
                </Box>

                {/* Supplier & Location */}
                <Box>
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ color: "primary.main", mb: 2 }}
                  >
                    Supplier & Location
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                    <Box>
                      <TextField
                        label="Supplier"
                        value={newProductData.supplier}
                        onChange={(e) =>
                          setNewProductData((prev) => ({
                            ...prev,
                            supplier: e.target.value,
                          }))
                        }
                        fullWidth
                        size={isSmallScreen ? "small" : "medium"}
                        placeholder="Enter supplier name"
                      />
                    </Box>
                    <Box>
                      <TextField
                        label="Storage Location"
                        value={newProductData.location}
                        onChange={(e) =>
                          setNewProductData((prev) => ({
                            ...prev,
                            location: e.target.value,
                          }))
                        }
                        fullWidth
                        size={isSmallScreen ? "small" : "medium"}
                        placeholder="Enter storage location"
                      />
                    </Box>
                  </Box>
                </Box>
              </Box>
            </DialogContent>
            <DialogActions
              sx={{
                p: { xs: 2, sm: 3 },
                flexDirection: isSmallScreen ? "column" : "row",
                gap: 1,
              }}
            >
              <Button
                onClick={() => setShowAddProductModal(false)}
                fullWidth={isSmallScreen}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleAddNewProduct}
                disabled={creatingProduct || !newProductData.name}
                startIcon={
                  creatingProduct ? (
                    <CircularProgress size={16} />
                  ) : (
                    <Plus size={16} />
                  )
                }
                fullWidth={isSmallScreen}
              >
                {creatingProduct ? "Adding..." : "Add Product"}
              </Button>
            </DialogActions>
          </Dialog>
        </InvoiceFormPaper>
      </Container>
    </InvoiceContainer>
  );
};

export default InvoiceForm;
