import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calculator, 
  Ruler, 
  Weight, 
  DollarSign,
  Settings,
  Percent,
  Plus,
  Minus,
  Edit,
  Save,
  X,
  TrendingUp,
  Package,
  AlertCircle,
  CheckCircle,
  Info,
  Target,
  Layers,
  BarChart3
} from 'lucide-react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Card,
  CardContent,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  IconButton,
  Switch,
  FormControlLabel,
  Divider,
  InputAdornment,
  Stack,
  Alert,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody
} from '@mui/material';
import { styled } from '@mui/material/styles';

// Styled Components
const CalculatorContainer = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  background: theme.palette.background.default,
  minHeight: 'calc(100vh - 64px)',
  overflow: 'auto',
}));

const CalculatorPaper = styled(Paper)(({ theme }) => ({
  background: theme.palette.background.paper,
  borderRadius: theme.spacing(2),
  border: `1px solid ${theme.palette.divider}`,
  boxShadow: theme.shadows[2],
  overflow: 'hidden',
}));

const CalculationCard = styled(Card)(({ theme }) => ({
  background: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.spacing(2),
  boxShadow: theme.shadows[1],
}));

const ResultCard = styled(Card)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
  color: theme.palette.primary.contrastText,
  borderRadius: theme.spacing(2),
  boxShadow: theme.shadows[3],
}));

const RuleCard = styled(Card)(({ theme }) => ({
  background: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.spacing(2),
  boxShadow: theme.shadows[1],
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[4],
  },
}));

