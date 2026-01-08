import React, { useState, useEffect } from 'react';
import {
  Box, Button, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Grid, MenuItem, Alert,
  useMediaQuery, useTheme, IconButton
} from '@mui/material';
import {
  Add, Visibility, Download, AccountBalance, AttachMoney
} from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

const Payroll = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [generateForm, setGenerateForm] = useState({
    employeeId: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  useEffect(() => {
    fetchPayrolls();
    if (user?.role === 'admin') {
      fetchEmployees();
    }
  }, [user]);

  const fetchPayrolls = async () => {
    try {
      const endpoint = user?.role === 'admin' ? '/payroll' : '/payroll/my-payslips';
      const response = await axios.get(endpoint);
      setPayrolls(response.data);
    } catch (error) {
      console.error('Error fetching payrolls:', error);
      setError('Failed to load payroll records');
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await axios.get('/hr/employees');
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleGeneratePayroll = async () => {
    try {
      setLoading(true);
      setError('');
      await axios.post('/payroll/generate', generateForm);
      setSuccess('Payroll generated successfully');
      setGenerateDialogOpen(false);
      setGenerateForm({
        employeeId: '',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
      });
      fetchPayrolls();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to generate payroll');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'success';
      case 'generated': return 'info';
      case 'approved': return 'warning';
      case 'draft': return 'default';
      default: return 'default';
    }
  };

  const getMonthName = (month) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month - 1];
  };

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', px: { xs: 1, sm: 0 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
          Payroll Management
        </Typography>
        {user?.role === 'admin' && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setGenerateDialogOpen(true)}
          >
            Generate Payroll
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

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Payroll Records</Typography>
          <TableContainer component={Paper} sx={{ maxHeight: { xs: 'calc(100vh - 300px)', sm: 'none' }, overflowX: 'auto' }}>
            <Table size={isMobile ? 'small' : 'medium'}>
              <TableHead>
                <TableRow>
                  {user?.role === 'admin' && <TableCell>Employee</TableCell>}
                  <TableCell>Month</TableCell>
                  <TableCell>Year</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Gross Salary</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Deductions</TableCell>
                  <TableCell>Net Salary</TableCell>
                  <TableCell>Status</TableCell>
                  {user?.role === 'admin' && (
                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Actions</TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                {payrolls.map((payroll) => (
                  <TableRow key={payroll._id}>
                    {user?.role === 'admin' && (
                      <TableCell>
                        {payroll.employeeId?.user?.name || payroll.employeeId?.employeeId || 'N/A'}
                      </TableCell>
                    )}
                    <TableCell>{getMonthName(payroll.month)}</TableCell>
                    <TableCell>{payroll.year}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                      ₹{payroll.totalEarnings?.toLocaleString()}
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                      ₹{payroll.totalDeductions?.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold" color="primary">
                        ₹{payroll.netSalary?.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={payroll.status}
                        color={getStatusColor(payroll.status)}
                        size="small"
                      />
                    </TableCell>
                    {user?.role === 'admin' && (
                      <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                        <IconButton size="small" color="primary">
                          <Visibility fontSize="small" />
                        </IconButton>
                        {payroll.payslipUrl && (
                          <IconButton size="small" color="success">
                            <Download fontSize="small" />
                          </IconButton>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Generate Payroll Dialog */}
      <Dialog open={generateDialogOpen} onClose={() => setGenerateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Generate Payroll</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Employee"
                value={generateForm.employeeId}
                onChange={(e) => setGenerateForm({ ...generateForm, employeeId: e.target.value })}
                required
              >
                {employees.map((emp) => (
                  <MenuItem key={emp._id} value={emp._id}>
                    {emp.employeeId} - {emp.user?.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Month"
                value={generateForm.month}
                onChange={(e) => setGenerateForm({ ...generateForm, month: parseInt(e.target.value) })}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                  <MenuItem key={m} value={m}>{getMonthName(m)}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Year"
                value={generateForm.year}
                onChange={(e) => setGenerateForm({ ...generateForm, year: parseInt(e.target.value) })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGenerateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleGeneratePayroll}
            variant="contained"
            disabled={loading || !generateForm.employeeId}
          >
            {loading ? 'Generating...' : 'Generate'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Payroll;


