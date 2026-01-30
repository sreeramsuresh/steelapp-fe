import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import ConfirmDialog from '../components/ConfirmDialog';
import { operatingExpenseService } from '../services/operatingExpenseService';
import { chartOfAccountsService } from '../services/chartOfAccountsService';

const EXPENSE_TYPES = [
  { value: 'RENT', label: 'Rent' },
  { value: 'UTILITIES', label: 'Utilities' },
  { value: 'SALARIES', label: 'Salaries & Wages' },
  { value: 'TRANSPORT', label: 'Transport & Logistics' },
  { value: 'OTHER', label: 'Other' },
];

const PAYMENT_METHODS = [
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'CASH', label: 'Cash' },
  { value: 'CHEQUE', label: 'Cheque' },
  { value: 'CREDIT_CARD', label: 'Credit Card' },
];

export default function OperatingExpenseForm() {
  const [activeTab, setActiveTab] = useState('create');
  const [formData, setFormData] = useState({
    expenseDate: dayjs(),
    expenseType: 'RENT',
    categoryCode: '',
    amount: '',
    narration: '',
    referenceNumber: '',
    paymentMethod: 'BANK_TRANSFER',
    paymentReference: '',
  });

  const [expenseAccounts, setExpenseAccounts] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState({
    open: false,
    expenseId: null,
  });

  // Load expense accounts from COA
  useEffect(() => {
    loadExpenseAccounts();
  }, []);

  // Load expenses when on list tab
  useEffect(() => {
    if (activeTab === 'list') {
      loadExpenses();
    }
  }, [activeTab]);

  const loadExpenseAccounts = async () => {
    try {
      const accounts = await chartOfAccountsService.getByCategory('EXPENSE');
      setExpenseAccounts(accounts.filter((acc) => acc.type !== 'HEADER'));
    } catch (err) {
      console.error('Failed to load expense accounts:', err);
    }
  };

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const result = await operatingExpenseService.list({ limit: 100 });
      setExpenses(result.data || []);
    } catch (err) {
      console.error('Failed to load expenses:', err);
      setError('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field) => (event) => {
    setFormData({ ...formData, [field]: event.target.value });
  };

  const handleDateChange = (date) => {
    setFormData({ ...formData, expenseDate: date });
  };

  const handleReset = () => {
    setFormData({
      expenseDate: dayjs(),
      expenseType: 'RENT',
      categoryCode: '',
      amount: '',
      narration: '',
      referenceNumber: '',
      paymentMethod: 'BANK_TRANSFER',
      paymentReference: '',
    });
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const submitData = {
        expense_date: formData.expenseDate.format('YYYY-MM-DD'),
        expense_type: formData.expenseType,
        category_code: formData.categoryCode,
        amount: parseFloat(formData.amount),
        narration: formData.narration,
        reference_number: formData.referenceNumber,
        payment_method: formData.paymentMethod,
        payment_reference: formData.paymentReference,
      };

      await operatingExpenseService.create(submitData);
      setSuccess(true);

      // Reset form
      handleReset();

      // Reload list if on that tab
      if (activeTab === 'list') {
        loadExpenses();
      }

      // Switch to list tab after short delay
      setTimeout(() => setActiveTab('list'), 1000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Failed to create expense',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (expenseId) => {
    setLoading(true);
    try {
      await operatingExpenseService.approve(expenseId);
      setSuccess(true);
      setOpenDialog(false);
      loadExpenses();
    } catch {
      setError('Failed to approve expense');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (expenseId) => {
    setDeleteConfirm({ open: true, expenseId });
  };

  const confirmDelete = async () => {
    const { expenseId } = deleteConfirm;
    setLoading(true);
    try {
      await operatingExpenseService.delete(expenseId);
      setSuccess(true);
      loadExpenses();
    } catch {
      setError('Failed to delete expense');
    } finally {
      setLoading(false);
    }
  };

  const openExpenseDetails = (expense) => {
    setSelectedExpense(expense);
    setOpenDialog(true);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Operating Expense Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          severity="success"
          sx={{ mb: 2 }}
          onClose={() => setSuccess(false)}
        >
          Operation completed successfully!
        </Alert>
      )}

      {/* Tabs */}
      <Box sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            onClick={() => setActiveTab('create')}
            sx={{
              pb: 1,
              borderBottom: activeTab === 'create' ? 3 : 0,
              borderColor: 'primary.main',
              textTransform: 'none',
            }}
          >
            Create Expense
          </Button>
          <Button
            onClick={() => setActiveTab('list')}
            sx={{
              pb: 1,
              borderBottom: activeTab === 'list' ? 3 : 0,
              borderColor: 'primary.main',
              textTransform: 'none',
            }}
          >
            View Expenses
          </Button>
        </Box>
      </Box>

      {/* Create Tab */}
      {activeTab === 'create' && (
        <Card>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                {/* Expense Date */}
                <Grid item xs={12} md={6}>
                  <DatePicker
                    label="Expense Date"
                    value={formData.expenseDate}
                    onChange={handleDateChange}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>

                {/* Expense Type */}
                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    label="Expense Type"
                    value={formData.expenseType}
                    onChange={handleChange('expenseType')}
                    fullWidth
                    required
                  >
                    {EXPENSE_TYPES.map((type) => (
                      <MenuItem key={type.value} value={type.value}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {/* GL Account */}
                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    label="Expense Account"
                    value={formData.categoryCode}
                    onChange={handleChange('categoryCode')}
                    fullWidth
                    required
                    helperText="Select GL account for this expense"
                  >
                    {expenseAccounts.map((account) => (
                      <MenuItem key={account.code} value={account.code}>
                        {account.code} - {account.name}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {/* Amount */}
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Amount (AED)"
                    type="number"
                    value={formData.amount}
                    onChange={handleChange('amount')}
                    fullWidth
                    required
                    inputProps={{ step: '0.01', min: '0' }}
                  />
                </Grid>

                {/* Narration */}
                <Grid item xs={12}>
                  <TextField
                    label="Description / Narration"
                    value={formData.narration}
                    onChange={handleChange('narration')}
                    fullWidth
                    multiline
                    rows={3}
                  />
                </Grid>

                {/* Reference Number */}
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Reference Number"
                    value={formData.referenceNumber}
                    onChange={handleChange('referenceNumber')}
                    fullWidth
                  />
                </Grid>

                {/* Payment Method */}
                <Grid item xs={12} md={6}>
                  <TextField
                    select
                    label="Payment Method"
                    value={formData.paymentMethod}
                    onChange={handleChange('paymentMethod')}
                    fullWidth
                    required
                  >
                    {PAYMENT_METHODS.map((method) => (
                      <MenuItem key={method.value} value={method.value}>
                        {method.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {/* Payment Reference */}
                <Grid item xs={12} md={6}>
                  <TextField
                    label="Payment Reference (Cheque/Transaction ID)"
                    value={formData.paymentReference}
                    onChange={handleChange('paymentReference')}
                    fullWidth
                  />
                </Grid>

                {/* Buttons */}
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={loading}
                    >
                      {loading ? (
                        <CircularProgress size={24} />
                      ) : (
                        'Create Expense'
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outlined"
                      onClick={handleReset}
                      disabled={loading}
                    >
                      Reset
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      )}

      {/* List Tab */}
      {activeTab === 'list' && (
        <TableContainer component={Paper}>
          {loading && <CircularProgress sx={{ p: 2 }} />}
          {!loading && expenses.length === 0 && (
            <Typography sx={{ p: 2 }}>No expenses found</Typography>
          )}
          {!loading && expenses.length > 0 && (
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell>Date</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Account</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{expense.expenseDate}</TableCell>
                    <TableCell>{expense.expenseType}</TableCell>
                    <TableCell>{expense.categoryCode}</TableCell>
                    <TableCell align="right">
                      {parseFloat(expense.amount).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          display: 'inline-block',
                          px: 2,
                          py: 1,
                          backgroundColor:
                            expense.status === 'POSTED'
                              ? '#c8e6c9'
                              : expense.status === 'APPROVED'
                                ? '#bbdefb'
                                : expense.status === 'SUBMITTED'
                                  ? '#fff9c4'
                                  : '#f5f5f5',
                          borderRadius: 1,
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {expense.status}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="small"
                        onClick={() => openExpenseDetails(expense)}
                      >
                        View
                      </Button>
                      {expense.status === 'DRAFT' && (
                        <Button
                          size="small"
                          color="error"
                          onClick={() => handleDelete(expense.id)}
                        >
                          Delete
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </TableContainer>
      )}

      {/* Details Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        {selectedExpense && (
          <>
            <DialogTitle>Expense Details</DialogTitle>
            <DialogContent sx={{ pt: 2 }}>
              <Box sx={{ display: 'grid', gap: 2 }}>
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Date
                  </Typography>
                  <Typography>{selectedExpense.expenseDate}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Type
                  </Typography>
                  <Typography>{selectedExpense.expenseType}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Account
                  </Typography>
                  <Typography>
                    {selectedExpense.categoryCode} -{' '}
                    {selectedExpense.categoryName}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Amount
                  </Typography>
                  <Typography>
                    {parseFloat(selectedExpense.amount).toFixed(2)} AED
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Description
                  </Typography>
                  <Typography>{selectedExpense.narration}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="textSecondary">
                    Status
                  </Typography>
                  <Typography>{selectedExpense.status}</Typography>
                </Box>
              </Box>
            </DialogContent>
            <DialogActions>
              {selectedExpense.status === 'DRAFT' && (
                <Button
                  onClick={() => handleDelete(selectedExpense.id)}
                  color="error"
                  disabled={loading}
                >
                  Delete
                </Button>
              )}
              {selectedExpense.status === 'SUBMITTED' && (
                <Button
                  onClick={() => handleApprove(selectedExpense.id)}
                  variant="contained"
                  disabled={loading}
                >
                  Approve & Post
                </Button>
              )}
              <Button onClick={() => setOpenDialog(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Delete Confirmation Dialog */}
      {deleteConfirm.open && (
        <ConfirmDialog
          title="Delete Expense?"
          message="Are you sure you want to delete this expense?"
          variant="danger"
          onConfirm={() => {
            confirmDelete();
            setDeleteConfirm({ open: false, expenseId: null });
          }}
          onCancel={() => setDeleteConfirm({ open: false, expenseId: null })}
        />
      )}
    </Box>
  );
}
