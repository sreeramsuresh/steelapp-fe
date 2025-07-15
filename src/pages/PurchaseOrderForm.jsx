import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Plus, Trash2, Save, ArrowLeft } from "lucide-react";
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
  Alert,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import {
  formatCurrency,
  calculateItemAmount,
  calculateSubtotal,
  calculateTotal,
} from "../utils/invoiceUtils";

const PurchaseOrderContainer = styled(Box)(({ theme }) => ({
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

const PurchaseOrderFormPaper = styled(Paper)(({ theme }) => ({
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
  borderRadius: theme.spacing(2),
  boxShadow: theme.shadows[1],
  mb: 2,
}));

const PurchaseOrderForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [purchaseOrder, setPurchaseOrder] = useState({
    poNumber: "",
    supplierName: "",
    supplierEmail: "",
    supplierPhone: "",
    supplierAddress: "",
    poDate: new Date().toISOString().split("T")[0],
    expectedDeliveryDate: "",
    status: "draft",
    stockStatus: "retain", // Default to 'retain'
    items: [
      {
        name: "",
        specification: "",
        unit: "MT",
        quantity: 0,
        rate: 0,
        amount: 0,
      },
    ],
    subtotal: 0,
    vatAmount: 0,
    total: 0,
    notes: "",
    terms: "",
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (field, value) => {
    setPurchaseOrder((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...purchaseOrder.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };

    // Calculate amount when quantity or rate changes
    if (field === "quantity" || field === "rate") {
      const quantity =
        field === "quantity"
          ? parseFloat(value) || 0
          : updatedItems[index].quantity;
      const rate =
        field === "rate" ? parseFloat(value) || 0 : updatedItems[index].rate;
      updatedItems[index].amount = quantity * rate;
    }

    setPurchaseOrder((prev) => {
      const newPO = {
        ...prev,
        items: updatedItems,
      };

      // Recalculate totals
      const subtotal = calculateSubtotal(updatedItems);
      const vatAmount = subtotal * 0.05; // 5% VAT
      const total = subtotal + vatAmount;

      return {
        ...newPO,
        subtotal,
        vatAmount,
        total,
      };
    });
  };

  const addItem = () => {
    setPurchaseOrder((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          name: "",
          specification: "",
          unit: "MT",
          quantity: 0,
          rate: 0,
          amount: 0,
        },
      ],
    }));
  };

  const removeItem = (index) => {
    if (purchaseOrder.items.length > 1) {
      const updatedItems = purchaseOrder.items.filter((_, i) => i !== index);
      setPurchaseOrder((prev) => {
        const newPO = {
          ...prev,
          items: updatedItems,
        };

        // Recalculate totals
        const subtotal = calculateSubtotal(updatedItems);
        const vatAmount = subtotal * 0.05; // 5% VAT
        const total = subtotal + vatAmount;

        return {
          ...newPO,
          subtotal,
          vatAmount,
          total,
        };
      });
    }
  };

  const handleSubmit = async (status = "draft") => {
    setLoading(true);
    try {
      // TODO: Implement API call to save purchase order
      console.log("Saving purchase order:", { ...purchaseOrder, status });
      navigate("/purchase-orders");
    } catch (error) {
      console.error("Error saving purchase order:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PurchaseOrderContainer>
      <Container maxWidth="100%" sx={{ p: 0 }}>
        <PurchaseOrderFormPaper>
          {/* Header */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <IconButton
                onClick={() => navigate("/purchase-orders")}
                size="small"
              >
                <ArrowLeft size={20} />
              </IconButton>
              <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
                🛒 {id ? "Edit" : "Create"} Purchase Order
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => handleSubmit("draft")}
                disabled={loading}
                sx={{ borderRadius: 2 }}
              >
                Save Draft
              </Button>
              <Button
                variant="contained"
                onClick={() => handleSubmit("pending")}
                disabled={loading}
                startIcon={<Save size={18} />}
                sx={{ borderRadius: 2 }}
              >
                Submit PO
              </Button>
            </Box>
          </Box>

          <Grid container spacing={3}>
            {/* PO Details */}
            <Grid size={{ xs: 12, md: 6 }}>
              <SectionCard>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Purchase Order Details
                  </Typography>
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                  >
                    <TextField
                      label="PO Number"
                      value={purchaseOrder.poNumber}
                      onChange={(e) =>
                        handleInputChange("poNumber", e.target.value)
                      }
                      placeholder="PO-2024-001"
                      fullWidth
                    />
                    <TextField
                      label="PO Date"
                      type="date"
                      value={purchaseOrder.poDate}
                      onChange={(e) =>
                        handleInputChange("poDate", e.target.value)
                      }
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      label="Expected Delivery Date"
                      type="date"
                      value={purchaseOrder.expectedDeliveryDate}
                      onChange={(e) =>
                        handleInputChange(
                          "expectedDeliveryDate",
                          e.target.value
                        )
                      }
                      fullWidth
                      InputLabelProps={{ shrink: true }}
                    />
                    <FormControl fullWidth>
                      <InputLabel>Status</InputLabel>
                      <Select
                        value={purchaseOrder.status}
                        onChange={(e) =>
                          handleInputChange("status", e.target.value)
                        }
                        label="Status"
                      >
                        <MenuItem value="draft">Draft</MenuItem>
                        <MenuItem value="pending">Pending</MenuItem>
                        <MenuItem value="confirmed">Confirmed</MenuItem>
                        <MenuItem value="received">Received</MenuItem>
                      </Select>
                    </FormControl>
                    <FormControl fullWidth>
                      <InputLabel>Stock Status</InputLabel>
                      <Select
                        value={purchaseOrder.stockStatus}
                        onChange={(e) =>
                          handleInputChange("stockStatus", e.target.value)
                        }
                        label="Stock Status"
                      >
                        <MenuItem value="retain">
                          Retain (Add to Stock)
                        </MenuItem>
                        <MenuItem value="transit">
                          Transit (Do not add to Stock)
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </CardContent>
              </SectionCard>
            </Grid>

            {/* Supplier Details */}
            <Grid size={{ xs: 12, md: 6 }}>
              <SectionCard>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Supplier Details
                  </Typography>
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 2 }}
                  >
                    <TextField
                      label="Supplier Name"
                      value={purchaseOrder.supplierName}
                      onChange={(e) =>
                        handleInputChange("supplierName", e.target.value)
                      }
                      fullWidth
                      required
                    />
                    <TextField
                      label="Email"
                      type="email"
                      value={purchaseOrder.supplierEmail}
                      onChange={(e) =>
                        handleInputChange("supplierEmail", e.target.value)
                      }
                      fullWidth
                    />
                    <TextField
                      label="Phone"
                      value={purchaseOrder.supplierPhone}
                      onChange={(e) =>
                        handleInputChange("supplierPhone", e.target.value)
                      }
                      fullWidth
                    />
                    <TextField
                      label="Address"
                      multiline
                      rows={3}
                      value={purchaseOrder.supplierAddress}
                      onChange={(e) =>
                        handleInputChange("supplierAddress", e.target.value)
                      }
                      fullWidth
                    />
                  </Box>
                </CardContent>
              </SectionCard>
            </Grid>

            {/* Items */}
            <Grid size={{ xs: 12 }}>
              <SectionCard>
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 2,
                    }}
                  >
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Items
                    </Typography>
                    <Button
                      startIcon={<Plus size={18} />}
                      onClick={addItem}
                      variant="outlined"
                      size="small"
                      sx={{ borderRadius: 2 }}
                    >
                      Add Item
                    </Button>
                  </Box>

                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>Product Name</TableCell>
                          <TableCell>Specification</TableCell>
                          <TableCell>Unit</TableCell>
                          <TableCell>Quantity</TableCell>
                          <TableCell>Rate</TableCell>
                          <TableCell>Amount</TableCell>
                          <TableCell width="50px"></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {purchaseOrder.items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <TextField
                                value={item.name}
                                onChange={(e) =>
                                  handleItemChange(
                                    index,
                                    "name",
                                    e.target.value
                                  )
                                }
                                placeholder="Product name"
                                size="small"
                                fullWidth
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                value={item.specification}
                                onChange={(e) =>
                                  handleItemChange(
                                    index,
                                    "specification",
                                    e.target.value
                                  )
                                }
                                placeholder="Specification"
                                size="small"
                                fullWidth
                              />
                            </TableCell>
                            <TableCell>
                              <FormControl size="small" fullWidth>
                                <Select
                                  value={item.unit}
                                  onChange={(e) =>
                                    handleItemChange(
                                      index,
                                      "unit",
                                      e.target.value
                                    )
                                  }
                                >
                                  <MenuItem value="MT">MT</MenuItem>
                                  <MenuItem value="KG">KG</MenuItem>
                                  <MenuItem value="PC">PC</MenuItem>
                                  <MenuItem value="FT">FT</MenuItem>
                                </Select>
                              </FormControl>
                            </TableCell>
                            <TableCell>
                              <TextField
                                type="number"
                                value={item.quantity}
                                onChange={(e) =>
                                  handleItemChange(
                                    index,
                                    "quantity",
                                    e.target.value
                                  )
                                }
                                size="small"
                                fullWidth
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                type="number"
                                value={item.rate}
                                onChange={(e) =>
                                  handleItemChange(
                                    index,
                                    "rate",
                                    e.target.value
                                  )
                                }
                                size="small"
                                fullWidth
                              />
                            </TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 600 }}
                              >
                                {formatCurrency(item.amount)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <IconButton
                                onClick={() => removeItem(index)}
                                size="small"
                                color="error"
                                disabled={purchaseOrder.items.length === 1}
                              >
                                <Trash2 size={16} />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Divider sx={{ my: 2 }} />

                  {/* Totals */}
                  <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                    <Box sx={{ width: 300 }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 1,
                        }}
                      >
                        <Typography>Subtotal:</Typography>
                        <Typography sx={{ fontWeight: 600 }}>
                          {formatCurrency(purchaseOrder.subtotal)}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 1,
                        }}
                      >
                        <Typography>VAT (5%):</Typography>
                        <Typography sx={{ fontWeight: 600 }}>
                          {formatCurrency(purchaseOrder.vatAmount)}
                        </Typography>
                      </Box>
                      <Divider sx={{ my: 1 }} />
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          Total:
                        </Typography>
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 700, color: "primary.main" }}
                        >
                          {formatCurrency(purchaseOrder.total)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </SectionCard>
            </Grid>

            {/* Notes and Terms */}
            <Grid size={{ xs: 12, md: 6 }}>
              <SectionCard>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Notes
                  </Typography>
                  <TextField
                    multiline
                    rows={4}
                    value={purchaseOrder.notes}
                    onChange={(e) => handleInputChange("notes", e.target.value)}
                    placeholder="Additional notes..."
                    fullWidth
                  />
                </CardContent>
              </SectionCard>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <SectionCard>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Terms & Conditions
                  </Typography>
                  <TextField
                    multiline
                    rows={4}
                    value={purchaseOrder.terms}
                    onChange={(e) => handleInputChange("terms", e.target.value)}
                    placeholder="Terms and conditions..."
                    fullWidth
                  />
                </CardContent>
              </SectionCard>
            </Grid>
          </Grid>
        </PurchaseOrderFormPaper>
      </Container>
    </PurchaseOrderContainer>
  );
};

export default PurchaseOrderForm;
