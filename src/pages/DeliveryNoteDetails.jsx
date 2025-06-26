import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
  Divider
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  GetApp as DownloadIcon,
  Edit as EditIcon,
  LocalShipping as TruckIcon,
  Add as AddIcon,
  CheckCircle as CompleteIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { deliveryNotesAPI } from '../services/api';

const DeliveryNoteDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [deliveryNote, setDeliveryNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Partial delivery dialog
  const [partialDialog, setPartialDialog] = useState({
    open: false,
    item: null,
    quantity: ''
  });

  const statusColors = {
    pending: 'warning',
    partial: 'info',
    completed: 'success',
    cancelled: 'error'
  };

  const statusLabels = {
    pending: 'Pending',
    partial: 'Partial Delivery',
    completed: 'Completed',
    cancelled: 'Cancelled'
  };

  useEffect(() => {
    loadDeliveryNote();
  }, [id]);

  const loadDeliveryNote = async () => {
    try {
      setLoading(true);
      const data = await deliveryNotesAPI.getById(id);
      setDeliveryNote(data);
    } catch (err) {
      setError('Failed to load delivery note: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      await deliveryNotesAPI.downloadPDF(id);
      setSuccess('PDF downloaded successfully');
    } catch (err) {
      setError('Failed to download PDF: ' + err.message);
    }
  };

  const handlePartialDelivery = async () => {
    try {
      const quantity = parseFloat(partialDialog.quantity);
      if (!quantity || quantity <= 0) {
        setError('Please enter a valid quantity');
        return;
      }

      if (quantity > partialDialog.item.remaining_quantity) {
        setError('Quantity exceeds remaining quantity');
        return;
      }

      await deliveryNotesAPI.updateDelivery(id, partialDialog.item.id, {
        quantity_delivered: quantity,
        notes: `Additional delivery of ${quantity} ${partialDialog.item.unit}`
      });

      setSuccess('Delivery quantity updated successfully');
      setPartialDialog({ open: false, item: null, quantity: '' });
      loadDeliveryNote(); // Refresh data
    } catch (err) {
      setError('Failed to update delivery: ' + err.message);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      await deliveryNotesAPI.updateStatus(id, newStatus);
      setSuccess(`Status updated to ${statusLabels[newStatus]}`);
      loadDeliveryNote(); // Refresh data
    } catch (err) {
      setError('Failed to update status: ' + err.message);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTotalDeliveredPercentage = () => {
    if (!deliveryNote?.items?.length) return 0;
    
    const totalOrdered = deliveryNote.items.reduce((sum, item) => sum + item.ordered_quantity, 0);
    const totalDelivered = deliveryNote.items.reduce((sum, item) => sum + item.delivered_quantity, 0);
    
    return totalOrdered > 0 ? Math.round((totalDelivered / totalOrdered) * 100) : 0;
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading delivery note...</Typography>
      </Box>
    );
  }

  if (!deliveryNote) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Delivery note not found</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton onClick={() => navigate('/delivery-notes')} sx={{ mr: 2 }}>
            <BackIcon />
          </IconButton>
          <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TruckIcon sx={{ fontSize: 36, color: 'primary.main' }} />
            {deliveryNote.delivery_note_number}
          </Typography>
          <Chip
            label={statusLabels[deliveryNote.status]}
            color={statusColors[deliveryNote.status]}
            sx={{ ml: 2 }}
          />
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => navigate(`/delivery-notes/${id}/edit`)}
          >
            Edit
          </Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadPDF}
          >
            Download PDF
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} md={8}>
          {/* Basic Information */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Delivery Information</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Related Invoice</Typography>
                <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                  {deliveryNote.invoice_number}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Delivery Date</Typography>
                <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                  {formatDate(deliveryNote.delivery_date)}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Vehicle Number</Typography>
                <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                  {deliveryNote.vehicle_number || 'Not specified'}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Driver</Typography>
                <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                  {deliveryNote.driver_name || 'Not specified'}
                </Typography>
                {deliveryNote.driver_phone && (
                  <Typography variant="body2" color="text.secondary">
                    {deliveryNote.driver_phone}
                  </Typography>
                )}
              </Grid>
            </Grid>
          </Paper>

          {/* Customer Information */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Customer Details</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Customer Name</Typography>
                <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                  {deliveryNote.customer_details?.name}
                </Typography>
                {deliveryNote.customer_details?.company && (
                  <Typography variant="body2" color="text.secondary">
                    {deliveryNote.customer_details.company}
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary">Contact</Typography>
                <Typography variant="body1">
                  {deliveryNote.customer_details?.phone}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {deliveryNote.customer_details?.email}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">Delivery Address</Typography>
                <Typography variant="body1">
                  {deliveryNote.delivery_address?.street || deliveryNote.customer_details?.address?.street}<br />
                  {deliveryNote.delivery_address?.city || deliveryNote.customer_details?.address?.city}, {deliveryNote.delivery_address?.state || deliveryNote.customer_details?.address?.state} {deliveryNote.delivery_address?.zipcode || deliveryNote.customer_details?.address?.zipcode}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          {/* Items */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Items</Typography>
              <Typography variant="body2" color="text.secondary">
                Delivery Progress: {getTotalDeliveredPercentage()}%
              </Typography>
            </Box>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Item</TableCell>
                    <TableCell>Specification</TableCell>
                    <TableCell>Unit</TableCell>
                    <TableCell align="right">Ordered</TableCell>
                    <TableCell align="right">Delivered</TableCell>
                    <TableCell align="right">Remaining</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {deliveryNote.items?.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {item.name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {item.specification || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>{item.unit}</TableCell>
                      <TableCell align="right">{item.ordered_quantity}</TableCell>
                      <TableCell align="right">
                        <Typography 
                          variant="body2" 
                          color={item.delivered_quantity > 0 ? 'success.main' : 'text.primary'}
                          sx={{ fontWeight: 'medium' }}
                        >
                          {item.delivered_quantity}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography 
                          variant="body2" 
                          color={item.remaining_quantity === 0 ? 'success.main' : 'warning.main'}
                          sx={{ fontWeight: 'medium' }}
                        >
                          {item.remaining_quantity}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={item.is_fully_delivered ? 'Complete' : 'Partial'}
                          color={item.is_fully_delivered ? 'success' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {!item.is_fully_delivered && deliveryNote.status !== 'completed' && deliveryNote.status !== 'cancelled' && (
                          <Button
                            size="small"
                            startIcon={<AddIcon />}
                            onClick={() => setPartialDialog({
                              open: true,
                              item,
                              quantity: ''
                            })}
                          >
                            Add Delivery
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>

          {/* Notes */}
          {deliveryNote.notes && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>Notes</Typography>
              <Typography variant="body1">
                {deliveryNote.notes}
              </Typography>
            </Paper>
          )}
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} md={4}>
          {/* Quick Actions */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Quick Actions</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {deliveryNote.status === 'pending' && (
                <>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="success"
                    startIcon={<CompleteIcon />}
                    onClick={() => handleStatusUpdate('completed')}
                  >
                    Mark as Completed
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    color="error"
                    startIcon={<CancelIcon />}
                    onClick={() => handleStatusUpdate('cancelled')}
                  >
                    Cancel Delivery
                  </Button>
                </>
              )}
              
              {deliveryNote.status === 'partial' && (
                <Button
                  fullWidth
                  variant="outlined"
                  color="success"
                  startIcon={<CompleteIcon />}
                  onClick={() => handleStatusUpdate('completed')}
                >
                  Mark as Completed
                </Button>
              )}
            </Box>
          </Paper>

          {/* Delivery Summary */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Delivery Summary</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Total Items</Typography>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  {deliveryNote.items?.length || 0}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Fully Delivered</Typography>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  {deliveryNote.items?.filter(item => item.is_fully_delivered).length || 0}
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Pending</Typography>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                  {deliveryNote.items?.filter(item => !item.is_fully_delivered).length || 0}
                </Typography>
              </Box>

              <Divider />

              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="body2" color="text.secondary">Is Partial Delivery</Typography>
                <Chip
                  label={deliveryNote.is_partial ? 'Yes' : 'No'}
                  color={deliveryNote.is_partial ? 'warning' : 'success'}
                  size="small"
                />
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Partial Delivery Dialog */}
      <Dialog open={partialDialog.open} onClose={() => setPartialDialog({ open: false, item: null, quantity: '' })}>
        <DialogTitle>Add Partial Delivery</DialogTitle>
        <DialogContent>
          {partialDialog.item && (
            <Box sx={{ pt: 1 }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                <strong>{partialDialog.item.name}</strong>
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Remaining quantity: {partialDialog.item.remaining_quantity} {partialDialog.item.unit}
              </Typography>
              <TextField
                fullWidth
                label="Quantity to Deliver"
                type="number"
                value={partialDialog.quantity}
                onChange={(e) => setPartialDialog(prev => ({ ...prev, quantity: e.target.value }))}
                inputProps={{ 
                  min: 0, 
                  max: partialDialog.item.remaining_quantity,
                  step: 0.01
                }}
                helperText={`Maximum: ${partialDialog.item.remaining_quantity} ${partialDialog.item.unit}`}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPartialDialog({ open: false, item: null, quantity: '' })}>
            Cancel
          </Button>
          <Button onClick={handlePartialDelivery} variant="contained">
            Update Delivery
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Snackbars */}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError('')}>
        <Alert onClose={() => setError('')} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess('')}>
        <Alert onClose={() => setSuccess('')} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DeliveryNoteDetails;