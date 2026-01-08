import React, { useState, useEffect } from 'react';
import {
  Box, Button, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Select, FormControl,
  InputLabel, Alert, Grid, IconButton, useMediaQuery, useTheme, Tabs, Tab,
  InputAdornment
} from '@mui/material';
import {
  Add, Edit, Delete, Visibility, Search, Receipt, CheckCircle, Cancel,
  AttachFile, Close
} from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

const Expenses = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [expenses, setExpenses] = useState([]);
  const [cases, setCases] = useState([]);
  const [clients, setClients] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    expenseNumber: '',
    title: '',
    description: '',
    amount: '',
    expenseType: 'court-fee',
    caseId: '',
    clientId: '',
    expenseDate: format(new Date(), 'yyyy-MM-dd'),
    paymentMethod: 'cash',
    receipt: null
  });

  useEffect(() => {
    fetchExpenses();
    fetchCases();
    fetchClients();
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await axios.get('/expenses');
      setExpenses(response.data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
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

  const fetchClients = async () => {
    try {
      const response = await axios.get('/clients');
      setClients(response.data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const handleCreateExpense = async () => {
    setLoading(true);
    setError('');
    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        if (key !== 'receipt' && formData[key] !== '') {
          formDataToSend.append(key, formData[key]);
        }
      });
      if (formData.receipt) {
        formDataToSend.append('receipt', formData.receipt);
      }

      await axios.post('/expenses', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setSuccess('Expense created successfully');
      setOpenDialog(false);
      setFormData({
        expenseNumber: '',
        title: '',
        description: '',
        amount: '',
        expenseType: 'court-fee',
        caseId: '',
        clientId: '',
        expenseDate: format(new Date(), 'yyyy-MM-dd'),
        paymentMethod: 'cash',
        receipt: null
      });
      fetchExpenses();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create expense');
    } finally {
      setLoading(false);
    }
  };

  const handleViewExpense = async (expense) => {
    try {
      const response = await axios.get(`/expenses/${expense._id}`);
      setSelectedExpense(response.data);
      setViewDialogOpen(true);
    } catch (error) {
      setError('Failed to load expense details');
    }
  };

  const handleApproveExpense = async (id, status) => {
    try {
      await axios.put(`/expenses/${id}/approve`, { status });
      setSuccess(`Expense ${status} successfully`);
      fetchExpenses();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update expense');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      approved: 'success',
      rejected: 'error',
      reimbursed: 'info'
    };
    return colors[status] || 'default';
  };

  const getTypeColor = (type) => {
    const colors = {
      'court-fee': 'error',
      travel: 'info',
      document: 'primary',
      consultation: 'warning',
      miscellaneous: 'default',
      other: 'default'
    };
    return colors[type] || 'default';
  };

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = !searchQuery || 
      expense.expenseNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.title?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === 'all' || expense.expenseType === filterType;

    return matchesSearch && matchesType;
  });

  const tabFilteredExpenses = filteredExpenses.filter(expense => {
    if (tabValue === 0) return expense.status === 'pending';
    if (tabValue === 1) return expense.status === 'approved';
    if (tabValue === 2) return expense.status === 'reimbursed';
    return true;
  });

  const totalAmount = tabFilteredExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', px: { xs: 1, sm: 0 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
          Expense Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenDialog(true)}
        >
          Add Expense
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Summary Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Typography variant="h4" color="primary">₹{totalAmount.toLocaleString()}</Typography>
              <Typography variant="body2" color="text.secondary">Total Amount</Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="h4" color="warning.main">
                {tabFilteredExpenses.filter(e => e.status === 'pending').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">Pending Approval</Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="h4" color="success.main">
                {tabFilteredExpenses.filter(e => e.status === 'approved').length}
              </Typography>
              <Typography variant="body2" color="text.secondary">Approved</Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search expenses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Expense Type</InputLabel>
                <Select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  label="Expense Type"
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="court-fee">Court Fee</MenuItem>
                  <MenuItem value="travel">Travel</MenuItem>
                  <MenuItem value="document">Document</MenuItem>
                  <MenuItem value="consultation">Consultation</MenuItem>
                  <MenuItem value="miscellaneous">Miscellaneous</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label="Pending" />
          <Tab label="Approved" />
          <Tab label="Reimbursed" />
          <Tab label="All" />
        </Tabs>
      </Box>

      {/* Expenses Table */}
      <TableContainer component={Paper} sx={{ maxHeight: { xs: 'calc(100vh - 500px)', sm: 'none' }, overflowX: 'auto' }}>
        <Table size={isMobile ? 'small' : 'medium'} stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Expense #</TableCell>
              <TableCell>Title</TableCell>
              <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Type</TableCell>
              <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Case/Client</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(tabValue === 3 ? filteredExpenses : tabFilteredExpenses).map((expense) => (
              <TableRow key={expense._id} hover>
                <TableCell>
                  <Typography variant="body2" fontWeight={500}>
                    {expense.expenseNumber}
                  </Typography>
                </TableCell>
                <TableCell>{expense.title}</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                  <Chip
                    label={expense.expenseType.replace('-', ' ')}
                    color={getTypeColor(expense.expenseType)}
                    size="small"
                  />
                </TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                  {expense.caseId ? (
                    <Typography variant="body2">{expense.caseId.caseNumber}</Typography>
                  ) : expense.clientId ? (
                    <Typography variant="body2">{expense.clientId.name}</Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">-</Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={500}>
                    ₹{expense.amount?.toLocaleString()}
                  </Typography>
                </TableCell>
                <TableCell>
                  {format(new Date(expense.expenseDate), 'dd-MM-yyyy')}
                </TableCell>
                <TableCell>
                  <Chip
                    label={expense.status}
                    color={getStatusColor(expense.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton size="small" onClick={() => handleViewExpense(expense)}>
                      <Visibility fontSize="small" />
                    </IconButton>
                    {expense.status === 'pending' && user?.role === 'admin' && (
                      <>
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handleApproveExpense(expense._id, 'approved')}
                        >
                          <CheckCircle fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleApproveExpense(expense._id, 'rejected')}
                        >
                          <Cancel fontSize="small" />
                        </IconButton>
                      </>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Expense Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth fullScreen={isMobile}>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Add Expense</Typography>
            <IconButton onClick={() => setOpenDialog(false)} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Expense Number"
                value={formData.expenseNumber}
                onChange={(e) => setFormData({ ...formData, expenseNumber: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Expense Type</InputLabel>
                <Select
                  value={formData.expenseType}
                  onChange={(e) => setFormData({ ...formData, expenseType: e.target.value })}
                  label="Expense Type"
                >
                  <MenuItem value="court-fee">Court Fee</MenuItem>
                  <MenuItem value="travel">Travel</MenuItem>
                  <MenuItem value="document">Document</MenuItem>
                  <MenuItem value="consultation">Consultation</MenuItem>
                  <MenuItem value="miscellaneous">Miscellaneous</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Amount (₹)"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Expense Date"
                value={formData.expenseDate}
                onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Case (Optional)</InputLabel>
                <Select
                  value={formData.caseId}
                  onChange={(e) => setFormData({ ...formData, caseId: e.target.value })}
                  label="Case (Optional)"
                >
                  <MenuItem value="">None</MenuItem>
                  {cases.map((caseItem) => (
                    <MenuItem key={caseItem._id} value={caseItem._id}>
                      {caseItem.caseNumber} - {caseItem.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Client (Optional)</InputLabel>
                <Select
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  label="Client (Optional)"
                >
                  <MenuItem value="">None</MenuItem>
                  {clients.map((client) => (
                    <MenuItem key={client._id} value={client._id}>
                      {client.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Payment Method</InputLabel>
                <Select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  label="Payment Method"
                >
                  <MenuItem value="cash">Cash</MenuItem>
                  <MenuItem value="cheque">Cheque</MenuItem>
                  <MenuItem value="bank-transfer">Bank Transfer</MenuItem>
                  <MenuItem value="online">Online</MenuItem>
                  <MenuItem value="credit-card">Credit Card</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                startIcon={<AttachFile />}
                sx={{ height: 56 }}
              >
                {formData.receipt ? formData.receipt.name : 'Upload Receipt'}
                <input
                  type="file"
                  hidden
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setFormData({ ...formData, receipt: e.target.files[0] })}
                />
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateExpense} variant="contained" disabled={loading || !formData.expenseNumber || !formData.title || !formData.amount}>
            {loading ? 'Creating...' : 'Create Expense'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Expense Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="sm" fullWidth>
        {selectedExpense && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">{selectedExpense.title}</Typography>
                <Chip
                  label={selectedExpense.status}
                  color={getStatusColor(selectedExpense.status)}
                  size="small"
                />
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Expense Number</Typography>
                  <Typography variant="body1">{selectedExpense.expenseNumber}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Amount</Typography>
                  <Typography variant="h6" color="primary">₹{selectedExpense.amount?.toLocaleString()}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Type</Typography>
                  <Chip
                    label={selectedExpense.expenseType.replace('-', ' ')}
                    color={getTypeColor(selectedExpense.expenseType)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Date</Typography>
                  <Typography variant="body1">
                    {format(new Date(selectedExpense.expenseDate), 'dd-MM-yyyy')}
                  </Typography>
                </Grid>
                {selectedExpense.caseId && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Case</Typography>
                    <Typography variant="body1">
                      {selectedExpense.caseId.caseNumber} - {selectedExpense.caseId.title}
                    </Typography>
                  </Grid>
                )}
                {selectedExpense.clientId && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Client</Typography>
                    <Typography variant="body1">{selectedExpense.clientId.name}</Typography>
                  </Grid>
                )}
                {selectedExpense.description && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">Description</Typography>
                    <Typography variant="body1">{selectedExpense.description}</Typography>
                  </Grid>
                )}
                {selectedExpense.receipt && (
                  <Grid item xs={12}>
                    <Button
                      variant="outlined"
                      startIcon={<Receipt />}
                      onClick={() => window.open(`/${selectedExpense.receipt.url}`, '_blank')}
                    >
                      View Receipt
                    </Button>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default Expenses;

