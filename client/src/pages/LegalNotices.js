import React, { useState, useEffect } from 'react';
import {
  Box, Button, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Select, FormControl,
  InputLabel, Alert, Grid, IconButton, useMediaQuery, useTheme, Tabs, Tab,
  Stepper, Step, StepLabel
} from '@mui/material';
import {
  Add, Edit, Delete, Description, Send, CheckCircle, Cancel, Visibility
} from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

const LegalNotices = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [notices, setNotices] = useState([]);
  const [clients, setClients] = useState([]);
  const [cases, setCases] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    noticeNumber: '',
    title: '',
    noticeType: 'demand',
    clientId: '',
    caseId: '',
    content: '',
    amount: '',
    recipient: {
      name: '',
      address: {
        street: '',
        city: '',
        state: '',
        pincode: ''
      },
      email: '',
      phone: ''
    }
  });

  useEffect(() => {
    fetchNotices();
    fetchClients();
    fetchCases();
  }, []);

  const fetchNotices = async () => {
    try {
      const response = await axios.get('/legal-notices');
      setNotices(response.data);
    } catch (error) {
      console.error('Error fetching notices:', error);
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
      await axios.post('/legal-notices', formData);
      setSuccess('Legal notice created successfully');
      setOpenDialog(false);
      setFormData({
        noticeNumber: '',
        title: '',
        noticeType: 'demand',
        clientId: '',
        caseId: '',
        content: '',
        amount: '',
        recipient: {
          name: '',
          address: {
            street: '',
            city: '',
            state: '',
            pincode: ''
          },
          email: '',
          phone: ''
        }
      });
      fetchNotices();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create legal notice');
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (notice) => {
    try {
      const response = await axios.get(`/legal-notices/${notice._id}`);
      setSelectedNotice(response.data);
      setViewDialogOpen(true);
    } catch (error) {
      setError('Failed to load notice details');
    }
  };

  const handleSend = async (id) => {
    try {
      await axios.put(`/legal-notices/${id}/send`, {
        sentVia: 'email',
        trackingNumber: ''
      });
      setSuccess('Notice marked as sent');
      fetchNotices();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to send notice');
    }
  };

  const handleUpdateWorkflow = async (id, stage) => {
    try {
      await axios.put(`/legal-notices/${id}/update-workflow`, {
        stage,
        action: `Moved to ${stage}`,
        notes: ''
      });
      setSuccess('Workflow updated successfully');
      fetchNotices();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update workflow');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'default',
      sent: 'info',
      delivered: 'success',
      acknowledged: 'success',
      responded: 'success',
      escalated: 'warning',
      closed: 'default'
    };
    return colors[status] || 'default';
  };

  const getStageColor = (stage) => {
    const colors = {
      notice: 'info',
      reminder: 'warning',
      'legal-action': 'error',
      litigation: 'error',
      recovery: 'success',
      closed: 'default'
    };
    return colors[stage] || 'default';
  };

  const workflowSteps = ['notice', 'reminder', 'legal-action', 'litigation', 'recovery', 'closed'];

  const filteredNotices = notices.filter(notice => {
    if (tabValue === 0) return notice.status === 'draft';
    if (tabValue === 1) return notice.status === 'sent' || notice.status === 'delivered';
    if (tabValue === 2) return notice.recoveryWorkflow?.stage === 'litigation' || notice.recoveryWorkflow?.stage === 'recovery';
    return true;
  });

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', px: { xs: 1, sm: 0 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
          Legal Notices & Collections
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenDialog(true)}
        >
          Create Notice
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
          <Tab label="Draft" />
          <Tab label="Sent" />
          <Tab label="Recovery" />
          <Tab label="All" />
        </Tabs>
      </Box>

      <TableContainer component={Paper} sx={{ maxHeight: { xs: 'calc(100vh - 400px)', sm: 'none' }, overflowX: 'auto' }}>
        <Table size={isMobile ? 'small' : 'medium'} stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Notice Number</TableCell>
              <TableCell>Title</TableCell>
              <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Type</TableCell>
              <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Client</TableCell>
              <TableCell>Status</TableCell>
              <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Stage</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(tabValue === 3 ? notices : filteredNotices).map((notice) => (
              <TableRow key={notice._id}>
                <TableCell>
                  <Typography variant="body2" fontWeight={500}>
                    {notice.noticeNumber}
                  </Typography>
                </TableCell>
                <TableCell>{notice.title}</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                  {notice.noticeType}
                </TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                  {notice.clientId?.name || '-'}
                </TableCell>
                <TableCell>
                  <Chip
                    label={notice.status}
                    color={getStatusColor(notice.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                  {notice.recoveryWorkflow?.stage && (
                    <Chip
                      label={notice.recoveryWorkflow.stage}
                      color={getStageColor(notice.recoveryWorkflow.stage)}
                      size="small"
                    />
                  )}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton size="small" onClick={() => handleView(notice)}>
                      <Visibility fontSize="small" />
                    </IconButton>
                    {notice.status === 'draft' && (
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleSend(notice._id)}
                      >
                        <Send fontSize="small" />
                      </IconButton>
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
        <DialogTitle>Create Legal Notice</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Notice Number"
                value={formData.noticeNumber}
                onChange={(e) => setFormData({ ...formData, noticeNumber: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Notice Type</InputLabel>
                <Select
                  value={formData.noticeType}
                  onChange={(e) => setFormData({ ...formData, noticeType: e.target.value })}
                  label="Notice Type"
                >
                  <MenuItem value="demand">Demand</MenuItem>
                  <MenuItem value="legal">Legal</MenuItem>
                  <MenuItem value="recovery">Recovery</MenuItem>
                  <MenuItem value="termination">Termination</MenuItem>
                  <MenuItem value="breach">Breach</MenuItem>
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
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Amount"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={6}
                label="Notice Content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>Recipient Details</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Recipient Name"
                value={formData.recipient.name}
                onChange={(e) => setFormData({
                  ...formData,
                  recipient: { ...formData.recipient, name: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                value={formData.recipient.email}
                onChange={(e) => setFormData({
                  ...formData,
                  recipient: { ...formData.recipient, email: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={formData.recipient.phone}
                onChange={(e) => setFormData({
                  ...formData,
                  recipient: { ...formData.recipient, phone: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address"
                value={formData.recipient.address.street}
                onChange={(e) => setFormData({
                  ...formData,
                  recipient: {
                    ...formData.recipient,
                    address: { ...formData.recipient.address, street: e.target.value }
                  }
                })}
                placeholder="Street Address"
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="City"
                value={formData.recipient.address.city}
                onChange={(e) => setFormData({
                  ...formData,
                  recipient: {
                    ...formData.recipient,
                    address: { ...formData.recipient.address, city: e.target.value }
                  }
                })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="State"
                value={formData.recipient.address.state}
                onChange={(e) => setFormData({
                  ...formData,
                  recipient: {
                    ...formData.recipient,
                    address: { ...formData.recipient.address, state: e.target.value }
                  }
                })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Pincode"
                value={formData.recipient.address.pincode}
                onChange={(e) => setFormData({
                  ...formData,
                  recipient: {
                    ...formData.recipient,
                    address: { ...formData.recipient.address, pincode: e.target.value }
                  }
                })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleCreate} variant="contained" disabled={loading || !formData.noticeNumber || !formData.title || !formData.content}>
            {loading ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth fullScreen={isMobile}>
        <DialogTitle>
          {selectedNotice?.title}
          <Chip
            label={selectedNotice?.status}
            color={getStatusColor(selectedNotice?.status)}
            size="small"
            sx={{ ml: 2 }}
          />
        </DialogTitle>
        <DialogContent>
          {selectedNotice && (
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Notice Number: {selectedNotice.noticeNumber}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Type: {selectedNotice.noticeType}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Client: {selectedNotice.clientId?.name}
              </Typography>
              {selectedNotice.recoveryWorkflow && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="h6" gutterBottom>Recovery Workflow</Typography>
                  <Stepper activeStep={workflowSteps.indexOf(selectedNotice.recoveryWorkflow.stage)} alternativeLabel>
                    {workflowSteps.map((step) => (
                      <Step key={step}>
                        <StepLabel>{step}</StepLabel>
                      </Step>
                    ))}
                  </Stepper>
                </Box>
              )}
              <Box sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>Content</Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {selectedNotice.content}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          {selectedNotice?.status === 'draft' && (
            <Button onClick={() => handleSend(selectedNotice._id)} variant="contained" startIcon={<Send />}>
              Send Notice
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LegalNotices;