const PriceCalculator = () => {
  const [activeTab, setActiveTab] = useState('calculator');
  const [selectedProduct, setSelectedProduct] = useState('rebar');
  const [dimensions, setDimensions] = useState({
    length: 12,
    width: '',
    thickness: '',
    diameter: 12,
    quantity: 1
  });
  const [customRules, setCustomRules] = useState([]);
  const [bulkDiscounts, setBulkDiscounts] = useState([]);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [newRule, setNewRule] = useState({
    name: '',
    condition: 'quantity',
    operator: 'greater_than',
    value: 0,
    adjustmentType: 'percentage',
    adjustmentValue: 0,
    active: true
  });
  const [newDiscount, setNewDiscount] = useState({
    name: '',
    minQuantity: 0,
    discountPercentage: 0,
    active: true
  });

  // Base steel prices per kg (these would normally come from an API)
  const basePrices = {
    rebar: { fe415: 48, fe500: 52, fe550: 55 },
    structural: { ms: 55, ss304: 180, ss316: 220 },
    sheet: { ms: 62, galvanized: 75, ss304: 190 },
    pipe: { ms: 58, galvanized: 70, ss304: 185 },
    angle: { ms: 55, galvanized: 68 },
    round: { ms: 53, ss304: 175 },
    flat: { ms: 54, ss304: 178 },
    wire: { ms: 60, galvanized: 72 }
  };

  // Steel density and weight calculations
  const steelDensity = 7850; // kg/m³

  const productTypes = {
    rebar: {
      name: 'TMT Rebar',
      grades: ['fe415', 'fe500', 'fe550'],
      weightFormula: 'circular',
      dimensions: ['diameter', 'length']
    },
    structural: {
      name: 'Structural Steel',
      grades: ['ms', 'ss304', 'ss316'],
      weightFormula: 'rectangular',
      dimensions: ['length', 'width', 'thickness']
    },
    sheet: {
      name: 'Steel Sheet',
      grades: ['ms', 'galvanized', 'ss304'],
      weightFormula: 'sheet',
      dimensions: ['length', 'width', 'thickness']
    },
    pipe: {
      name: 'Steel Pipe',
      grades: ['ms', 'galvanized', 'ss304'],
      weightFormula: 'pipe',
      dimensions: ['diameter', 'thickness', 'length']
    },
    angle: {
      name: 'Steel Angle',
      grades: ['ms', 'galvanized'],
      weightFormula: 'angle',
      dimensions: ['length', 'width', 'thickness']
    },
    round: {
      name: 'Round Bar',
      grades: ['ms', 'ss304'],
      weightFormula: 'circular',
      dimensions: ['diameter', 'length']
    },
    flat: {
      name: 'Flat Bar',
      grades: ['ms', 'ss304'],
      weightFormula: 'rectangular',
      dimensions: ['length', 'width', 'thickness']
    },
    wire: {
      name: 'Steel Wire',
      grades: ['ms', 'galvanized'],
      weightFormula: 'circular',
      dimensions: ['diameter', 'length']
    }
  };

  const [selectedGrade, setSelectedGrade] = useState(productTypes[selectedProduct].grades[0]);

  useEffect(() => {
    // Load saved data
    const savedRules = localStorage.getItem('steel-app-pricing-rules');
    const savedDiscounts = localStorage.getItem('steel-app-bulk-discounts');
    
    if (savedRules) {
      setCustomRules(JSON.parse(savedRules));
    } else {
      // Default pricing rules
      const defaultRules = [
        {
          id: '1',
          name: 'High Volume Discount',
          condition: 'quantity',
          operator: 'greater_than',
          value: 1000,
          adjustmentType: 'percentage',
          adjustmentValue: -5,
          active: true
        },
        {
          id: '2',
          name: 'Premium Grade Surcharge',
          condition: 'grade',
          operator: 'equals',
          value: 'ss316',
          adjustmentType: 'percentage',
          adjustmentValue: 10,
          active: true
        },
        {
          id: '3',
          name: 'Small Order Fee',
          condition: 'total',
          operator: 'less_than',
          value: 5000,
          adjustmentType: 'fixed',
          adjustmentValue: 500,
          active: true
        }
      ];
      setCustomRules(defaultRules);
      localStorage.setItem('steel-app-pricing-rules', JSON.stringify(defaultRules));
    }

    if (savedDiscounts) {
      setBulkDiscounts(JSON.parse(savedDiscounts));
    } else {
      // Default bulk discounts
      const defaultDiscounts = [
        { id: '1', name: '5+ tonnes', minQuantity: 5000, discountPercentage: 3, active: true },
        { id: '2', name: '10+ tonnes', minQuantity: 10000, discountPercentage: 5, active: true },
        { id: '3', name: '25+ tonnes', minQuantity: 25000, discountPercentage: 8, active: true },
        { id: '4', name: '50+ tonnes', minQuantity: 50000, discountPercentage: 12, active: true }
      ];
      setBulkDiscounts(defaultDiscounts);
      localStorage.setItem('steel-app-bulk-discounts', JSON.stringify(defaultDiscounts));
    }

    // Reset grade when product changes
    setSelectedGrade(productTypes[selectedProduct].grades[0]);
  }, [selectedProduct]);

  const calculateWeight = useMemo(() => {
    const { weightFormula } = productTypes[selectedProduct];
    const { length, width, thickness, diameter, quantity } = dimensions;
    
    let weightPerUnit = 0;

    switch (weightFormula) {
      case 'circular': // For rebar, round bars, wire
        if (diameter && length) {
          const radiusM = (diameter / 1000) / 2; // Convert mm to m
          const lengthM = length;
          const volume = Math.PI * radiusM * radiusM * lengthM;
          weightPerUnit = volume * steelDensity;
        }
        break;
        
      case 'rectangular': // For structural steel, flat bars
        if (length && width && thickness) {
          const lengthM = length;
          const widthM = width / 1000; // Convert mm to m
          const thicknessM = thickness / 1000; // Convert mm to m
          const volume = lengthM * widthM * thicknessM;
          weightPerUnit = volume * steelDensity;
        }
        break;
        
      case 'sheet': // For steel sheets
        if (length && width && thickness) {
          const lengthM = length / 1000; // Convert mm to m
          const widthM = width / 1000; // Convert mm to m
          const thicknessM = thickness / 1000; // Convert mm to m
          const volume = lengthM * widthM * thicknessM;
          weightPerUnit = volume * steelDensity;
        }
        break;
        
      case 'pipe': // For pipes
        if (diameter && thickness && length) {
          const outerRadiusM = (diameter / 1000) / 2; // Convert mm to m
          const innerRadiusM = outerRadiusM - (thickness / 1000);
          const lengthM = length;
          const volume = Math.PI * (outerRadiusM * outerRadiusM - innerRadiusM * innerRadiusM) * lengthM;
          weightPerUnit = volume * steelDensity;
        }
        break;
        
      case 'angle': // For angles - simplified as two rectangles
        if (length && width && thickness) {
          const lengthM = length;
          const widthM = width / 1000; // Convert mm to m
          const thicknessM = thickness / 1000; // Convert mm to m
          // Simplified: two rectangles minus overlap
          const volume = lengthM * thicknessM * (2 * widthM - thicknessM);
          weightPerUnit = volume * steelDensity;
        }
        break;
        
      default:
        weightPerUnit = 0;
    }

    return weightPerUnit * quantity;
  }, [selectedProduct, dimensions]);

  const calculatePrice = useMemo(() => {
    const basePrice = basePrices[selectedProduct][selectedGrade] || 50;
    const totalWeight = calculateWeight;
    let subtotal = totalWeight * basePrice;

    // Apply custom pricing rules
    const applicableRules = customRules.filter(rule => rule.active);
    let adjustments = [];

    applicableRules.forEach(rule => {
      let applies = false;
      
      switch (rule.condition) {
        case 'quantity':
          if (rule.operator === 'greater_than' && dimensions.quantity > rule.value) applies = true;
          if (rule.operator === 'less_than' && dimensions.quantity < rule.value) applies = true;
          if (rule.operator === 'equals' && dimensions.quantity === rule.value) applies = true;
          break;
        case 'weight':
          if (rule.operator === 'greater_than' && totalWeight > rule.value) applies = true;
          if (rule.operator === 'less_than' && totalWeight < rule.value) applies = true;
          break;
        case 'total':
          if (rule.operator === 'greater_than' && subtotal > rule.value) applies = true;
          if (rule.operator === 'less_than' && subtotal < rule.value) applies = true;
          break;
        case 'grade':
          if (rule.operator === 'equals' && selectedGrade === rule.value) applies = true;
          break;
      }

      if (applies) {
        let adjustment = 0;
        if (rule.adjustmentType === 'percentage') {
          adjustment = subtotal * (rule.adjustmentValue / 100);
        } else {
          adjustment = rule.adjustmentValue;
        }
        
        adjustments.push({
          name: rule.name,
          amount: adjustment,
          type: rule.adjustmentType
        });
        
        subtotal += adjustment;
      }
    });

    // Apply bulk discounts
    const applicableDiscounts = bulkDiscounts
      .filter(discount => discount.active && totalWeight >= discount.minQuantity)
      .sort((a, b) => b.discountPercentage - a.discountPercentage);

    let bulkDiscount = 0;
    let appliedDiscount = null;

    if (applicableDiscounts.length > 0) {
      appliedDiscount = applicableDiscounts[0];
      bulkDiscount = subtotal * (appliedDiscount.discountPercentage / 100);
      subtotal -= bulkDiscount;
    }

    return {
      basePrice,
      baseAmount: totalWeight * basePrice,
      adjustments,
      bulkDiscount,
      appliedDiscount,
      subtotal,
      total: subtotal,
      pricePerKg: totalWeight > 0 ? subtotal / totalWeight : 0
    };
  }, [selectedProduct, selectedGrade, calculateWeight, dimensions, customRules, bulkDiscounts]);

  const handleAddRule = () => {
    const rule = {
      ...newRule,
      id: Date.now().toString()
    };
    const updatedRules = [...customRules, rule];
    setCustomRules(updatedRules);
    localStorage.setItem('steel-app-pricing-rules', JSON.stringify(updatedRules));
    setNewRule({
      name: '',
      condition: 'quantity',
      operator: 'greater_than',
      value: 0,
      adjustmentType: 'percentage',
      adjustmentValue: 0,
      active: true
    });
    setShowRulesModal(false);
  };

  const handleAddDiscount = () => {
    const discount = {
      ...newDiscount,
      id: Date.now().toString()
    };
    const updatedDiscounts = [...bulkDiscounts, discount];
    setBulkDiscounts(updatedDiscounts);
    localStorage.setItem('steel-app-bulk-discounts', JSON.stringify(updatedDiscounts));
    setNewDiscount({
      name: '',
      minQuantity: 0,
      discountPercentage: 0,
      active: true
    });
    setShowDiscountModal(false);
  };

  const toggleRuleActive = (ruleId) => {
    const updatedRules = customRules.map(rule =>
      rule.id === ruleId ? { ...rule, active: !rule.active } : rule
    );
    setCustomRules(updatedRules);
    localStorage.setItem('steel-app-pricing-rules', JSON.stringify(updatedRules));
  };

  const toggleDiscountActive = (discountId) => {
    const updatedDiscounts = bulkDiscounts.map(discount =>
      discount.id === discountId ? { ...discount, active: !discount.active } : discount
    );
    setBulkDiscounts(updatedDiscounts);
    localStorage.setItem('steel-app-bulk-discounts', JSON.stringify(updatedDiscounts));
  };

  const deleteRule = (ruleId) => {
    const updatedRules = customRules.filter(rule => rule.id !== ruleId);
    setCustomRules(updatedRules);
    localStorage.setItem('steel-app-pricing-rules', JSON.stringify(updatedRules));
  };

  const deleteDiscount = (discountId) => {
    const updatedDiscounts = bulkDiscounts.filter(discount => discount.id !== discountId);
    setBulkDiscounts(updatedDiscounts);
    localStorage.setItem('steel-app-bulk-discounts', JSON.stringify(updatedDiscounts));
  };

  const renderCalculator = () => (
    <Grid container spacing={3}>
      {/* Calculator Form */}
      <Grid item xs={12} md={6}>
        <CalculationCard>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <Package size={20} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Product Selection</Typography>
            </Box>
            <Stack spacing={3}>
              <FormControl fullWidth>
                <InputLabel>Product Type</InputLabel>
                <Select
                  value={selectedProduct}
                  onChange={(e) => setSelectedProduct(e.target.value)}
                  label="Product Type"
                >
                  {Object.entries(productTypes).map(([key, product]) => (
                    <MenuItem key={key} value={key}>{product.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Grade</InputLabel>
                <Select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  label="Grade"
                >
                  {productTypes[selectedProduct].grades.map(grade => (
                    <MenuItem key={grade} value={grade}>{grade.toUpperCase()}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </CardContent>
        </CalculationCard>

        <CalculationCard sx={{ mt: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <Ruler size={20} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>Dimensions</Typography>
            </Box>
            <Grid container spacing={2}>
              {productTypes[selectedProduct].dimensions.includes('diameter') && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Diameter (mm)"
                    value={dimensions.diameter}
                    onChange={(e) => setDimensions({...dimensions, diameter: Number(e.target.value)})}
                    placeholder="Enter diameter"
                  />
                </Grid>
              )}
              {productTypes[selectedProduct].dimensions.includes('length') && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Length (m)"
                    value={dimensions.length}
                    onChange={(e) => setDimensions({...dimensions, length: Number(e.target.value)})}
                    placeholder="Enter length"
                  />
                </Grid>
              )}
              {productTypes[selectedProduct].dimensions.includes('width') && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Width (mm)"
                    value={dimensions.width}
                    onChange={(e) => setDimensions({...dimensions, width: Number(e.target.value)})}
                    placeholder="Enter width"
                  />
                </Grid>
              )}
              {productTypes[selectedProduct].dimensions.includes('thickness') && (
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Thickness (mm)"
                    value={dimensions.thickness}
                    onChange={(e) => setDimensions({...dimensions, thickness: Number(e.target.value)})}
                    placeholder="Enter thickness"
                  />
                </Grid>
              )}
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Quantity"
                  value={dimensions.quantity}
                  onChange={(e) => setDimensions({...dimensions, quantity: Number(e.target.value)})}
                  placeholder="Enter quantity"
                  inputProps={{ min: "1" }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </CalculationCard>
      </Grid>

      {/* Results */}
      <Grid item xs={12} md={6}>
        <ResultCard>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: 'white' }}>Calculation Results</Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                Base Price: ₹{calculatePrice.basePrice}/kg
              </Typography>
            </Box>

            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Weight size={16} />
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>Total Weight</Typography>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'white' }}>
                  {calculateWeight.toFixed(2)} kg
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Package size={16} />
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>Weight per Unit</Typography>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'white' }}>
                  {dimensions.quantity > 0 ? (calculateWeight / dimensions.quantity).toFixed(2) : 0} kg
                </Typography>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2, backgroundColor: 'rgba(255,255,255,0.2)' }} />

            <Stack spacing={1}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>Base Amount</Typography>
                <Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>₹{calculatePrice.baseAmount.toFixed(2)}</Typography>
              </Box>

              {calculatePrice.adjustments.map((adjustment, index) => (
                <Box key={index} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                    {adjustment.name}
                    <Typography component="span" variant="caption" sx={{ ml: 1, opacity: 0.7 }}>
                      ({adjustment.type === 'percentage' ? `${adjustment.amount < 0 ? '' : '+'}${((adjustment.amount / calculatePrice.baseAmount) * 100).toFixed(1)}%` : 'Fixed'})
                    </Typography>
                  </Typography>
                  <Typography variant="body2" sx={{ color: adjustment.amount < 0 ? '#4ade80' : '#fbbf24', fontWeight: 600 }}>
                    {adjustment.amount >= 0 ? '+' : ''}₹{adjustment.amount.toFixed(2)}
                  </Typography>
                </Box>
              ))}

              {calculatePrice.bulkDiscount > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                    Bulk Discount ({calculatePrice.appliedDiscount.name})
                    <Typography component="span" variant="caption" sx={{ ml: 1, opacity: 0.7 }}>
                      (-{calculatePrice.appliedDiscount.discountPercentage}%)
                    </Typography>
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#4ade80', fontWeight: 600 }}>-₹{calculatePrice.bulkDiscount.toFixed(2)}</Typography>
                </Box>
              )}

              <Divider sx={{ my: 2, backgroundColor: 'rgba(255,255,255,0.2)' }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'white' }}>Total Amount</Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, color: 'white' }}>₹{calculatePrice.total.toFixed(2)}</Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>Final Price per kg</Typography>
                <Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>₹{calculatePrice.pricePerKg.toFixed(2)}</Typography>
              </Box>
            </Stack>

            {calculatePrice.appliedDiscount && (
              <Alert icon={<CheckCircle size={16} />} severity="success" sx={{ mt: 2 }}>
                Bulk discount applied: {calculatePrice.appliedDiscount.name}
              </Alert>
            )}
          </CardContent>
        </ResultCard>
      </Grid>
    </Grid>
  );

  const renderPricingRules = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>Custom Pricing Rules</Typography>
        <Button
          variant="contained"
          startIcon={<Plus size={20} />}
          onClick={() => setShowRulesModal(true)}
          sx={{ borderRadius: 2 }}
        >
          Add Rule
        </Button>
      </Box>

      <Grid container spacing={2}>
        {customRules.map(rule => (
          <Grid item xs={12} md={6} key={rule.id}>
            <RuleCard>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" component="h4" sx={{ fontWeight: 600, mb: 1 }}>
                      {rule.name}
                    </Typography>
                    <Chip 
                      label={rule.active ? 'Active' : 'Inactive'}
                      color={rule.active ? 'success' : 'default'}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant={rule.active ? 'outlined' : 'contained'}
                      color={rule.active ? 'warning' : 'success'}
                      size="small"
                      onClick={() => toggleRuleActive(rule.id)}
                      sx={{ borderRadius: 1 }}
                    >
                      {rule.active ? 'Disable' : 'Enable'}
                    </Button>
                    <IconButton
                      color="error"
                      size="small"
                      onClick={() => deleteRule(rule.id)}
                    >
                      <X size={16} />
                    </IconButton>
                  </Box>
                </Box>
                
                <Stack spacing={1}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" component="strong">Condition:</Typography>
                    <Typography variant="body2" sx={{ ml: 1 }}>
                      {rule.condition} {rule.operator.replace('_', ' ')} {rule.value}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary" component="strong">Adjustment:</Typography>
                    <Typography variant="body2" sx={{ ml: 1, fontWeight: 600, color: rule.adjustmentValue < 0 ? 'success.main' : 'warning.main' }}>
                      {rule.adjustmentType === 'percentage' 
                        ? `${rule.adjustmentValue > 0 ? '+' : ''}${rule.adjustmentValue}%`
                        : `${rule.adjustmentValue > 0 ? '+' : ''}₹${rule.adjustmentValue}`
                      }
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </RuleCard>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderBulkDiscounts = () => (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>Bulk Quantity Discounts</Typography>
        <Button
          variant="contained"
          startIcon={<Plus size={20} />}
          onClick={() => setShowDiscountModal(true)}
          sx={{ borderRadius: 2 }}
        >
          Add Discount
        </Button>
      </Box>

      <Grid container spacing={2}>
        {bulkDiscounts.map(discount => (
          <Grid item xs={12} sm={6} md={4} key={discount.id}>
            <RuleCard>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" component="h4" sx={{ fontWeight: 600, mb: 1 }}>
                      {discount.name}
                    </Typography>
                    <Chip 
                      label={discount.active ? 'Active' : 'Inactive'}
                      color={discount.active ? 'success' : 'default'}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      variant={discount.active ? 'outlined' : 'contained'}
                      color={discount.active ? 'warning' : 'success'}
                      size="small"
                      onClick={() => toggleDiscountActive(discount.id)}
                      sx={{ borderRadius: 1 }}
                    >
                      {discount.active ? 'Disable' : 'Enable'}
                    </Button>
                    <IconButton
                      color="error"
                      size="small"
                      onClick={() => deleteDiscount(discount.id)}
                    >
                      <X size={16} />
                    </IconButton>
                  </Box>
                </Box>
                
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Layers size={16} />
                    <Typography variant="body2">
                      Min Quantity: <strong>{discount.minQuantity.toLocaleString()} kg</strong>
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Percent size={16} />
                    <Typography variant="body2">
                      Discount: <strong style={{ color: '#059669' }}>{discount.discountPercentage}%</strong>
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </RuleCard>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  return (
    <CalculatorContainer>
      <CalculatorPaper sx={{ p: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Calculator size={28} />
            <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
              🧮 Steel Price Calculator
            </Typography>
          </Box>
          <Typography variant="body1" color="text.secondary">
            Calculate steel prices with real-time weight calculations and custom pricing rules
          </Typography>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
            <Tab 
              value="calculator" 
              label="Price Calculator" 
              icon={<Calculator size={20} />}
              iconPosition="start"
              sx={{ textTransform: 'none', fontWeight: 500 }}
            />
            <Tab 
              value="rules" 
              label="Pricing Rules" 
              icon={<Settings size={20} />}
              iconPosition="start"
              sx={{ textTransform: 'none', fontWeight: 500 }}
            />
            <Tab 
              value="discounts" 
              label="Bulk Discounts" 
              icon={<Percent size={20} />}
              iconPosition="start"
              sx={{ textTransform: 'none', fontWeight: 500 }}
            />
          </Tabs>
        </Box>

        {/* Tab Content */}
        <Box>
          {activeTab === 'calculator' && renderCalculator()}
          {activeTab === 'rules' && renderPricingRules()}
          {activeTab === 'discounts' && renderBulkDiscounts()}
        </Box>

      {/* Add Rule Modal */}
      <Dialog open={showRulesModal} onClose={() => setShowRulesModal(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Add Pricing Rule</Typography>
            <IconButton onClick={() => setShowRulesModal(false)}>
              <X size={20} />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Rule Name"
                value={newRule.name}
                onChange={(e) => setNewRule({...newRule, name: e.target.value})}
                placeholder="Enter rule name"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Condition</InputLabel>
                <Select
                  value={newRule.condition}
                  onChange={(e) => setNewRule({...newRule, condition: e.target.value})}
                  label="Condition"
                >
                  <MenuItem value="quantity">Quantity</MenuItem>
                  <MenuItem value="weight">Weight (kg)</MenuItem>
                  <MenuItem value="total">Total Amount (₹)</MenuItem>
                  <MenuItem value="grade">Grade</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Operator</InputLabel>
                <Select
                  value={newRule.operator}
                  onChange={(e) => setNewRule({...newRule, operator: e.target.value})}
                  label="Operator"
                >
                  <MenuItem value="greater_than">Greater Than</MenuItem>
                  <MenuItem value="less_than">Less Than</MenuItem>
                  <MenuItem value="equals">Equals</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              {newRule.condition === 'grade' ? (
                <FormControl fullWidth>
                  <InputLabel>Value</InputLabel>
                  <Select
                    value={newRule.value}
                    onChange={(e) => setNewRule({...newRule, value: e.target.value})}
                    label="Value"
                  >
                    <MenuItem value="">Select Grade</MenuItem>
                    <MenuItem value="fe415">FE415</MenuItem>
                    <MenuItem value="fe500">FE500</MenuItem>
                    <MenuItem value="fe550">FE550</MenuItem>
                    <MenuItem value="ms">MS</MenuItem>
                    <MenuItem value="ss304">SS304</MenuItem>
                    <MenuItem value="ss316">SS316</MenuItem>
                    <MenuItem value="galvanized">Galvanized</MenuItem>
                  </Select>
                </FormControl>
              ) : (
                <TextField
                  fullWidth
                  type="number"
                  label="Value"
                  value={newRule.value}
                  onChange={(e) => setNewRule({...newRule, value: Number(e.target.value)})}
                  placeholder="Enter value"
                />
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Adjustment Type</InputLabel>
                <Select
                  value={newRule.adjustmentType}
                  onChange={(e) => setNewRule({...newRule, adjustmentType: e.target.value})}
                  label="Adjustment Type"
                >
                  <MenuItem value="percentage">Percentage</MenuItem>
                  <MenuItem value="fixed">Fixed Amount</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label={`Adjustment Value ${newRule.adjustmentType === 'percentage' ? '(%)' : '(₹)'}`}
                value={newRule.adjustmentValue}
                onChange={(e) => setNewRule({...newRule, adjustmentValue: Number(e.target.value)})}
                placeholder={newRule.adjustmentType === 'percentage' ? 'Enter percentage' : 'Enter amount'}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRulesModal(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleAddRule} variant="contained" startIcon={<Save size={20} />}>
            Add Rule
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Discount Modal */}
      <Dialog open={showDiscountModal} onClose={() => setShowDiscountModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Add Bulk Discount</Typography>
            <IconButton onClick={() => setShowDiscountModal(false)}>
              <X size={20} />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              label="Discount Name"
              value={newDiscount.name}
              onChange={(e) => setNewDiscount({...newDiscount, name: e.target.value})}
              placeholder="Enter discount name (e.g., 10+ tonnes)"
            />
            <TextField
              fullWidth
              type="number"
              label="Minimum Quantity (kg)"
              value={newDiscount.minQuantity}
              onChange={(e) => setNewDiscount({...newDiscount, minQuantity: Number(e.target.value)})}
              placeholder="Enter minimum quantity"
            />
            <TextField
              fullWidth
              type="number"
              label="Discount Percentage (%)"
              value={newDiscount.discountPercentage}
              onChange={(e) => setNewDiscount({...newDiscount, discountPercentage: Number(e.target.value)})}
              placeholder="Enter discount percentage"
              inputProps={{ max: 100, min: 0 }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDiscountModal(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleAddDiscount} variant="contained" startIcon={<Save size={20} />}>
            Add Discount
          </Button>
        </DialogActions>
      </Dialog>
      </CalculatorPaper>
    </CalculatorContainer>
  );
};

export default PriceCalculator;