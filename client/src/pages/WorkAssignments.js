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
  FormControl,
  InputLabel,
  Select,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { format } from 'date-fns';

const WorkAssignments = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [assignments, setAssignments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [cases, setCases] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    caseId: '',
    dueDate: '',
    estimatedHours: '',
    priority: 'medium',
  });

  useEffect(() => {
    fetchAssignments();
    if (user?.role === 'admin') {
      fetchEmployees();
      fetchCases();
    }
  }, [user]);

  const fetchAssignments = async () => {
    try {
      const response = await axios.get('/work-assignments');
      setAssignments(response.data);
    } catch (error) {
      console.error('Error fetching assignments:', error);
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

  const fetchCases = async () => {
    try {
      const response = await axios.get('/cases');
      setCases(response.data);
    } catch (error) {
      console.error('Error fetching cases:', error);
    }
  };

  const handleCreateAssignment = async () => {
    setLoading(true);
    try {
      await axios.post('/work-assignments', formData);
      setOpenDialog(false);
      setFormData({
        title: '',
        description: '',
        assignedTo: '',
        caseId: '',
        dueDate: '',
        estimatedHours: '',
        priority: 'medium',
      });
      fetchAssignments();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create assignment');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await axios.put(`/work-assignments/${id}/status`, { status });
      fetchAssignments();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update status');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      assigned: 'info',
      'in-progress': 'primary',
      completed: 'success',
      overdue: 'error',
    };
    return colors[status] || 'default';
  };

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', px: { xs: 1, sm: 0 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 2, sm: 3 }, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>Work Assignments</Typography>
        {user?.role === 'admin' && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
            size={isMobile ? 'medium' : 'large'}
          >
            Create Assignment
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
          '& .MuiTable-root': {
            minWidth: { xs: 600, sm: 'auto' }
          }
        }}
      >
        <Table size={isMobile ? 'small' : 'medium'} stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Assigned To</TableCell>
              <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Case</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Estimated Hours</TableCell>
              <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Delivery Days</TableCell>
              <TableCell>Status</TableCell>
              {user?.role !== 'admin' && <TableCell align="right">Actions</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {assignments.map((assignment) => (
              <TableRow key={assignment._id}>
                <TableCell>
                  <Typography variant="body2" fontWeight={500}>
                    {assignment.title}
                  </Typography>
                  {/* Mobile: Show compact info */}
                  <Box sx={{ display: { xs: 'block', md: 'none' }, mt: 0.5 }}>
                    {assignment.assignedTo && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {assignment.assignedTo.name}
                      </Typography>
                    )}
                    {assignment.caseId && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        Case: {assignment.caseId.caseNumber}
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary" display="block">
                      {assignment.estimatedHours} hrs
                    </Typography>
                    {assignment.deliveryDays > 0 && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {assignment.deliveryDays} days
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{assignment.assignedTo?.name}</TableCell>
                <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>{assignment.caseId?.caseNumber || 'N/A'}</TableCell>
                <TableCell>{format(new Date(assignment.dueDate), 'dd-MM-yyyy')}</TableCell>
                <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{assignment.estimatedHours} hrs</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                  {assignment.deliveryDays > 0 ? `${assignment.deliveryDays} days` : '-'}
                </TableCell>
                <TableCell>
                  <Chip
                    label={assignment.status}
                    color={getStatusColor(assignment.status)}
                    size="small"
                  />
                </TableCell>
                {user?.role !== 'admin' && (
                  <TableCell align="right">
                    {assignment.status !== 'completed' && (
                      <Button
                        size="small"
                        onClick={() => handleUpdateStatus(assignment._id, 'in-progress')}
                      >
                        Start
                      </Button>
                    )}
                    {assignment.status === 'in-progress' && (
                      <Button
                        size="small"
                        onClick={() => handleUpdateStatus(assignment._id, 'completed')}
                      >
                        Complete
                      </Button>
                    )}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Assignment Dialog */}
      {user?.role === 'admin' && (
        <Dialog 
          open={openDialog} 
          onClose={() => setOpenDialog(false)} 
          maxWidth="md" 
          fullWidth
          fullScreen={isMobile}
        >
          <DialogTitle>Create Work Assignment</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
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
              <FormControl fullWidth>
                <InputLabel>Assign To</InputLabel>
                <Select
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  label="Assign To"
                  required
                >
                  {employees.map((emp) => (
                    <MenuItem key={emp._id} value={emp._id}>
                      {emp.name} ({emp.designation || 'Employee'})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
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
              <TextField
                label="Due Date"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
                required
              />
              <TextField
                label="Estimated Hours"
                type="number"
                value={formData.estimatedHours}
                onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                fullWidth
                required
              />
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
            <Button onClick={handleCreateAssignment} variant="contained" disabled={loading}>
              Create
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default WorkAssignments;

