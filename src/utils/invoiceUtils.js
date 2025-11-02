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
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `INV-${year}${month}-${random}`;
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
