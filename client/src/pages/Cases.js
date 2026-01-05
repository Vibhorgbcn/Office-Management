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
  Select,
  FormControl,
  InputLabel,
  Alert,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { format } from 'date-fns';

const Cases = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [cases, setCases] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [openAssignDialog, setOpenAssignDialog] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    caseNumber: '',
    title: '',
    description: '',
    clientName: '',
    clientType: 'regular',
    court: 'National Criminal Court',
    caseType: 'Criminal',
    priority: 'medium',
  });

  useEffect(() => {
    fetchCases();
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
    try {
      await axios.post('/cases', formData);
      setOpenDialog(false);
      setFormData({
        caseNumber: '',
        title: '',
        description: '',
        clientName: '',
        clientType: 'regular',
        court: 'National Criminal Court',
        caseType: 'Criminal',
        priority: 'medium',
      });
      fetchCases();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create case');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignCase = async (caseId, employeeId) => {
    try {
      await axios.put(`/cases/${caseId}/assign`, { assignedTo: employeeId });
      setOpenAssignDialog(false);
      setSelectedCase(null);
      fetchCases();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to assign case');
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

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', px: { xs: 1, sm: 0 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 2, sm: 3 }, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>Cases</Typography>
        {user?.role === 'admin' && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
          >
            Create Case
          </Button>
        )}
      </Box>

      <TableContainer 
        component={Paper} 
        sx={{ 
          maxHeight: { xs: 'calc(100vh - 400px)', sm: 'none' }, 
          overflowX: 'auto',
          width: '100%',
          maxWidth: '100%',
        }}
      >
        <Table size={isMobile ? 'small' : 'medium'} stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Case Number</TableCell>
              <TableCell>Title</TableCell>
              <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Client</TableCell>
              <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Court</TableCell>
              <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Assigned To</TableCell>
              {user?.role === 'admin' && <TableCell align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {cases.map((caseItem) => (
              <TableRow key={caseItem._id}>
                <TableCell>
                  <Typography variant="body2" fontWeight={500}>
                    {caseItem.caseNumber}
                  </Typography>
                  {/* Mobile: Show compact info */}
                  <Box sx={{ display: { xs: 'block', md: 'none' }, mt: 0.5 }}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {caseItem.clientName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {caseItem.court}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      {caseItem.caseType}
                    </Typography>
                    {caseItem.assignedTo && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {caseItem.assignedTo.name}
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>{caseItem.title}</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{caseItem.clientName}</TableCell>
                <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{caseItem.court}</TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{caseItem.caseType}</TableCell>
                <TableCell>
                  <Chip
                    label={caseItem.status}
                    color={getStatusColor(caseItem.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                  {caseItem.assignedTo?.name || 'Unassigned'}
                </TableCell>
                {user?.role === 'admin' && (
                  <TableCell align="right">
                    {caseItem.status === 'pending' && (
                      <Button
                        size="small"
                        onClick={() => {
                          setSelectedCase(caseItem);
                          setOpenAssignDialog(true);
                        }}
                      >
                        Assign
                      </Button>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Case Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={() => setOpenDialog(false)} 
        maxWidth="md" 
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle>Create New Case</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Case Number"
              value={formData.caseNumber}
              onChange={(e) => setFormData({ ...formData, caseNumber: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={3}
              required
            />
            <TextField
              label="Client Name"
              value={formData.clientName}
              onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
              fullWidth
              required
            />
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
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Court</InputLabel>
              <Select
                value={formData.court}
                onChange={(e) => setFormData({ ...formData, court: e.target.value })}
                label="Court"
              >
                <MenuItem value="National Criminal Court">National Criminal Court</MenuItem>
                <MenuItem value="Supreme Court">Supreme Court</MenuItem>
                <MenuItem value="High Court">High Court</MenuItem>
                <MenuItem value="District Court">District Court</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
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
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateCase} variant="contained" disabled={loading}>
            Create
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

