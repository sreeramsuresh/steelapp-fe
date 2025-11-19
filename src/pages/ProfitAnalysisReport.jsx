import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
  TextField,
  Button,
  Stack,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  Download as DownloadIcon,
  TrendingUp as ProfitIcon,
  AttachMoney as RevenueIcon,
  ShoppingCart as SalesIcon
} from '@mui/icons-material';
import api from '../services/api';
import { toast } from 'react-toastify';

export default function ProfitAnalysisReport() {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [data, setData] = useState([]);
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalCost: 0,
    totalProfit: 0,
    averageMargin: 0,
    totalQuantity: 0
  });

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      setLoading(true);

      // Query to get profit by product
      const query = `
        SELECT
          p.id,
          p.name,
          p.category,
          p.grade,
          SUM(ii.quantity) as total_quantity,
          SUM(ii.amount) as total_revenue,
          SUM(ii.costPrice * ii.quantity) as total_cost,
          SUM(ii.profit * ii.quantity) as total_profit,
          AVG(ii.marginPercent) as avg_margin
        FROM invoice_items ii
        JOIN products p ON ii.productId = p.id
        JOIN invoices i ON ii.invoiceId = i.id
        WHERE i.invoiceDate BETWEEN $1 AND $2
          AND ii.costPrice IS NOT NULL
          AND i.status != 'cancelled'
        GROUP BY p.id, p.name, p.category, p.grade
        ORDER BY total_profit DESC
      `;

      const response = await api.post('/query', {
        query,
        params: [dateRange.startDate, dateRange.endDate]
      });

      const results = response.data?.results || [];
      setData(results);

      // Calculate summary
      const totals = results.reduce((acc, row) => ({
        totalRevenue: acc.totalRevenue + parseFloat(row.totalRevenue || 0),
        totalCost: acc.totalCost + parseFloat(row.totalCost || 0),
        totalProfit: acc.totalProfit + parseFloat(row.totalProfit || 0),
        totalQuantity: acc.totalQuantity + parseFloat(row.totalQuantity || 0)
      }), { totalRevenue: 0, totalCost: 0, totalProfit: 0, totalQuantity: 0 });

      const averageMargin = totals.totalRevenue > 0
        ? ((totals.totalProfit / totals.totalRevenue) * 100).toFixed(2)
        : 0;

      setSummary({
        ...totals,
        averageMargin: parseFloat(averageMargin)
      });

    } catch (error) {
      console.error('Error fetching report:', error);
      toast.error('Failed to load profit analysis');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Product', 'Category', 'Grade', 'Quantity', 'Revenue', 'Cost', 'Profit', 'Margin %'];
    const rows = data.map(row => [
      row.name,
      row.category,
      row.grade,
      row.totalQuantity,
      row.totalRevenue,
      row.totalCost,
      row.totalProfit,
      row.avgMargin
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `profit-analysis-${dateRange.startDate}-to-${dateRange.endDate}.csv`;
    a.click();
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Profit Analysis Report
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center">
            <TextField
              label="Start Date"
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="End Date"
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              InputLabelProps={{ shrink: true }}
            />
            <Button variant="contained" onClick={fetchReport} disabled={loading}>
              Generate Report
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={exportToCSV}
              disabled={loading || data.length === 0}
            >
              Export CSV
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Grid container spacing={3} mb={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <RevenueIcon color="primary" />
                    <Box>
                      <Typography variant="caption" color="textSecondary">
                        Total Revenue
                      </Typography>
                      <Typography variant="h6">
                        AED {summary.totalRevenue.toLocaleString()}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <ProfitIcon color="success" />
                    <Box>
                      <Typography variant="caption" color="textSecondary">
                        Total Profit
                      </Typography>
                      <Typography variant="h6" color="success.main">
                        AED {summary.totalProfit.toLocaleString()}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <SalesIcon color="info" />
                    <Box>
                      <Typography variant="caption" color="textSecondary">
                        Avg Margin
                      </Typography>
                      <Typography variant="h6">
                        {summary.averageMargin}%
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box>
                      <Typography variant="caption" color="textSecondary">
                        Items Sold
                      </Typography>
                      <Typography variant="h6">
                        {summary.totalQuantity.toLocaleString()}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell align="right">Qty Sold</TableCell>
                  <TableCell align="right">Revenue</TableCell>
                  <TableCell align="right">COGS</TableCell>
                  <TableCell align="right">Profit</TableCell>
                  <TableCell align="right">Margin</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Typography variant="body2">{row.name}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        {row.grade}
                      </Typography>
                    </TableCell>
                    <TableCell>{row.category}</TableCell>
                    <TableCell align="right">{parseFloat(row.totalQuantity).toLocaleString()}</TableCell>
                    <TableCell align="right">
                      AED {parseFloat(row.totalRevenue).toLocaleString()}
                    </TableCell>
                    <TableCell align="right">
                      AED {parseFloat(row.totalCost).toLocaleString()}
                    </TableCell>
                    <TableCell align="right">
                      <Typography color="success.main" fontWeight="bold">
                        AED {parseFloat(row.totalProfit).toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Chip
                        label={`${parseFloat(row.avgMargin).toFixed(1)}%`}
                        size="small"
                        color={parseFloat(row.avgMargin) > 30 ? 'success' : parseFloat(row.avgMargin) > 20 ? 'warning' : 'default'}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
}
