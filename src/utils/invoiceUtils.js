export const calculateItemAmount = (quantity, rate) => {
  return quantity * rate;
};

export const calculateVAT = (amount, vatRate) => {
  return (amount * vatRate) / 100;
};

export const calculateSubtotal = (items) => {
  return items.reduce((sum, item) => sum + item.amount, 0);
};

export const calculateTotalVAT = (items) => {
  return items.reduce((sum, item) => sum + calculateVAT(item.amount, item.vatRate), 0);
};

export const calculateTotal = (subtotal, vatAmount) => {
  return subtotal + vatAmount;
};

export const generateInvoiceNumber = () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `INV-${year}${month}-${random}`;
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
  }).format(amount);
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