import React, { useState, useEffect } from 'react';
import {
  Box, Button, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Select, FormControl,
  InputLabel, Alert, Grid, IconButton, useMediaQuery, useTheme, Tabs, Tab,
  Divider
} from '@mui/material';
import {
  Add, Edit, Delete, Description, CheckCircle, Cancel, Visibility, Send
} from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

const Contracts = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [contracts, setContracts] = useState([]);
  const [clients, setClients] = useState([]);
  const [cases, setCases] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    contractNumber: '',
    title: '',
    contractType: 'service-agreement',
    clientId: '',
    caseId: '',
    content: '',
    terms: {
      startDate: '',
      endDate: '',
      amount: '',
      paymentTerms: ''
    }
  });

  useEffect(() => {
    fetchContracts();
    fetchClients();
    fetchCases();
  }, []);

  const fetchContracts = async () => {
    try {
      const response = await axios.get('/contracts');
      setContracts(response.data);
    } catch (error) {
      console.error('Error fetching contracts:', error);
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

  const fetchCases = async () => {
    try {
      const response = await axios.get('/cases');
      setCases(response.data);
    } catch (error) {
      console.error('Error fetching cases:', error);
    }
  };

  const handleCreate = async () => {
    try {
      setLoading(true);
      setError('');
      await axios.post('/contracts', formData);
      setSuccess('Contract created successfully');
      setOpenDialog(false);
      setFormData({
        contractNumber: '',
        title: '',
        contractType: 'service-agreement',
        clientId: '',
        caseId: '',
        content: '',
        terms: {
          startDate: '',
          endDate: '',
          amount: '',
          paymentTerms: ''
        }
      });
      fetchContracts();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create contract');
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (contract) => {
    try {
      const response = await axios.get(`/contracts/${contract._id}`);
      setSelectedContract(response.data);
      setViewDialogOpen(true);
    } catch (error) {
      setError('Failed to load contract details');
    }
  };

  const handleApprove = async (id, status) => {
    try {
      await axios.put(`/contracts/${id}/approve`, { status, comments: '' });
      setSuccess(`Contract ${status} successfully`);
      fetchContracts();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update contract');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'default',
      'pending-review': 'warning',
      'under-review': 'info',
      approved: 'success',
      rejected: 'error',
      signed: 'success',
      expired: 'default',
      terminated: 'error'
    };
    return colors[status] || 'default';
  };

  const filteredContracts = contracts.filter(contract => {
    if (tabValue === 0) return contract.status === 'draft' || contract.status === 'pending-review';
    if (tabValue === 1) return contract.status === 'approved' || contract.status === 'signed';
    if (tabValue === 2) return contract.status === 'rejected' || contract.status === 'expired' || contract.status === 'terminated';
    return true;
  });

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', px: { xs: 1, sm: 0 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
          Contract Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenDialog(true)}
        >
          Create Contract
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

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label="Pending" />
          <Tab label="Approved/Signed" />
          <Tab label="Closed" />
          <Tab label="All" />
        </Tabs>
      </Box>

      <TableContainer component={Paper} sx={{ maxHeight: { xs: 'calc(100vh - 400px)', sm: 'none' }, overflowX: 'auto' }}>
        <Table size={isMobile ? 'small' : 'medium'} stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Contract Number</TableCell>
              <TableCell>Title</TableCell>
              <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Type</TableCell>
              <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Client</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(tabValue === 3 ? contracts : filteredContracts).map((contract) => (
              <TableRow key={contract._id}>
                <TableCell>
                  <Typography variant="body2" fontWeight={500}>
                    {contract.contractNumber}
                  </Typography>
                </TableCell>
                <TableCell>{contract.title}</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                  {contract.contractType.replace('-', ' ')}
                </TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                  {contract.clientId?.name || '-'}
                </TableCell>
                <TableCell>
                  <Chip
                    label={contract.status}
                    color={getStatusColor(contract.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton size="small" onClick={() => handleView(contract)}>
                      <Visibility fontSize="small" />
                    </IconButton>
                    {contract.status === 'pending-review' && user?.role === 'admin' && (
                      <>
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handleApprove(contract._id, 'approved')}
                        >
                          <CheckCircle fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleApprove(contract._id, 'rejected')}
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

      {/* Create Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth fullScreen={isMobile}>
        <DialogTitle>Create Contract</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Contract Number"
                value={formData.contractNumber}
                onChange={(e) => setFormData({ ...formData, contractNumber: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Contract Type</InputLabel>
                <Select
                  value={formData.contractType}
                  onChange={(e) => setFormData({ ...formData, contractType: e.target.value })}
                  label="Contract Type"
                >
                  <MenuItem value="service-agreement">Service Agreement</MenuItem>
                  <MenuItem value="retainer">Retainer</MenuItem>
                  <MenuItem value="consultation">Consultation</MenuItem>
                  <MenuItem value="partnership">Partnership</MenuItem>
                  <MenuItem value="employment">Employment</MenuItem>
                  <MenuItem value="nda">NDA</MenuItem>
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
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Client</InputLabel>
                <Select
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  label="Client"
                  required
                >
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
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={6}
                label="Contract Content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Start Date"
                value={formData.terms.startDate}
                onChange={(e) => setFormData({
                  ...formData,
                  terms: { ...formData.terms, startDate: e.target.value }
                })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="End Date"
                value={formData.terms.endDate}
                onChange={(e) => setFormData({
                  ...formData,
                  terms: { ...formData.terms, endDate: e.target.value }
                })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Amount"
                value={formData.terms.amount}
                onChange={(e) => setFormData({
                  ...formData,
                  terms: { ...formData.terms, amount: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Payment Terms"
                value={formData.terms.paymentTerms}
                onChange={(e) => setFormData({
                  ...formData,
                  terms: { ...formData.terms, paymentTerms: e.target.value }
                })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleCreate} variant="contained" disabled={loading || !formData.contractNumber || !formData.title || !formData.content}>
            {loading ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth fullScreen={isMobile}>
        <DialogTitle>
          {selectedContract?.title}
          <Chip
            label={selectedContract?.status}
            color={getStatusColor(selectedContract?.status)}
            size="small"
            sx={{ ml: 2 }}
          />
        </DialogTitle>
        <DialogContent>
          {selectedContract && (
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Contract Number: {selectedContract.contractNumber}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Type: {selectedContract.contractType}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Client: {selectedContract.clientId?.name}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>Content</Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {selectedContract.content}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Contracts;

