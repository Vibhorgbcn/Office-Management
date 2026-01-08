import React, { useState, useEffect } from 'react';
import {
  Box, Button, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Select, FormControl,
  InputLabel, Alert, Grid, IconButton, useMediaQuery, useTheme, Tabs, Tab
} from '@mui/material';
import {
  Add, Edit, Delete, CalendarToday, Event, CheckCircle, Cancel
} from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

const Causelists = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [causelists, setCauselists] = useState([]);
  const [cases, setCases] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    court: '',
    caseId: '',
    caseNumber: '',
    bench: '',
    courtRoom: '',
    itemNumber: '',
    advocateId: '',
    purpose: 'hearing',
    priority: 'medium'
  });

  useEffect(() => {
    fetchCauselists();
    fetchCases();
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchCauselists();
    }
  }, [selectedDate]);

  const fetchCauselists = async () => {
    try {
      const url = tabValue === 0 
        ? `/causelists/today`
        : `/causelists${selectedDate ? `?date=${selectedDate}` : ''}`;
      const response = await axios.get(url);
      setCauselists(response.data);
    } catch (error) {
      console.error('Error fetching causelists:', error);
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

  const fetchEmployees = async () => {
    try {
      const response = await axios.get('/users/employees');
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleCreate = async () => {
    try {
      setLoading(true);
      setError('');
      await axios.post('/causelists', formData);
      setSuccess('Causelist entry created successfully');
      setOpenDialog(false);
      setFormData({
        date: format(new Date(), 'yyyy-MM-dd'),
        court: '',
        caseId: '',
        caseNumber: '',
        bench: '',
        courtRoom: '',
        itemNumber: '',
        advocateId: '',
        purpose: 'hearing',
        priority: 'medium'
      });
      fetchCauselists();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create causelist entry');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await axios.put(`/causelists/${id}`, { status });
      setSuccess('Status updated successfully');
      fetchCauselists();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this causelist entry?')) return;
    
    try {
      await axios.delete(`/causelists/${id}`);
      setSuccess('Causelist entry deleted successfully');
      fetchCauselists();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete causelist entry');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      scheduled: 'info',
      'in-progress': 'warning',
      completed: 'success',
      adjourned: 'default',
      cancelled: 'error'
    };
    return colors[status] || 'default';
  };

  const todayCauselists = causelists.filter(c => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const causelistDate = new Date(c.date);
    causelistDate.setHours(0, 0, 0, 0);
    return causelistDate.getTime() === today.getTime();
  });

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', px: { xs: 1, sm: 0 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
          Causelist Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenDialog(true)}
        >
          Add to Causelist
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
          <Tab label="Today's Causelist" icon={<CalendarToday />} iconPosition="start" />
          <Tab label="All Causelists" icon={<Event />} iconPosition="start" />
        </Tabs>
      </Box>

      {tabValue === 1 && (
        <Box sx={{ mb: 3 }}>
          <TextField
            type="date"
            label="Select Date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 200 }}
          />
        </Box>
      )}

      <TableContainer component={Paper} sx={{ maxHeight: { xs: 'calc(100vh - 400px)', sm: 'none' }, overflowX: 'auto' }}>
        <Table size={isMobile ? 'small' : 'medium'} stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Case Number</TableCell>
              <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Court</TableCell>
              <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Bench/Room</TableCell>
              <TableCell>Advocate</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(tabValue === 0 ? todayCauselists : causelists).map((causelist) => (
              <TableRow key={causelist._id}>
                <TableCell>
                  {format(new Date(causelist.date), 'dd-MM-yyyy')}
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight={500}>
                    {causelist.caseNumber}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {causelist.caseId?.title || ''}
                  </Typography>
                </TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                  {causelist.court}
                </TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                  {causelist.bench || '-'} {causelist.courtRoom ? `• ${causelist.courtRoom}` : ''}
                </TableCell>
                <TableCell>
                  {causelist.advocateId?.name || causelist.advocateName || '-'}
                </TableCell>
                <TableCell>
                  <Chip
                    label={causelist.status}
                    color={getStatusColor(causelist.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {causelist.status === 'scheduled' && (
                      <>
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handleStatusUpdate(causelist._id, 'completed')}
                        >
                          <CheckCircle fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="warning"
                          onClick={() => handleStatusUpdate(causelist._id, 'adjourned')}
                        >
                          <Cancel fontSize="small" />
                        </IconButton>
                      </>
                    )}
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(causelist._id)}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth fullScreen={isMobile}>
        <DialogTitle>Add to Causelist</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Court"
                value={formData.court}
                onChange={(e) => setFormData({ ...formData, court: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Case</InputLabel>
                <Select
                  value={formData.caseId}
                  onChange={(e) => {
                    const selectedCase = cases.find(c => c._id === e.target.value);
                    setFormData({
                      ...formData,
                      caseId: e.target.value,
                      caseNumber: selectedCase?.caseNumber || ''
                    });
                  }}
                  label="Case"
                  required
                >
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
                label="Case Number"
                value={formData.caseNumber}
                onChange={(e) => setFormData({ ...formData, caseNumber: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Advocate</InputLabel>
                <Select
                  value={formData.advocateId}
                  onChange={(e) => setFormData({ ...formData, advocateId: e.target.value })}
                  label="Advocate"
                >
                  <MenuItem value="">None</MenuItem>
                  {employees.map((emp) => (
                    <MenuItem key={emp._id} value={emp._id}>
                      {emp.name} ({emp.designation || 'Employee'})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Purpose</InputLabel>
                <Select
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  label="Purpose"
                >
                  <MenuItem value="hearing">Hearing</MenuItem>
                  <MenuItem value="arguments">Arguments</MenuItem>
                  <MenuItem value="judgment">Judgment</MenuItem>
                  <MenuItem value="appointment">Appointment</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Bench"
                value={formData.bench}
                onChange={(e) => setFormData({ ...formData, bench: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Court Room"
                value={formData.courtRoom}
                onChange={(e) => setFormData({ ...formData, courtRoom: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Item Number"
                value={formData.itemNumber}
                onChange={(e) => setFormData({ ...formData, itemNumber: e.target.value })}
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
          <Button onClick={handleCreate} variant="contained" disabled={loading || !formData.court || !formData.caseId}>
            {loading ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Causelists;

