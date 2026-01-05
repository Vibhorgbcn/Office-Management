import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
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
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Grid,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ReceiptIcon from '@mui/icons-material/Receipt';
import axios from 'axios';
import { format } from 'date-fns';

const Bills = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [bills, setBills] = useState([]);
  const [cases, setCases] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feeRates, setFeeRates] = useState(null);
  const [formData, setFormData] = useState({
    caseId: '',
    feeStructure: 'hourly',
    hours: '',
    baseAmount: '',
    dueDate: '',
  });
  const [selectedCase, setSelectedCase] = useState(null);

  useEffect(() => {
    fetchBills();
    fetchCases();
    fetchFeeRates();
  }, []);

  useEffect(() => {
    if (formData.caseId) {
      const caseItem = cases.find(c => c._id === formData.caseId);
      setSelectedCase(caseItem);
    }
  }, [formData.caseId, cases]);

  const fetchBills = async () => {
    try {
      const response = await axios.get('/bills');
      setBills(response.data);
    } catch (error) {
      console.error('Error fetching bills:', error);
    }
  };

  const fetchCases = async () => {
    try {
      const response = await axios.get('/cases');
      setCases(response.data);
    } catch (error) {
      console.error('Error fetching cases:', error);
    }
  };

  const fetchFeeRates = async () => {
    try {
      const response = await axios.get('/bills/fee-rates');
      setFeeRates(response.data);
    } catch (error) {
      console.error('Error fetching fee rates:', error);
    }
  };

  const handleGenerateBill = async () => {
    setLoading(true);
    try {
      const billData = {
        ...formData,
        hours: formData.feeStructure === 'hourly' ? parseFloat(formData.hours) : undefined,
        baseAmount: formData.baseAmount ? parseFloat(formData.baseAmount) : undefined,
        dueDate: formData.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      };

      await axios.post('/bills/generate', billData);
      setOpenDialog(false);
      setFormData({
        caseId: '',
        feeStructure: 'hourly',
        hours: '',
        baseAmount: '',
        dueDate: '',
      });
      setSelectedCase(null);
      fetchBills();
      alert('Bill generated successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to generate bill');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'default',
      sent: 'info',
      paid: 'success',
      overdue: 'error',
      cancelled: 'default',
    };
    return colors[status] || 'default';
  };

  const getClientTypeFeeRates = () => {
    if (!selectedCase || !feeRates) return null;
    return feeRates[selectedCase.clientType] || feeRates.regular;
  };

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', px: { xs: 1, sm: 0 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 2, sm: 3 }, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>Bills</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
          size={isMobile ? 'medium' : 'large'}
        >
          Generate Bill
        </Button>
      </Box>

      {selectedCase && feeRates && (
        <Card sx={{ mb: { xs: 2, sm: 3 }, width: '100%', maxWidth: '100%' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
              Client: {selectedCase.clientName} ({selectedCase.clientType})
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Fee Rates for {selectedCase.clientType} clients:
            </Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6} md={3}>
                <Typography variant="body2">Hourly: ₹{getClientTypeFeeRates()?.hourly?.toLocaleString()}</Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="body2">Fixed: ₹{getClientTypeFeeRates()?.fixed?.toLocaleString()}</Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="body2">Contingency: {(getClientTypeFeeRates()?.contingency * 100)}%</Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="body2">Retainer: ₹{getClientTypeFeeRates()?.retainer?.toLocaleString()}</Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      <TableContainer 
        component={Paper} 
        sx={{ 
          maxHeight: { xs: 'calc(100vh - 400px)', sm: 'none' }, 
          overflowX: 'auto',
          width: '100%',
          maxWidth: '100%',
          '& .MuiTable-root': {
            minWidth: { xs: 600, sm: 'auto' }
          }
        }}
      >
        <Table size={isMobile ? 'small' : 'medium'} stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Bill Number</TableCell>
              <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Client</TableCell>
              <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Case</TableCell>
              <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Fee Structure</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Status</TableCell>
              <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Due Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {bills.map((bill) => (
              <TableRow key={bill._id}>
                <TableCell>
                  <Typography variant="body2" fontWeight={500}>
                    {bill.billNumber}
                  </Typography>
                  {/* Mobile: Show compact info */}
                  <Box sx={{ display: { xs: 'block', sm: 'none' }, mt: 0.5 }}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {bill.clientName}
                    </Typography>
                    {bill.caseId && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        Case: {bill.caseId.caseNumber}
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary" display="block">
                      {bill.feeStructure}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Due: {format(new Date(bill.dueDate), 'dd-MM-yyyy')}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{bill.clientName}</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{bill.caseId?.caseNumber || 'N/A'}</TableCell>
                <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{bill.feeStructure}</TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={600} color="primary">
                    ₹{bill.totalAmount?.toLocaleString()}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={bill.status}
                    color={getStatusColor(bill.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                  {format(new Date(bill.dueDate), 'dd-MM-yyyy')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Generate Bill Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)} 
        maxWidth="md" 
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>Generate Bill</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth required>
              <InputLabel>Select Case</InputLabel>
              <Select
                value={formData.caseId}
                onChange={(e) => setFormData({ ...formData, caseId: e.target.value })}
                label="Select Case"
              >
                {cases.map((caseItem) => (
                  <MenuItem key={caseItem._id} value={caseItem._id}>
                    {caseItem.caseNumber} - {caseItem.clientName} ({caseItem.clientType})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel>Fee Structure</InputLabel>
              <Select
                value={formData.feeStructure}
                onChange={(e) => setFormData({ ...formData, feeStructure: e.target.value })}
                label="Fee Structure"
              >
                <MenuItem value="hourly">Hourly</MenuItem>
                <MenuItem value="fixed">Fixed</MenuItem>
                <MenuItem value="contingency">Contingency</MenuItem>
                <MenuItem value="retainer">Retainer</MenuItem>
              </Select>
            </FormControl>

            {formData.feeStructure === 'hourly' && (
              <TextField
                label="Hours"
                type="number"
                value={formData.hours}
                onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                fullWidth
                required
              />
            )}

            {formData.feeStructure === 'contingency' && (
              <TextField
                label="Case Value (Base Amount)"
                type="number"
                value={formData.baseAmount}
                onChange={(e) => setFormData({ ...formData, baseAmount: e.target.value })}
                fullWidth
                helperText="Enter the case value for contingency calculation"
              />
            )}

            {formData.feeStructure === 'fixed' || formData.feeStructure === 'retainer' ? (
              <Alert severity="info">
                Amount will be automatically calculated based on client type.
              </Alert>
            ) : null}

            <TextField
              label="Due Date"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpenDialog(false);
            setSelectedCase(null);
          }}>Cancel</Button>
          <Button onClick={handleGenerateBill} variant="contained" disabled={loading}>
            Generate Bill
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Bills;

