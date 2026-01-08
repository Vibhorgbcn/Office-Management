import React, { useState, useEffect } from 'react';
import {
  Box, Button, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Select, FormControl,
  InputLabel, Alert, useMediaQuery, useTheme, IconButton, Grid, Tabs, Tab,
  InputAdornment, Avatar, Badge
} from '@mui/material';
import {
  Add, Visibility, Search, FilterList, ViewList, ViewModule,
  CalendarToday, Person, Gavel, Assignment, TrendingUp, Close
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format, isPast, isToday, isTomorrow } from 'date-fns';

const Cases = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [cases, setCases] = useState([]);
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [openAssignDialog, setOpenAssignDialog] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCourt, setFilterCourt] = useState('all');
  const [filterCaseType, setFilterCaseType] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    caseNumber: '',
    title: '',
    description: '',
    clientId: '',
    clientType: 'regular',
    court: 'National Criminal Court',
    caseType: 'Criminal',
    priority: 'medium',
    filingDate: '',
    nextHearingDate: ''
  });

  useEffect(() => {
    fetchCases();
    fetchClients();
    if (user?.role === 'admin') {
      fetchEmployees();
    }
  }, [user]);

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

  const fetchEmployees = async () => {
    try {
      const response = await axios.get('/users/employees');
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleCreateCase = async () => {
    setLoading(true);
    setError('');
    try {
      const selectedClient = clients.find(c => c._id === formData.clientId);
      await axios.post('/cases', {
        ...formData,
        clientName: selectedClient?.name || '',
        clientId: formData.clientId || null
      });
      setSuccess('Case created successfully');
      setOpenDialog(false);
      setFormData({
        caseNumber: '',
        title: '',
        description: '',
        clientId: '',
        clientType: 'regular',
        court: 'National Criminal Court',
        caseType: 'Criminal',
        priority: 'medium',
        filingDate: '',
        nextHearingDate: ''
      });
      fetchCases();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create case');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignCase = async (caseId, employeeId) => {
    try {
      await axios.put(`/cases/${caseId}/assign`, { assignedTo: employeeId });
      setSuccess('Case assigned successfully');
      setOpenAssignDialog(false);
      setSelectedCase(null);
      fetchCases();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to assign case');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      assigned: 'info',
      'in-progress': 'primary',
      completed: 'success',
      closed: 'default',
    };
    return colors[status] || 'default';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'default',
      medium: 'info',
      high: 'warning',
      urgent: 'error'
    };
    return colors[priority] || 'default';
  };

  const getDueDateStatus = (date) => {
    if (!date) return 'default';
    if (isPast(new Date(date)) && !isToday(new Date(date))) return 'error';
    if (isToday(new Date(date))) return 'warning';
    if (isTomorrow(new Date(date))) return 'info';
    return 'default';
  };

  // Filter and search cases
  const filteredCases = cases.filter(caseItem => {
    const matchesSearch = !searchQuery || 
      caseItem.caseNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      caseItem.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      caseItem.clientName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || caseItem.status === filterStatus;
    const matchesCourt = filterCourt === 'all' || caseItem.court === filterCourt;
    const matchesCaseType = filterCaseType === 'all' || caseItem.caseType === filterCaseType;
    const matchesPriority = filterPriority === 'all' || caseItem.priority === filterPriority;

    return matchesSearch && matchesStatus && matchesCourt && matchesCaseType && matchesPriority;
  });

  // Tab filtering
  const tabFilteredCases = filteredCases.filter(caseItem => {
    if (tabValue === 0) return caseItem.status !== 'completed' && caseItem.status !== 'closed';
    if (tabValue === 1) return caseItem.status === 'completed' || caseItem.status === 'closed';
    if (tabValue === 2) {
      if (caseItem.nextHearingDate) {
        const hearingDate = new Date(caseItem.nextHearingDate);
        return isToday(hearingDate) || isTomorrow(hearingDate);
      }
      return false;
    }
    return true;
  });

  // Statistics
  const stats = {
    total: cases.length,
    active: cases.filter(c => c.status !== 'completed' && c.status !== 'closed').length,
    completed: cases.filter(c => c.status === 'completed' || c.status === 'closed').length,
    upcoming: cases.filter(c => {
      if (c.nextHearingDate) {
        const date = new Date(c.nextHearingDate);
        return isToday(date) || isTomorrow(date);
      }
      return false;
    }).length
  };

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', px: { xs: 1, sm: 0 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
          Case Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant={viewMode === 'list' ? 'contained' : 'outlined'}
            startIcon={<ViewList />}
            onClick={() => setViewMode('list')}
            size="small"
          >
            List
          </Button>
          <Button
            variant={viewMode === 'grid' ? 'contained' : 'outlined'}
            startIcon={<ViewModule />}
            onClick={() => setViewMode('grid')}
            size="small"
          >
            Grid
          </Button>
          {user?.role === 'admin' && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setOpenDialog(true)}
            >
              Create Case
            </Button>
          )}
        </Box>
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

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="primary">{stats.total}</Typography>
              <Typography variant="body2" color="text.secondary">Total Cases</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="info.main">{stats.active}</Typography>
              <Typography variant="body2" color="text.secondary">Active Cases</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="success.main">{stats.completed}</Typography>
              <Typography variant="body2" color="text.secondary">Completed</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent>
              <Typography variant="h4" color="warning.main">{stats.upcoming}</Typography>
              <Typography variant="body2" color="text.secondary">Upcoming Hearings</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search cases by number, title, or client..."
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
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="assigned">Assigned</MenuItem>
                  <MenuItem value="in-progress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="closed">Closed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Court</InputLabel>
                <Select
                  value={filterCourt}
                  onChange={(e) => setFilterCourt(e.target.value)}
                  label="Court"
                >
                  <MenuItem value="all">All Courts</MenuItem>
                  <MenuItem value="Supreme Court">Supreme Court</MenuItem>
                  <MenuItem value="High Court">High Court</MenuItem>
                  <MenuItem value="District Court">District Court</MenuItem>
                  <MenuItem value="National Criminal Court">National Criminal Court</MenuItem>
                  <MenuItem value="Special Court">Special Court</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Case Type</InputLabel>
                <Select
                  value={filterCaseType}
                  onChange={(e) => setFilterCaseType(e.target.value)}
                  label="Case Type"
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="Criminal">Criminal</MenuItem>
                  <MenuItem value="Civil">Civil</MenuItem>
                  <MenuItem value="Environment Law">Environment Law</MenuItem>
                  <MenuItem value="Constitutional">Constitutional</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} sm={3} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Priority</InputLabel>
                <Select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  label="Priority"
                >
                  <MenuItem value="all">All Priorities</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label="Active Cases" />
          <Tab label="Completed" />
          <Tab label="Upcoming Hearings" />
          <Tab label="All Cases" />
        </Tabs>
      </Box>

      {/* List View */}
      {viewMode === 'list' && (
        <TableContainer component={Paper} sx={{ maxHeight: { xs: 'calc(100vh - 500px)', sm: 'none' }, overflowX: 'auto' }}>
          <Table size={isMobile ? 'small' : 'medium'} stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Case Number</TableCell>
                <TableCell>Title</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Client</TableCell>
                <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Court</TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Next Hearing</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Assigned To</TableCell>
                {user?.role === 'admin' && <TableCell align="right">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {tabFilteredCases.map((caseItem) => (
                <TableRow 
                  key={caseItem._id}
                  sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
                  onClick={() => navigate(`/admin/case-workspace/${caseItem._id}`)}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {caseItem.caseNumber}
                    </Typography>
                    {caseItem.priority && (
                      <Chip
                        label={caseItem.priority}
                        color={getPriorityColor(caseItem.priority)}
                        size="small"
                        sx={{ mt: 0.5 }}
                      />
                    )}
                  </TableCell>
                  <TableCell>{caseItem.title}</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                    {caseItem.clientName}
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                    {caseItem.court}
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                    {caseItem.caseType}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={caseItem.status}
                      color={getStatusColor(caseItem.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                    {caseItem.nextHearingDate ? (
                      <Chip
                        label={format(new Date(caseItem.nextHearingDate), 'dd-MM-yyyy')}
                        color={getDueDateStatus(caseItem.nextHearingDate)}
                        size="small"
                        icon={<CalendarToday fontSize="small" />}
                      />
                    ) : (
                      <Typography variant="caption" color="text.secondary">-</Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                    {caseItem.assignedTo ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                          {caseItem.assignedTo.name?.charAt(0)}
                        </Avatar>
                        {caseItem.assignedTo.name}
                      </Box>
                    ) : (
                      <Typography variant="caption" color="text.secondary">Unassigned</Typography>
                    )}
                  </TableCell>
                  {user?.role === 'admin' && (
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <IconButton
                          size="small"
                          onClick={() => navigate(`/admin/case-workspace/${caseItem._id}`)}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                        {caseItem.status === 'pending' && (
                          <Button
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedCase(caseItem);
                              setOpenAssignDialog(true);
                            }}
                          >
                            Assign
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <Grid container spacing={2}>
          {tabFilteredCases.map((caseItem) => (
            <Grid item xs={12} sm={6} md={4} key={caseItem._id}>
              <Card
                sx={{
                  cursor: 'pointer',
                  '&:hover': { boxShadow: 4 },
                  borderLeft: `4px solid ${theme.palette[getPriorityColor(caseItem.priority)]?.main || 'gray'}`
                }}
                onClick={() => navigate(`/admin/case-workspace/${caseItem._id}`)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h6" fontWeight={600}>
                      {caseItem.caseNumber}
                    </Typography>
                    <Chip
                      label={caseItem.status}
                      color={getStatusColor(caseItem.status)}
                      size="small"
                    />
                  </Box>
                  <Typography variant="subtitle1" gutterBottom>
                    {caseItem.title}
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Person fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {caseItem.clientName}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Gavel fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {caseItem.court}
                      </Typography>
                    </Box>
                    {caseItem.nextHearingDate && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarToday fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {format(new Date(caseItem.nextHearingDate), 'dd-MM-yyyy')}
                        </Typography>
                      </Box>
                    )}
                    {caseItem.assignedTo && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Assignment fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {caseItem.assignedTo.name}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Case Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth fullScreen={isMobile}>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Create New Case</Typography>
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
                label="Case Number"
                value={formData.caseNumber}
                onChange={(e) => setFormData({ ...formData, caseNumber: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Filing Date"
                value={formData.filingDate}
                onChange={(e) => setFormData({ ...formData, filingDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
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
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Client</InputLabel>
                <Select
                  value={formData.clientId}
                  onChange={(e) => {
                    const selectedClient = clients.find(c => c._id === e.target.value);
                    setFormData({
                      ...formData,
                      clientId: e.target.value,
                      clientType: selectedClient?.clientType || 'regular'
                    });
                  }}
                  label="Client"
                >
                  {clients.map((client) => (
                    <MenuItem key={client._id} value={client._id}>
                      {client.name} ({client.clientType})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Court</InputLabel>
                <Select
                  value={formData.court}
                  onChange={(e) => setFormData({ ...formData, court: e.target.value })}
                  label="Court"
                >
                  <MenuItem value="Supreme Court">Supreme Court</MenuItem>
                  <MenuItem value="High Court">High Court</MenuItem>
                  <MenuItem value="District Court">District Court</MenuItem>
                  <MenuItem value="National Criminal Court">National Criminal Court</MenuItem>
                  <MenuItem value="Special Court">Special Court</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Case Type</InputLabel>
                <Select
                  value={formData.caseType}
                  onChange={(e) => setFormData({ ...formData, caseType: e.target.value })}
                  label="Case Type"
                >
                  <MenuItem value="Criminal">Criminal</MenuItem>
                  <MenuItem value="Environment Law">Environment Law</MenuItem>
                  <MenuItem value="Civil">Civil</MenuItem>
                  <MenuItem value="Constitutional">Constitutional</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Next Hearing Date"
                value={formData.nextHearingDate}
                onChange={(e) => setFormData({ ...formData, nextHearingDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  label="Priority"
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateCase} variant="contained" disabled={loading || !formData.caseNumber || !formData.title || !formData.clientId}>
            {loading ? 'Creating...' : 'Create Case'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Case Dialog */}
      <Dialog open={openAssignDialog} onClose={() => setOpenAssignDialog(false)}>
        <DialogTitle>Assign Case to Employee</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Select Employee</InputLabel>
            <Select
              onChange={(e) => handleAssignCase(selectedCase._id, e.target.value)}
              label="Select Employee"
            >
              {employees.map((emp) => (
                <MenuItem key={emp._id} value={emp._id}>
                  {emp.name} ({emp.designation || 'Employee'})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAssignDialog(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Cases;
