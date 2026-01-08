import React, { useState, useEffect } from 'react';
import {
  Box, Button, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Grid, Tab, Tabs,
  IconButton, Alert, useMediaQuery, useTheme, Avatar, Divider
} from '@mui/material';
import {
  CheckCircle, Cancel, CalendarToday, EventBusy, People as PeopleIcon,
  AccessTime, TrendingUp, Assignment, AccountCircle
} from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

const HRManagement = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [tabValue, setTabValue] = useState(0);
  const [employees, setEmployees] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dialog states
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    leaveType: 'CL',
    startDate: '',
    endDate: '',
    totalDays: 0,
    reason: ''
  });

  useEffect(() => {
    fetchEmployees();
    fetchLeaveRequests();
    fetchAttendanceStats();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get('/users');
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
      setError('Failed to load employees');
    }
  };

  const fetchLeaveRequests = async () => {
    try {
      const response = await axios.get('/hr/leaves');
      setLeaveRequests(response.data);
    } catch (error) {
      console.error('Error fetching leave requests:', error);
    }
  };

  const fetchAttendanceStats = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const response = await axios.get(`/attendance/all?startDate=${today}&endDate=${today}`);
      const attendanceData = response.data;
      
      const stats = {
        present: attendanceData.filter(a => a.status === 'present' || a.status === 'half-day').length,
        absent: employees.length - attendanceData.filter(a => a.status === 'present' || a.status === 'half-day').length,
        total: employees.length,
        onLeave: leaveRequests.filter(l => l.status === 'approved' && 
          new Date(l.startDate) <= new Date() && 
          new Date(l.endDate) >= new Date()).length
      };
      setAttendanceStats(stats);
    } catch (error) {
      console.error('Error fetching attendance stats:', error);
    }
  };

  const handleLeaveRequest = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Calculate total days
      const start = new Date(leaveForm.startDate);
      const end = new Date(leaveForm.endDate);
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

      await axios.post('/hr/leaves/request', {
        ...leaveForm,
        totalDays: days
      });

      setSuccess('Leave request submitted successfully');
      setLeaveDialogOpen(false);
      setLeaveForm({
        leaveType: 'CL',
        startDate: '',
        endDate: '',
        totalDays: 0,
        reason: ''
      });
      fetchLeaveRequests();
      fetchAttendanceStats();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to submit leave request');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveLeave = async (id, status, rejectionReason = '') => {
    try {
      await axios.put(`/hr/leaves/${id}/approve`, { status, rejectionReason });
      setSuccess(`Leave request ${status} successfully`);
      fetchLeaveRequests();
      fetchAttendanceStats();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update leave request');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const getRoleDisplay = (role) => {
    const roleMap = {
      admin: 'Admin',
      'senior-advocate': 'Senior Advocate',
      'junior-advocate': 'Junior Advocate',
      clerk: 'Clerk',
      intern: 'Intern',
      employee: 'Employee',
    };
    return roleMap[role] || role;
  };

  const activeEmployees = employees.filter(emp => emp.isActive !== false);
  const inactiveEmployees = employees.filter(emp => emp.isActive === false);
  const employeesByDepartment = employees.reduce((acc, emp) => {
    const dept = emp.department || 'Unassigned';
    acc[dept] = (acc[dept] || 0) + 1;
    return acc;
  }, {});

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', px: { xs: 1, sm: 0 } }}>
      <Typography variant="h4" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2rem' }, mb: 3 }}>
        HR Management
      </Typography>

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
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Total Employees
                  </Typography>
                  <Typography variant="h4">{employees.length}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <PeopleIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Active Employees
                  </Typography>
                  <Typography variant="h4">{activeEmployees.length}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <CheckCircle />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Present Today
                  </Typography>
                  <Typography variant="h4">{attendanceStats.present || 0}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <AccessTime />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Pending Leaves
                  </Typography>
                  <Typography variant="h4">
                    {leaveRequests.filter(l => l.status === 'pending').length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <EventBusy />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label="Employees Overview" icon={<PeopleIcon />} iconPosition="start" />
          <Tab label="Leave Management" icon={<CalendarToday />} iconPosition="start" />
          <Tab label="Department Summary" icon={<Assignment />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* Employees Overview Tab */}
      {tabValue === 0 && (
        <>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">All Employees</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Chip label={`Active: ${activeEmployees.length}`} color="success" size="small" />
                  <Chip label={`Inactive: ${inactiveEmployees.length}`} color="default" size="small" />
                </Box>
              </Box>
              <TableContainer component={Paper} sx={{ maxHeight: { xs: 'calc(100vh - 400px)', sm: 'none' }, overflowX: 'auto' }}>
                <Table size={isMobile ? 'small' : 'medium'}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Email</TableCell>
                      <TableCell>Role</TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Designation</TableCell>
                      <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Department</TableCell>
                      <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Employee ID</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {employees.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                          <Typography variant="body2" color="text.secondary">
                            No employees found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      employees.map((emp) => (
                        <TableRow key={emp._id}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                                {emp.name?.charAt(0)?.toUpperCase() || 'U'}
                              </Avatar>
                              <Typography variant="body2" fontWeight={500}>
                                {emp.name}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{emp.email}</TableCell>
                          <TableCell>
                            <Chip label={getRoleDisplay(emp.role)} size="small" />
                          </TableCell>
                          <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                            {emp.designation || '-'}
                          </TableCell>
                          <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                            {emp.department || '-'}
                          </TableCell>
                          <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                            {emp.employeeId || '-'}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={emp.isActive !== false ? 'Active' : 'Inactive'}
                              color={emp.isActive !== false ? 'success' : 'default'}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </>
      )}

      {/* Leave Management Tab */}
      {tabValue === 1 && (
        <>
          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="h6">Leave Requests</Typography>
            {user?.role !== 'admin' && (
              <Button
                variant="contained"
                startIcon={<EventBusy />}
                onClick={() => setLeaveDialogOpen(true)}
              >
                Request Leave
              </Button>
            )}
          </Box>

          <Card>
            <CardContent>
              <TableContainer component={Paper} sx={{ maxHeight: { xs: 'calc(100vh - 400px)', sm: 'none' }, overflowX: 'auto' }}>
                <Table size={isMobile ? 'small' : 'medium'}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Employee</TableCell>
                      <TableCell>Leave Type</TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Start Date</TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>End Date</TableCell>
                      <TableCell>Days</TableCell>
                      <TableCell>Status</TableCell>
                      {user?.role === 'admin' && (
                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Actions</TableCell>
                      )}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {leaveRequests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={user?.role === 'admin' ? 7 : 6} align="center" sx={{ py: 4 }}>
                          <Typography variant="body2" color="text.secondary">
                            No leave requests found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      leaveRequests.map((leave) => (
                        <TableRow key={leave._id}>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                                {leave.user?.name?.charAt(0)?.toUpperCase() || 'U'}
                              </Avatar>
                              <Typography variant="body2">
                                {leave.user?.name || 'N/A'}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{leave.leaveType}</TableCell>
                          <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                            {leave.startDate ? format(new Date(leave.startDate), 'dd-MM-yyyy') : '-'}
                          </TableCell>
                          <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                            {leave.endDate ? format(new Date(leave.endDate), 'dd-MM-yyyy') : '-'}
                          </TableCell>
                          <TableCell>{leave.totalDays}</TableCell>
                          <TableCell>
                            <Chip
                              label={leave.status || 'pending'}
                              color={getStatusColor(leave.status)}
                              size="small"
                            />
                          </TableCell>
                          {user?.role === 'admin' && (
                            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                              {leave.status === 'pending' && (
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                  <IconButton
                                    size="small"
                                    color="success"
                                    onClick={() => handleApproveLeave(leave._id, 'approved')}
                                  >
                                    <CheckCircle fontSize="small" />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleApproveLeave(leave._id, 'rejected', 'Rejected by admin')}
                                  >
                                    <Cancel fontSize="small" />
                                  </IconButton>
                                </Box>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </>
      )}

      {/* Department Summary Tab */}
      {tabValue === 2 && (
        <Grid container spacing={3}>
          {Object.entries(employeesByDepartment).map(([dept, count]) => (
            <Grid item xs={12} sm={6} md={4} key={dept}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {dept}
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {count}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Employees
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
          {Object.keys(employeesByDepartment).length === 0 && (
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 4 }}>
                    No department data available
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}

      {/* Leave Request Dialog */}
      <Dialog open={leaveDialogOpen} onClose={() => setLeaveDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Request Leave</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Leave Type"
                value={leaveForm.leaveType}
                onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value })}
              >
                <MenuItem value="CL">Casual Leave (CL)</MenuItem>
                <MenuItem value="SL">Sick Leave (SL)</MenuItem>
                <MenuItem value="EL">Earned Leave (EL)</MenuItem>
                <MenuItem value="ML">Maternity Leave (ML)</MenuItem>
                <MenuItem value="PL">Personal Leave (PL)</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Start Date"
                value={leaveForm.startDate}
                onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="End Date"
                value={leaveForm.endDate}
                onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Reason"
                value={leaveForm.reason}
                onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLeaveDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleLeaveRequest}
            variant="contained"
            disabled={loading || !leaveForm.reason || !leaveForm.startDate || !leaveForm.endDate}
          >
            {loading ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HRManagement;
