import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar
} from '@mui/material';
import {
  Add as AddIcon,
  GetApp as DownloadIcon,
  Visibility as ViewIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocalShipping as TruckIcon
} from '@mui/icons-material';
import { deliveryNotesAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

const DeliveryNoteList = () => {
  const navigate = useNavigate();
  const [deliveryNotes, setDeliveryNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Pagination and filtering
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Dialog states
  const [deleteDialog, setDeleteDialog] = useState({ open: false, id: null, number: '' });

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

  const fetchDeliveryNotes = async () => {
    try {
      setLoading(true);
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        search: search || undefined,
        status: statusFilter || undefined,
        start_date: dateFilter || undefined,
      };

      const response = await deliveryNotesAPI.getAll(params);
      setDeliveryNotes(response.delivery_notes || []);
      setTotalCount(response.pagination?.total || 0);
    } catch (err) {
      setError('Failed to fetch delivery notes: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveryNotes();
  }, [page, rowsPerPage, search, statusFilter, dateFilter]);

  const handleDownloadPDF = async (id) => {
    try {
      await deliveryNotesAPI.downloadPDF(id);
      setSuccess('PDF downloaded successfully');
    } catch (err) {
      setError('Failed to download PDF: ' + err.message);
    }
  };

  const handleDelete = async () => {
    try {
      await deliveryNotesAPI.delete(deleteDialog.id);
      setSuccess('Delivery note deleted successfully');
      setDeleteDialog({ open: false, id: null, number: '' });
      fetchDeliveryNotes();
    } catch (err) {
      setError('Failed to delete delivery note: ' + err.message);
    }
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TruckIcon sx={{ fontSize: 36, color: 'primary.main' }} />
          Delivery Notes
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/delivery-notes/new')}
          sx={{ borderRadius: 2 }}
        >
          Create Delivery Note
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            label="Search"
            variant="outlined"
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by delivery note number, invoice, or customer..."
            sx={{ minWidth: 300 }}
          />
          
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Status"
            >
              <MenuItem value="">All Status</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="partial">Partial</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="From Date"
            type="date"
            size="small"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />

          <Button
            variant="outlined"
            onClick={() => {
              setSearch('');
              setStatusFilter('');
              setDateFilter('');
              setPage(0);
            }}
          >
            Clear Filters
          </Button>
        </Box>
      </Paper>

      {/* Delivery Notes Table */}
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Delivery Note #</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Invoice #</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Customer</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Delivery Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Vehicle</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                    Loading delivery notes...
                  </TableCell>
                </TableRow>
              ) : deliveryNotes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                    No delivery notes found
                  </TableCell>
                </TableRow>
              ) : (
                deliveryNotes.map((deliveryNote) => (
                  <TableRow key={deliveryNote.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                        {deliveryNote.delivery_note_number}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="primary">
                        {deliveryNote.invoice_number}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {deliveryNote.customer_details?.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {deliveryNote.customer_details?.company}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(deliveryNote.delivery_date)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={statusLabels[deliveryNote.status] || deliveryNote.status}
                        color={statusColors[deliveryNote.status] || 'default'}
                        size="small"
                      />
                      {deliveryNote.is_partial && (
                        <Typography variant="caption" color="warning.main" sx={{ display: 'block', mt: 0.5 }}>
                          Partial Delivery
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {deliveryNote.vehicle_number || '-'}
                      </Typography>
                      {deliveryNote.driver_name && (
                        <Typography variant="caption" color="text.secondary">
                          {deliveryNote.driver_name}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/delivery-notes/${deliveryNote.id}`)}
                          title="View Details"
                        >
                          <ViewIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/delivery-notes/${deliveryNote.id}/edit`)}
                          title="Edit"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDownloadPDF(deliveryNote.id)}
                          title="Download PDF"
                        >
                          <DownloadIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => setDeleteDialog({
                            open: true,
                            id: deliveryNote.id,
                            number: deliveryNote.delivery_note_number
                          })}
                          title="Delete"
                          color="error"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, id: null, number: '' })}>
        <DialogTitle>Delete Delivery Note</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete delivery note <strong>{deleteDialog.number}</strong>?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, id: null, number: '' })}>
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
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

export default DeliveryNoteList;