import React, { useState, useEffect } from 'react';
import {
  Box, Button, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Grid, MenuItem, Alert,
  useMediaQuery, useTheme, IconButton, Select, FormControl, InputLabel
} from '@mui/material';
import {
  Add, Edit, CheckCircle, Cancel, AccessTime, Timer
} from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

const Timesheets = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [timesheets, setTimesheets] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [cases, setCases] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [timesheetForm, setTimesheetForm] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    taskId: '',
    caseId: '',
    clientId: '',
    startTime: '',
    endTime: '',
    durationHours: 0,
    description: '',
    billable: true,
    billableRate: 0
  });

  useEffect(() => {
    fetchTimesheets();
    fetchTasks();
    fetchCases();
    fetchClients();
  }, []);

  const fetchTimesheets = async () => {
    try {
      const response = await axios.get('/timesheets');
      setTimesheets(response.data);
    } catch (error) {
      console.error('Error fetching timesheets:', error);
      setError('Failed to load timesheets');
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await axios.get('/work-assignments');
      setTasks(response.data.filter(t => t.status !== 'completed'));
    } catch (error) {
      console.error('Error fetching tasks:', error);
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

  const calculateDuration = (start, end) => {
    if (!start || !end) return 0;
    const startTime = new Date(`2000-01-01T${start}`);
    const endTime = new Date(`2000-01-01T${end}`);
    if (endTime < startTime) {
      endTime.setDate(endTime.getDate() + 1);
    }
    return (endTime - startTime) / (1000 * 60 * 60);
  };

  const handleTimeChange = (field, value) => {
    const updated = { ...timesheetForm, [field]: value };
    if ((field === 'startTime' || field === 'endTime') && updated.startTime && updated.endTime) {
      updated.durationHours = calculateDuration(updated.startTime, updated.endTime);
    }
    setTimesheetForm(updated);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');
      
      const payload = {
        ...timesheetForm,
        startTime: `${timesheetForm.date}T${timesheetForm.startTime}`,
        endTime: `${timesheetForm.date}T${timesheetForm.endTime}`,
        taskId: timesheetForm.taskId || null,
        caseId: timesheetForm.caseId || null,
        clientId: timesheetForm.clientId || null
      };

      await axios.post('/timesheets', payload);
      setSuccess('Timesheet entry created successfully');
      setDialogOpen(false);
      setTimesheetForm({
        date: format(new Date(), 'yyyy-MM-dd'),
        taskId: '',
        caseId: '',
        clientId: '',
        startTime: '',
        endTime: '',
        durationHours: 0,
        description: '',
        billable: true,
        billableRate: 0
      });
      fetchTimesheets();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create timesheet entry');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id, status) => {
    try {
      await axios.post(`/timesheets/${id}/approve`, { status });
      setSuccess(`Timesheet ${status} successfully`);
      fetchTimesheets();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update timesheet');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'submitted': return 'warning';
      case 'draft': return 'default';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', px: { xs: 1, sm: 0 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
          Timesheets
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setDialogOpen(true)}
        >
          Add Entry
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

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Time Entries</Typography>
          <TableContainer component={Paper} sx={{ maxHeight: { xs: 'calc(100vh - 300px)', sm: 'none' }, overflowX: 'auto' }}>
            <Table size={isMobile ? 'small' : 'medium'}>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Task/Case</TableCell>
                  <TableCell>Duration</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Description</TableCell>
                  <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Billable</TableCell>
                  <TableCell>Status</TableCell>
                  {user?.role === 'admin' && (
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Actions</TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {timesheets.map((entry) => (
                  <TableRow key={entry._id}>
                    <TableCell>{format(new Date(entry.date), 'dd-MM-yyyy')}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                      {entry.taskId?.title || entry.caseId?.caseNumber || '-'}
                    </TableCell>
                    <TableCell>{entry.durationHours?.toFixed(2)} hrs</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' }, maxWidth: 200 }}>
                      <Typography variant="body2" noWrap>
                        {entry.description}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                      <Chip
                        label={entry.billable ? 'Yes' : 'No'}
                        color={entry.billable ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={entry.status}
                        color={getStatusColor(entry.status)}
                        size="small"
                      />
                    </TableCell>
                    {user?.role === 'admin' && entry.status === 'submitted' && (
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleApprove(entry._id, 'approved')}
                          >
                            <CheckCircle fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleApprove(entry._id, 'rejected')}
                          >
                            <Cancel fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add Timesheet Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add Timesheet Entry</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Date"
                value={timesheetForm.date}
                onChange={(e) => setTimesheetForm({ ...timesheetForm, date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Task (Optional)</InputLabel>
                <Select
                  value={timesheetForm.taskId}
                  onChange={(e) => setTimesheetForm({ ...timesheetForm, taskId: e.target.value })}
                  label="Task (Optional)"
                >
                  <MenuItem value="">None</MenuItem>
                  {tasks.map((task) => (
                    <MenuItem key={task._id} value={task._id}>{task.title}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Case (Optional)</InputLabel>
                <Select
                  value={timesheetForm.caseId}
                  onChange={(e) => setTimesheetForm({ ...timesheetForm, caseId: e.target.value })}
                  label="Case (Optional)"
                >
                  <MenuItem value="">None</MenuItem>
                  {cases.map((c) => (
                    <MenuItem key={c._id} value={c._id}>{c.caseNumber} - {c.title}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="time"
                label="Start Time"
                value={timesheetForm.startTime}
                onChange={(e) => handleTimeChange('startTime', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="time"
                label="End Time"
                value={timesheetForm.endTime}
                onChange={(e) => handleTimeChange('endTime', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Duration (Hours)"
                value={timesheetForm.durationHours}
                onChange={(e) => setTimesheetForm({ ...timesheetForm, durationHours: parseFloat(e.target.value) || 0 })}
                InputProps={{ inputProps: { min: 0, step: 0.25 } }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={timesheetForm.description}
                onChange={(e) => setTimesheetForm({ ...timesheetForm, description: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Billable</InputLabel>
                <Select
                  value={timesheetForm.billable}
                  onChange={(e) => setTimesheetForm({ ...timesheetForm, billable: e.target.value === 'true' })}
                  label="Billable"
                >
                  <MenuItem value="true">Yes</MenuItem>
                  <MenuItem value="false">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {timesheetForm.billable && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Billable Rate (₹/hr)"
                  value={timesheetForm.billableRate}
                  onChange={(e) => setTimesheetForm({ ...timesheetForm, billableRate: parseFloat(e.target.value) || 0 })}
                  InputProps={{ inputProps: { min: 0 } }}
                />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || !timesheetForm.description || !timesheetForm.startTime || !timesheetForm.endTime}
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Timesheets;


