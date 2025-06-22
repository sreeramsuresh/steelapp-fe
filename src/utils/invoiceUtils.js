export const calculateItemAmount = (quantity, rate) => {
  return quantity * rate;
};

export const calculateGST = (amount, gstRate) => {
  return (amount * gstRate) / 100;
};

export const calculateSubtotal = (items) => {
  return items.reduce((sum, item) => sum + item.amount, 0);
};

export const calculateTotalGST = (items) => {
  return items.reduce((sum, item) => sum + calculateGST(item.amount, item.gstRate), 0);
};

export const calculateTotal = (subtotal, gstAmount) => {
  return subtotal + gstAmount;
};

export const generateInvoiceNumber = () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `INV-${year}${month}-${random}`;
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
};

export const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};