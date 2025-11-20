import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Paper,
  Stack,
  Tooltip,
  Alert,
  CircularProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as CopyIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon
} from '@mui/icons-material';
import pricelistService from '../services/pricelistService';
import { toast } from 'react-toastify';

export default function PriceListList() {
  const navigate = useNavigate();
  const [pricelists, setPricelists] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPricelists();
  }, []);

  const fetchPricelists = async () => {
    try {
      setLoading(true);
      const response = await pricelistService.getAll({ includeItems: false });
      setPricelists(response.data || []);
    } catch (error) {
      console.error('Error fetching pricelists:', error);
      toast.error('Failed to load price lists');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to deactivate "${name}"?`)) {
      return;
    }

    try {
      await pricelistService.delete(id);
      toast.success('Price list deactivated');
      fetchPricelists();
    } catch (error) {
      console.error('Error deleting pricelist:', error);
      toast.error(error.response?.data?.message || 'Failed to deactivate price list');
    }
  };

  const handleCopy = async (id) => {
    navigate(`/pricelists/new?copyFrom=${id}`);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Price Lists</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/pricelists/new')}
        >
          New Price List
        </Button>
      </Stack>

      {pricelists.length === 0 ? (
        <Alert severity="info">
          No price lists found. Create your first price list to manage product pricing.
        </Alert>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date Range</TableCell>
                <TableCell>Products</TableCell>
                <TableCell>Currency</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pricelists.map((pricelist) => (
                <TableRow
                  key={pricelist.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/pricelists/${pricelist.id}`)}
                >
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body1">{pricelist.name}</Typography>
                      {pricelist.isDefault && (
                        <Chip label="Default" size="small" color="primary" />
                      )}
                    </Stack>
                    {pricelist.description && (
                      <Typography variant="caption" color="textSecondary">
                        {pricelist.description}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {pricelist.isActive ? (
                      <Chip
                        icon={<ActiveIcon />}
                        label="Active"
                        size="small"
                        color="success"
                        variant="outlined"
                      />
                    ) : (
                      <Chip
                        icon={<InactiveIcon />}
                        label="Inactive"
                        size="small"
                        color="default"
                        variant="outlined"
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {pricelist.dateRange || 'No date range'}
                    </Typography>
                  </TableCell>
                  <TableCell>{pricelist.productCount || 0}</TableCell>
                  <TableCell>{pricelist.currency || 'AED'}</TableCell>
                  <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                    <Tooltip title="Edit">
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/pricelists/${pricelist.id}/edit`)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Copy">
                      <IconButton
                        size="small"
                        onClick={() => handleCopy(pricelist.id)}
                      >
                        <CopyIcon />
                      </IconButton>
                    </Tooltip>
                    {!pricelist.isDefault && (
                      <Tooltip title="Deactivate">
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(pricelist.id, pricelist.name)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
