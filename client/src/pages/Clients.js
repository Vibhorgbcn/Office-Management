import React, { useState, useEffect } from 'react';
import {
  Box, Button, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Select, FormControl,
  InputLabel, Alert, Grid, IconButton, useMediaQuery, useTheme, Tabs, Tab,
  InputAdornment, Avatar, Divider, List, ListItem, ListItemText, ListItemAvatar,
  Badge
} from '@mui/material';
import {
  Add, Edit, Delete, Visibility, Search, Phone, Email, Person,
  Business, CalendarToday, Assignment, Receipt, History, Close
} from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Clients = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [clients, setClients] = useState([]);
  const [cases, setCases] = useState([]);
  const [bills, setBills] = useState([]);
  const [interactions, setInteractions] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [interactionDialogOpen, setInteractionDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterClientType, setFilterClientType] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    alternatePhone: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: ''
    },
    clientType: 'regular',
    pan: '',
    gstin: '',
    organizationName: '',
    assignedTo: '',
    status: 'active',
    notes: ''
  });
  const [interactionForm, setInteractionForm] = useState({
    interactionType: 'call',
    subject: '',
    description: '',
    interactionDate: format(new Date(), 'yyyy-MM-dd'),
    durationMinutes: '',
    followUpRequired: false,
    followUpDate: ''
  });

  useEffect(() => {
    fetchClients();
    if (user?.role === 'admin') {
      fetchCases();
      fetchBills();
    }
  }, [user]);

  useEffect(() => {
    if (selectedClient) {
      fetchInteractions(selectedClient._id);
    }
  }, [selectedClient]);

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

  const fetchBills = async () => {
    try {
      const response = await axios.get('/bills');
      setBills(response.data);
    } catch (error) {
      console.error('Error fetching bills:', error);
    }
  };

  const fetchInteractions = async (clientId) => {
    try {
      const response = await axios.get(`/clients/${clientId}/interactions`);
      setInteractions(response.data);
    } catch (error) {
      console.error('Error fetching interactions:', error);
    }
  };

  const handleCreateClient = async () => {
    setLoading(true);
    setError('');
    try {
      await axios.post('/clients', formData);
      setSuccess('Client created successfully');
      setOpenDialog(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        alternatePhone: '',
        address: { street: '', city: '', state: '', pincode: '' },
        clientType: 'regular',
        pan: '',
        gstin: '',
        organizationName: '',
        assignedTo: '',
        status: 'active',
        notes: ''
      });
      fetchClients();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create client');
    } finally {
      setLoading(false);
    }
  };

  const handleViewClient = async (client) => {
    try {
      const response = await axios.get(`/clients/${client._id}`);
      setSelectedClient(response.data);
      setViewDialogOpen(true);
      fetchInteractions(client._id);
    } catch (error) {
      setError('Failed to load client details');
    }
  };

  const handleAddInteraction = async () => {
    if (!selectedClient) return;
    
    try {
      await axios.post(`/clients/${selectedClient._id}/interactions`, interactionForm);
      setSuccess('Interaction logged successfully');
      setInteractionDialogOpen(false);
      setInteractionForm({
        interactionType: 'call',
        subject: '',
        description: '',
        interactionDate: format(new Date(), 'yyyy-MM-dd'),
        durationMinutes: '',
        followUpRequired: false,
        followUpDate: ''
      });
      fetchInteractions(selectedClient._id);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to add interaction');
    }
  };

  const getClientTypeColor = (type) => {
    const colors = {
      regular: 'default',
      known: 'info',
      government: 'warning',
      corporate: 'primary',
      'pro-bono': 'success'
    };
    return colors[type] || 'default';
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = !searchQuery || 
      client.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.phone?.includes(searchQuery);
    
    const matchesStatus = filterStatus === 'all' || client.status === filterStatus;
    const matchesType = filterClientType === 'all' || client.clientType === filterClientType;

    return matchesSearch && matchesStatus && matchesType;
  });

  const clientCases = selectedClient ? cases.filter(c => c.clientId === selectedClient._id) : [];
  const clientBills = selectedClient ? bills.filter(b => b.clientName === selectedClient.name) : [];

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', px: { xs: 1, sm: 0 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
          Client Management
        </Typography>
        {user?.role === 'admin' && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenDialog(true)}
          >
            Add Client
          </Button>
        )}
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

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search clients by name, email, or phone..."
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
            <Grid item xs={6} sm={3} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                  <MenuItem value="prospect">Prospect</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select
                  value={filterClientType}
                  onChange={(e) => setFilterClientType(e.target.value)}
                  label="Type"
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="regular">Regular</MenuItem>
                  <MenuItem value="known">Known</MenuItem>
                  <MenuItem value="government">Government</MenuItem>
                  <MenuItem value="corporate">Corporate</MenuItem>
                  <MenuItem value="pro-bono">Pro-bono</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <TableContainer component={Paper} sx={{ maxHeight: { xs: 'calc(100vh - 400px)', sm: 'none' }, overflowX: 'auto' }}>
        <Table size={isMobile ? 'small' : 'medium'} stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Client Name</TableCell>
              <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Contact</TableCell>
              <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Cases</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredClients.map((client) => {
              const clientCaseCount = cases.filter(c => c.clientId === client._id).length;
              return (
                <TableRow key={client._id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                        {client.name?.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {client.name}
                        </Typography>
                        {client.organizationName && (
                          <Typography variant="caption" color="text.secondary">
                            {client.organizationName}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                    <Box>
                      {client.email && (
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Email fontSize="small" /> {client.email}
                        </Typography>
                      )}
                      <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Phone fontSize="small" /> {client.phone}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                    <Chip
                      label={client.clientType}
                      color={getClientTypeColor(client.clientType)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={client.status}
                      color={client.status === 'active' ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                    <Badge badgeContent={clientCaseCount} color="primary">
                      <Assignment />
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleViewClient(client)}
                    >
                      <Visibility fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Client Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth fullScreen={isMobile}>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Add New Client</Typography>
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
                label="Client Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Organization Name (Optional)"
                value={formData.organizationName}
                onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="email"
                label="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Alternate Phone"
                value={formData.alternatePhone}
                onChange={(e) => setFormData({ ...formData, alternatePhone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Client Type</InputLabel>
                <Select
                  value={formData.clientType}
                  onChange={(e) => setFormData({ ...formData, clientType: e.target.value })}
                  label="Client Type"
                >
                  <MenuItem value="regular">Regular</MenuItem>
                  <MenuItem value="known">Known</MenuItem>
                  <MenuItem value="government">Government</MenuItem>
                  <MenuItem value="corporate">Corporate</MenuItem>
                  <MenuItem value="pro-bono">Pro-bono</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Street Address"
                value={formData.address.street}
                onChange={(e) => setFormData({
                  ...formData,
                  address: { ...formData.address, street: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="City"
                value={formData.address.city}
                onChange={(e) => setFormData({
                  ...formData,
                  address: { ...formData.address, city: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="State"
                value={formData.address.state}
                onChange={(e) => setFormData({
                  ...formData,
                  address: { ...formData.address, state: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Pincode"
                value={formData.address.pincode}
                onChange={(e) => setFormData({
                  ...formData,
                  address: { ...formData.address, pincode: e.target.value }
                })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="PAN"
                value={formData.pan}
                onChange={(e) => setFormData({ ...formData, pan: e.target.value.toUpperCase() })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="GSTIN"
                value={formData.gstin}
                onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateClient} variant="contained" disabled={loading || !formData.name || !formData.phone}>
            {loading ? 'Creating...' : 'Create Client'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Client Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth fullScreen={isMobile}>
        {selectedClient && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ width: 48, height: 48, bgcolor: 'primary.main' }}>
                    {selectedClient.name?.charAt(0)}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{selectedClient.name}</Typography>
                    <Chip
                      label={selectedClient.clientType}
                      color={getClientTypeColor(selectedClient.clientType)}
                      size="small"
                      sx={{ mt: 0.5 }}
                    />
                  </Box>
                </Box>
                <IconButton onClick={() => setViewDialogOpen(false)} size="small">
                  <Close />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
                  <Tab label="Details" />
                  <Tab label="Cases" />
                  <Tab label="Bills" />
                  <Tab label="Interactions" />
                </Tabs>
              </Box>

              {/* Details Tab */}
              {tabValue === 0 && (
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                    <Typography variant="body1">{selectedClient.email || '-'}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Phone</Typography>
                    <Typography variant="body1">{selectedClient.phone}</Typography>
                  </Grid>
                  {selectedClient.address && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">Address</Typography>
                      <Typography variant="body1">
                        {[
                          selectedClient.address.street,
                          selectedClient.address.city,
                          selectedClient.address.state,
                          selectedClient.address.pincode
                        ].filter(Boolean).join(', ')}
                      </Typography>
                    </Grid>
                  )}
                  {selectedClient.pan && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">PAN</Typography>
                      <Typography variant="body1">{selectedClient.pan}</Typography>
                    </Grid>
                  )}
                  {selectedClient.gstin && (
                    <Grid item xs={12} sm={6}>
                      <Typography variant="subtitle2" color="text.secondary">GSTIN</Typography>
                      <Typography variant="body1">{selectedClient.gstin}</Typography>
                    </Grid>
                  )}
                  {selectedClient.notes && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" color="text.secondary">Notes</Typography>
                      <Typography variant="body1">{selectedClient.notes}</Typography>
                    </Grid>
                  )}
                </Grid>
              )}

              {/* Cases Tab */}
              {tabValue === 1 && (
                <List>
                  {clientCases.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                      No cases found for this client
                    </Typography>
                  ) : (
                    clientCases.map((caseItem) => (
                      <ListItem
                        key={caseItem._id}
                        button
                        onClick={() => {
                          setViewDialogOpen(false);
                          navigate(`/admin/case-workspace/${caseItem._id}`);
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar>
                            <Assignment />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={caseItem.caseNumber}
                          secondary={`${caseItem.title} • ${caseItem.court} • ${caseItem.status}`}
                        />
                      </ListItem>
                    ))
                  )}
                </List>
              )}

              {/* Bills Tab */}
              {tabValue === 2 && (
                <List>
                  {clientBills.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                      No bills found for this client
                    </Typography>
                  ) : (
                    clientBills.map((bill) => (
                      <ListItem key={bill._id}>
                        <ListItemAvatar>
                          <Avatar>
                            <Receipt />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={`${bill.billNumber} - ₹${bill.totalAmount}`}
                          secondary={`${bill.status} • ${format(new Date(bill.generatedAt), 'dd-MM-yyyy')}`}
                        />
                      </ListItem>
                    ))
                  )}
                </List>
              )}

              {/* Interactions Tab */}
              {tabValue === 3 && (
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                    <Button
                      variant="contained"
                      startIcon={<Add />}
                      onClick={() => setInteractionDialogOpen(true)}
                    >
                      Log Interaction
                    </Button>
                  </Box>
                  <List>
                    {interactions.length === 0 ? (
                      <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                        No interactions logged yet
                      </Typography>
                    ) : (
                      interactions.map((interaction) => (
                        <ListItem key={interaction._id} divider>
                          <ListItemAvatar>
                            <Avatar>
                              {interaction.interactionType === 'call' && <Phone />}
                              {interaction.interactionType === 'email' && <Email />}
                              {interaction.interactionType === 'meeting' && <Person />}
                              {!['call', 'email', 'meeting'].includes(interaction.interactionType) && <History />}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={interaction.subject}
                            secondary={
                              <>
                                <Typography component="span" variant="body2" color="text.primary">
                                  {interaction.interactionType} • {format(new Date(interaction.interactionDate), 'dd-MM-yyyy')}
                                </Typography>
                                {interaction.description && (
                                  <Typography variant="body2" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                                    {interaction.description}
                                  </Typography>
                                )}
                              </>
                            }
                          />
                        </ListItem>
                      ))
                    )}
                  </List>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Add Interaction Dialog */}
      <Dialog open={interactionDialogOpen} onClose={() => setInteractionDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Log Client Interaction</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Interaction Type</InputLabel>
                <Select
                  value={interactionForm.interactionType}
                  onChange={(e) => setInteractionForm({ ...interactionForm, interactionType: e.target.value })}
                  label="Interaction Type"
                >
                  <MenuItem value="call">Call</MenuItem>
                  <MenuItem value="email">Email</MenuItem>
                  <MenuItem value="meeting">Meeting</MenuItem>
                  <MenuItem value="whatsapp">WhatsApp</MenuItem>
                  <MenuItem value="document-exchange">Document Exchange</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Subject"
                value={interactionForm.subject}
                onChange={(e) => setInteractionForm({ ...interactionForm, subject: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={interactionForm.description}
                onChange={(e) => setInteractionForm({ ...interactionForm, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Interaction Date"
                value={interactionForm.interactionDate}
                onChange={(e) => setInteractionForm({ ...interactionForm, interactionDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Duration (minutes)"
                value={interactionForm.durationMinutes}
                onChange={(e) => setInteractionForm({ ...interactionForm, durationMinutes: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Follow Up Required</InputLabel>
                <Select
                  value={interactionForm.followUpRequired}
                  onChange={(e) => setInteractionForm({ ...interactionForm, followUpRequired: e.target.value === 'true' })}
                  label="Follow Up Required"
                >
                  <MenuItem value="false">No</MenuItem>
                  <MenuItem value="true">Yes</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {interactionForm.followUpRequired && (
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="date"
                  label="Follow Up Date"
                  value={interactionForm.followUpDate}
                  onChange={(e) => setInteractionForm({ ...interactionForm, followUpDate: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInteractionDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddInteraction} variant="contained" disabled={!interactionForm.subject}>
            Log Interaction
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Clients;

