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
  Alert,
  IconButton,
  Tooltip,
  Grid,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const Employees = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [employees, setEmployees] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee',
    designation: '',
    employeeId: '',
    phone: '',
    isActive: true,
  });

  useEffect(() => {
    fetchEmployees();
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

  const handleOpenDialog = (employee = null) => {
    if (employee) {
      setEditingEmployee(employee);
      setFormData({
        name: employee.name || '',
        email: employee.email || '',
        password: '', // Don't show password for editing
        role: employee.role || 'employee',
        designation: employee.designation || '',
        employeeId: employee.employeeId || '',
        phone: employee.phone || '',
        isActive: employee.isActive !== undefined ? employee.isActive : true,
      });
    } else {
      setEditingEmployee(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'employee',
        designation: '',
        employeeId: '',
        phone: '',
        isActive: true,
      });
    }
    setOpenDialog(true);
    setError('');
    setSuccess('');
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingEmployee(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'employee',
      designation: '',
      employeeId: '',
      phone: '',
      isActive: true,
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    // Validation
    if (!formData.name || !formData.email) {
      setError('Name and email are required');
      setLoading(false);
      return;
    }

    if (!editingEmployee && !formData.password) {
      setError('Password is required for new employees');
      setLoading(false);
      return;
    }

    if (formData.password && formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const payload = { ...formData };
      if (editingEmployee && !formData.password) {
        // Remove password if editing and not changed
        delete payload.password;
      }

      if (editingEmployee) {
        await axios.put(`/users/${editingEmployee._id}`, payload);
        setSuccess('Employee updated successfully');
      } else {
        await axios.post('/auth/register', payload);
        setSuccess('Employee created successfully');
      }

      setTimeout(() => {
        handleCloseDialog();
        fetchEmployees();
      }, 1000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save employee');
    } finally {
      setLoading(false);
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

  const getRoleColor = (role) => {
    const colorMap = {
      admin: 'error',
      'senior-advocate': 'secondary',
      'junior-advocate': 'primary',
      clerk: 'default',
      intern: 'warning',
      employee: 'default',
    };
    return colorMap[role] || 'default';
  };

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', px: { xs: 1, sm: 0 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 2, sm: 3 }, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
          Employee Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<PersonAddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ bgcolor: 'primary.main' }}
        >
          Add Employee
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

      <Card sx={{ width: '100%', maxWidth: '100%' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            All Employees
          </Typography>
          {employees.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <PersonAddIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body1" color="text.secondary" gutterBottom>
                No employees found
              </Typography>
              <Button variant="contained" onClick={() => handleOpenDialog()} sx={{ mt: 2 }}>
                Add First Employee
              </Button>
            </Box>
          ) : (
            <TableContainer sx={{ 
              maxHeight: { xs: 'calc(100vh - 300px)', sm: 'none' },
              overflowX: 'auto',
              '& .MuiTable-root': {
                minWidth: { xs: 700, sm: 'auto' }
              }
            }}>
              <Table size={isMobile ? 'small' : 'medium'} stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Designation</TableCell>
                  <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Employee ID</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
                <TableBody>
                  {employees.map((employee) => (
                    <TableRow key={employee._id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {employee.name}
                        </Typography>
                        {/* Mobile: Show compact info */}
                        <Box sx={{ display: { xs: 'block', sm: 'none' }, mt: 0.5 }}>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {employee.email}
                          </Typography>
                          {employee.designation && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              {employee.designation}
                            </Typography>
                          )}
                          {employee.employeeId && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              ID: {employee.employeeId}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{employee.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={getRoleDisplay(employee.role)}
                          color={getRoleColor(employee.role)}
                          size="small"
                          sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                        />
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{employee.designation || '-'}</TableCell>
                      <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                        {employee.employeeId ? (
                          <Chip label={employee.employeeId} size="small" variant="outlined" />
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={employee.isActive ? 'Active' : 'Inactive'}
                          color={employee.isActive ? 'success' : 'default'}
                          size="small"
                          sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(employee)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="sm" 
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>
          {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Full Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                fullWidth
                required
                disabled={!!editingEmployee}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label={editingEmployee ? 'New Password (leave blank to keep current)' : 'Password'}
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                fullWidth
                required={!editingEmployee}
                helperText={editingEmployee ? 'Leave blank to keep current password' : 'Minimum 6 characters'}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                fullWidth
                required
              >
                <MenuItem value="employee">Employee</MenuItem>
                <MenuItem value="senior-advocate">Senior Advocate</MenuItem>
                <MenuItem value="junior-advocate">Junior Advocate</MenuItem>
                <MenuItem value="clerk">Clerk</MenuItem>
                <MenuItem value="intern">Intern</MenuItem>
                {user?.role === 'admin' && <MenuItem value="admin">Admin</MenuItem>}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Designation"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                fullWidth
                placeholder="e.g., Junior Advocate, Legal Clerk"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Employee ID"
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Phone Number"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                label="Status"
                value={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'true' })}
                fullWidth
              >
                <MenuItem value={true}>Active</MenuItem>
                <MenuItem value={false}>Inactive</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {loading ? 'Saving...' : editingEmployee ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Employees;

