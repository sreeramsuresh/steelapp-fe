export const calculateItemAmount = (quantity, rate) => {
  const qty = parseFloat(quantity) || 0;
  const rt = parseFloat(rate) || 0;
  return qty * rt;
};

export const calculateTRN = (amount, trnRate) => {
  const amt = parseFloat(amount) || 0;
  const rate = parseFloat(trnRate) || 0;
  return (amt * rate) / 100;
};

// Keep for backward compatibility
export const calculateVAT = (amount, vatRate) => {
  return calculateTRN(amount, vatRate);
};

export const calculateSubtotal = (items) => {
  return items.reduce((sum, item) => {
    const amount = parseFloat(item.amount) || 0;
    return sum + amount;
  }, 0);
};

export const calculateTotalTRN = (items) => {
  return items.reduce((sum, item) => {
    const amount = parseFloat(item.amount) || 0;
    const rate = parseFloat(item.vatRate) || 0;
    return sum + calculateTRN(amount, rate);
  }, 0);
};

// Compute VAT after applying invoice-level discount per UAE rules
// - Percentage: reduce each line by the percent, then apply VAT per line
// - Amount: allocate discount proportionally by line amount, then apply VAT per line
export const calculateDiscountedTRN = (items, discountType, discountPercent, discountAmount) => {
  if (!Array.isArray(items) || items.length === 0) return 0;
  const total = items.reduce((s, it) => s + (parseFloat(it.amount) || 0), 0);
  if (total <= 0) return 0;

  const pct = parseFloat(discountPercent) || 0;
  const amt = parseFloat(discountAmount) || 0;

  let vatSum = 0;
  if (discountType === 'percentage' && pct > 0) {
    const factor = Math.max(0, 1 - pct / 100);
    for (const it of items) {
      const lineAmt = (parseFloat(it.amount) || 0) * factor;
      const rate = parseFloat(it.vatRate) || 0;
      vatSum += calculateTRN(lineAmt, rate);
    }
    return vatSum;
  }

  // Amount-based or no/invalid type
  const cap = Math.min(Math.max(0, amt), total);
  if (cap === 0) return calculateTotalTRN(items);

  for (const it of items) {
    const base = parseFloat(it.amount) || 0;
    const share = base / total;
    const allocated = cap * share;
    const net = Math.max(0, base - allocated);
    const rate = parseFloat(it.vatRate) || 0;
    vatSum += calculateTRN(net, rate);
  }
  return vatSum;
};

// Keep for backward compatibility
export const calculateTotalVAT = (items) => {
  return calculateTotalTRN(items);
};

export const calculateTotal = (subtotal, vatAmount) => {
  const sub = parseFloat(subtotal) || 0;
  const vat = parseFloat(vatAmount) || 0;
  return sub + vat;
};

export const generateInvoiceNumber = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const yearMonth = `${year}${month}`;
  // Placeholder counter - real number comes from backend API
  return `INV-${yearMonth}-0001`;
};

export const generatePONumber = () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `PO-${year}${month}-${random}`;
};

export const formatCurrency = (amount) => {
  // Handle NaN, null, undefined, or non-numeric values
  const numericAmount = parseFloat(amount);
  const safeAmount = isNaN(numericAmount) ? 0 : numericAmount;
  
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
  }).format(safeAmount);
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-AE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Format as DD/MM/YYYY (e.g., 04/06/2025)
export const formatDateDMY = (date) => {
  if (!date) return '';
  const d = new Date(date);
  if (isNaN(d)) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

export const formatDateForInput = (date) => {
  if (!date) return '';
  if (typeof date === 'string' && date.includes('T')) {
    return date.split('T')[0];
  }
  if (date instanceof Date) {
    return date.toISOString().split('T')[0];
  }
  return date;
};

// Normalize LLC formatting function
export const normalizeLLC = (companyName) => {
  if (!companyName) return '';
  
  // Regex to match any variation of LLC with optional periods, spaces, and case variations
  const llcPattern = /\b[Ll]\.?\s*[Ll]\.?\s*[Cc]\.?\b/g;
  
  // Replace all variations with standardized "LLC"
  return companyName.replace(llcPattern, 'LLC');
};

// Title-case each word: capitalize first letter, lowercase the rest
export const titleCase = (value) => {
  if (value == null) return '';
  const s = String(value).trim().toLowerCase();
  // Capitalize first alpha after a word boundary
  return s.replace(/\b([a-z])/g, (m, p1) => p1.toUpperCase());
};

// Numeric currency without symbol (e.g., 1,234.56)
export const formatNumber = (value, fractionDigits = 2) => {
  const num = Number(value);
  const safe = isNaN(num) ? 0 : num;
  return new Intl.NumberFormat('en-AE', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(safe);
};
