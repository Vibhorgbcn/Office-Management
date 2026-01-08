import React, { useState, useEffect } from 'react';
import {
  Box, Button, Card, CardContent, Typography, Tabs, Tab, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, Chip, Grid,
  List, ListItem, ListItemText, ListItemSecondaryAction, IconButton,
  Paper, Divider, Alert, CircularProgress, useMediaQuery, useTheme,
  MenuItem, Select, FormControl, InputLabel, Avatar, LinearProgress,
  Badge, Tooltip, Fab, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow
} from '@mui/material';
import {
  Add, Edit, Delete, CheckCircle, Cancel, Visibility, AttachFile,
  Comment, Schedule, Person, Flag, FilterList, ViewKanban, ViewList,
  CalendarToday, MoreVert, PlayArrow, Pause, Stop, Close, CloudUpload,
  AccessTime, Notifications
} from '@mui/icons-material';
import axios from 'axios';
import { format, isPast, isToday, isTomorrow } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

const Tasks = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [cases, setCases] = useState([]);
  const [clients, setClients] = useState([]);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban', 'list', 'calendar'
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterAssignee, setFilterAssignee] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newComment, setNewComment] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    assignees: [],
    dueDate: '',
    dueTime: '',
    reminderValue: '',
    reminderUnit: 'minutes',
    resourceType: 'none',
    resourceName: '',
    selectedFields: [],
    files: []
  });

  useEffect(() => {
    fetchTasks();
    if (user?.role === 'admin') {
      fetchEmployees();
      fetchCases();
      fetchClients();
    }
  }, [user, filterStatus, filterPriority, filterAssignee]);

  const fetchTasks = async () => {
    try {
      let url = '/work-assignments';
      const params = [];
      if (filterStatus !== 'all') params.push(`status=${filterStatus}`);
      if (filterPriority !== 'all') params.push(`priority=${filterPriority}`);
      if (filterAssignee !== 'all' && user?.role === 'admin') params.push(`assignedTo=${filterAssignee}`);
      
      if (params.length > 0) url += '?' + params.join('&');
      
      const response = await axios.get(url);
      setTasks(response.data);
    } catch (error) {
      console.error('Error fetching tasks:', error);
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

  const fetchClients = async () => {
    try {
      const response = await axios.get('/clients');
      setClients(response.data);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    setFormData({ ...formData, files: [...formData.files, ...files] });
  };

  const handleRemoveFile = (index) => {
    const newFiles = formData.files.filter((_, i) => i !== index);
    setFormData({ ...formData, files: newFiles });
  };

  const handleCreateTask = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Combine due date and time
      let dueDateTime = formData.dueDate;
      if (formData.dueTime) {
        dueDateTime = `${formData.dueDate}T${formData.dueTime}`;
      }
      
      // Calculate reminder date if reminder is set
      let reminderDate = null;
      if (formData.reminderValue && formData.reminderUnit) {
        const reminderMinutes = formData.reminderUnit === 'hours' 
          ? parseInt(formData.reminderValue) * 60 
          : parseInt(formData.reminderValue);
        const dueDateObj = new Date(dueDateTime);
        reminderDate = new Date(dueDateObj.getTime() - reminderMinutes * 60000);
      }
      
      // Create task for each assignee
      if (formData.assignees.length > 0) {
        for (const assigneeId of formData.assignees) {
          await axios.post('/work-assignments', {
            title: formData.title,
            description: formData.title, // Using title as description for now
            assignedTo: assigneeId,
            dueDate: dueDateTime,
            estimatedHours: 1, // Default
            priority: 'medium',
            reminderDate: reminderDate,
            resourceType: formData.resourceType,
            resourceName: formData.resourceName,
            caseId: formData.resourceType === 'case' ? formData.resourceName : null
          });
        }
      }
      
      setSuccess('Task(s) created successfully');
      setOpenDialog(false);
      setFormData({
        title: '',
        assignees: [],
        dueDate: '',
        dueTime: '',
        reminderValue: '',
        reminderUnit: 'minutes',
        resourceType: 'none',
        resourceName: '',
        selectedFields: [],
        files: []
      });
      fetchTasks();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const handleViewTask = async (task) => {
    try {
      const response = await axios.get(`/work-assignments/${task._id}`);
      setSelectedTask(response.data);
      setViewDialogOpen(true);
    } catch (error) {
      setError('Failed to load task details');
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await axios.put(`/work-assignments/${id}/status`, { status });
      setSuccess('Status updated successfully');
      fetchTasks();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedTask) return;
    
    try {
      await axios.post(`/work-assignments/${selectedTask._id}/comment`, {
        content: newComment
      });
      setNewComment('');
      setCommentDialogOpen(false);
      setSuccess('Comment added successfully');
      fetchTasks();
      if (viewDialogOpen) {
        const response = await axios.get(`/work-assignments/${selectedTask._id}`);
        setSelectedTask(response.data);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to add comment');
    }
  };

  const handleUpdateProgress = async (id, progress) => {
    try {
      await axios.put(`/work-assignments/${id}`, { progress });
      setSuccess('Progress updated successfully');
      fetchTasks();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update progress');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      assigned: 'info',
      'in-progress': 'primary',
      submitted: 'warning',
      approved: 'success',
      rejected: 'error',
      completed: 'success',
      overdue: 'error'
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

  const getDueDateStatus = (dueDate) => {
    if (!dueDate) return 'default';
    if (isPast(new Date(dueDate)) && !isToday(new Date(dueDate))) return 'error';
    if (isToday(new Date(dueDate))) return 'warning';
    if (isTomorrow(new Date(dueDate))) return 'info';
    return 'default';
  };

  const kanbanColumns = [
    { id: 'assigned', label: 'Assigned', statuses: ['assigned'] },
    { id: 'in-progress', label: 'In Progress', statuses: ['in-progress'] },
    { id: 'submitted', label: 'Submitted', statuses: ['submitted'] },
    { id: 'completed', label: 'Completed', statuses: ['completed', 'approved'] }
  ];

  const getTasksByStatus = (statuses) => {
    return tasks.filter(task => statuses.includes(task.status));
  };

  const filteredTasks = tasks.filter(task => {
    if (tabValue === 0) return task.status !== 'completed' && task.status !== 'approved';
    if (tabValue === 1) return task.status === 'completed' || task.status === 'approved';
    if (tabValue === 2) return task.isOverdue || task.status === 'overdue';
    return true;
  });

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', px: { xs: 1, sm: 0 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
          Tasks & Team Management
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant={viewMode === 'kanban' ? 'contained' : 'outlined'}
            startIcon={<ViewKanban />}
            onClick={() => setViewMode('kanban')}
            size="small"
          >
            Kanban
          </Button>
          <Button
            variant={viewMode === 'list' ? 'contained' : 'outlined'}
            startIcon={<ViewList />}
            onClick={() => setViewMode('list')}
            size="small"
          >
            List
          </Button>
          {user?.role === 'admin' && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setOpenDialog(true)}
            >
              Create Task
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

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="assigned">Assigned</MenuItem>
                  <MenuItem value="in-progress">In Progress</MenuItem>
                  <MenuItem value="submitted">Submitted</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="overdue">Overdue</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={3}>
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
            {user?.role === 'admin' && (
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Assignee</InputLabel>
                  <Select
                    value={filterAssignee}
                    onChange={(e) => setFilterAssignee(e.target.value)}
                    label="Assignee"
                  >
                    <MenuItem value="all">All Assignees</MenuItem>
                    {employees.map((emp) => (
                      <MenuItem key={emp._id} value={emp._id}>
                        {emp.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label="Active Tasks" />
          <Tab label="Completed" />
          <Tab label="Overdue" />
          <Tab label="All" />
        </Tabs>
      </Box>

      {/* Kanban View */}
      {viewMode === 'kanban' && (
        <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2 }}>
          {kanbanColumns.map((column) => {
            const columnTasks = getTasksByStatus(column.statuses).filter(task => {
              if (tabValue === 0) return task.status !== 'completed' && task.status !== 'approved';
              if (tabValue === 1) return task.status === 'completed' || task.status === 'approved';
              if (tabValue === 2) return task.isOverdue || task.status === 'overdue';
              return true;
            });

            return (
              <Box key={column.id} sx={{ minWidth: 280, flex: 1 }}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {column.label}
                      <Chip label={columnTasks.length} size="small" sx={{ ml: 1 }} />
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
                      {columnTasks.map((task) => (
                        <Card
                          key={task._id}
                          sx={{
                            p: 2,
                            cursor: 'pointer',
                            '&:hover': { boxShadow: 3 },
                            borderLeft: `4px solid ${theme.palette[getPriorityColor(task.priority)]?.main || 'gray'}`
                          }}
                          onClick={() => handleViewTask(task)}
                        >
                          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                            {task.title}
                          </Typography>
                          {task.description && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                              {task.description.substring(0, 60)}...
                            </Typography>
                          )}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                            <Chip
                              label={task.priority}
                              color={getPriorityColor(task.priority)}
                              size="small"
                            />
                            <Typography variant="caption" color="text.secondary">
                              {format(new Date(task.dueDate), 'MMM dd')}
                            </Typography>
                          </Box>
                          {task.progress > 0 && (
                            <LinearProgress
                              variant="determinate"
                              value={task.progress}
                              sx={{ mt: 1 }}
                            />
                          )}
                          {/* Status Update Buttons for Employees */}
                          {task.assignedTo?._id === user?._id && task.status !== 'completed' && task.status !== 'approved' && (
                            <Box sx={{ display: 'flex', gap: 1, mt: 2 }} onClick={(e) => e.stopPropagation()}>
                              {task.status === 'assigned' && (
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="primary"
                                  startIcon={<PlayArrow />}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateStatus(task._id, 'in-progress');
                                  }}
                                  sx={{ flex: 1 }}
                                >
                                  Start
                                </Button>
                              )}
                              {task.status === 'in-progress' && (
                                <>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="warning"
                                    startIcon={<Pause />}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleUpdateStatus(task._id, 'assigned');
                                    }}
                                  >
                                    Pause
                                  </Button>
                                  <Button
                                    size="small"
                                    variant="contained"
                                    color="success"
                                    startIcon={<CheckCircle />}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleUpdateStatus(task._id, 'completed');
                                    }}
                                    sx={{ flex: 1 }}
                                  >
                                    Complete
                                  </Button>
                                </>
                              )}
                            </Box>
                          )}
                        </Card>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            );
          })}
        </Box>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <TableContainer component={Paper}>
          <Table size={isMobile ? 'small' : 'medium'}>
            <TableHead>
              <TableRow>
                <TableCell>Task</TableCell>
                <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Assignee</TableCell>
                <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Case</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Progress</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTasks.map((task) => (
                <TableRow key={task._id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {task.title}
                    </Typography>
                    {task.description && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {task.description.substring(0, 50)}...
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                        {task.assignedTo?.name?.charAt(0)}
                      </Avatar>
                      {task.assignedTo?.name}
                    </Box>
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                    {task.caseId?.caseNumber || '-'}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={format(new Date(task.dueDate), 'dd-MM-yyyy')}
                      color={getDueDateStatus(task.dueDate)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={task.priority}
                      color={getPriorityColor(task.priority)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 100 }}>
                      <LinearProgress
                        variant="determinate"
                        value={task.progress || 0}
                        sx={{ flex: 1 }}
                      />
                      <Typography variant="caption">{task.progress || 0}%</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={task.status}
                      color={getStatusColor(task.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                      <IconButton size="small" onClick={() => handleViewTask(task)}>
                        <Visibility fontSize="small" />
                      </IconButton>
                      {/* Status Update Buttons for Employees */}
                      {task.assignedTo?._id === user?._id && task.status !== 'completed' && task.status !== 'approved' && (
                        <>
                          {task.status === 'assigned' && (
                            <Tooltip title="Start Task">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleUpdateStatus(task._id, 'in-progress')}
                              >
                                <PlayArrow fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {task.status === 'in-progress' && (
                            <>
                              <Tooltip title="Pause Task">
                                <IconButton
                                  size="small"
                                  color="warning"
                                  onClick={() => handleUpdateStatus(task._id, 'assigned')}
                                >
                                  <Pause fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Mark as Completed">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => handleUpdateStatus(task._id, 'completed')}
                                >
                                  <CheckCircle fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create Task Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth fullScreen={isMobile}>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Add Task</Typography>
            <IconButton onClick={() => setOpenDialog(false)} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* Task */}
            <Grid item xs={12}>
              <Typography variant="body2" fontWeight={500} gutterBottom>
                Task <span style={{ color: 'red' }}>*</span>
              </Typography>
              <TextField
                fullWidth
                placeholder="Type your task here..."
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </Grid>

            {/* Assignees */}
            <Grid item xs={12}>
              <Typography variant="body2" fontWeight={500} gutterBottom>
                Assignees <span style={{ color: 'red' }}>*</span>
              </Typography>
              <FormControl fullWidth>
                <Select
                  multiple
                  value={formData.assignees}
                  onChange={(e) => setFormData({ ...formData, assignees: e.target.value })}
                  displayEmpty
                  renderValue={(selected) => {
                    if (selected.length === 0) {
                      return <Typography color="text.secondary">Select</Typography>;
                    }
                    return selected.map(id => {
                      const emp = employees.find(e => e._id === id);
                      return emp?.name;
                    }).join(', ');
                  }}
                  required
                >
                  {employees.map((emp) => (
                    <MenuItem key={emp._id} value={emp._id}>
                      {emp.name} ({emp.designation || 'Employee'})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Due Date, Due Time, Reminder */}
            <Grid item xs={12}>
              <Typography variant="body2" fontWeight={500} gutterBottom>
                Due Date <span style={{ color: 'red' }}>*</span>
              </Typography>
              <TextField
                fullWidth
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  endAdornment: <CalendarToday sx={{ color: 'text.secondary', mr: 1 }} />
                }}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="body2" fontWeight={500} gutterBottom>
                Due Time
              </Typography>
              <TextField
                fullWidth
                type="time"
                value={formData.dueTime}
                onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })}
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  endAdornment: <AccessTime sx={{ color: 'text.secondary', mr: 1 }} />
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="body2" fontWeight={500} gutterBottom>
                Reminder Notification
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField
                  type="number"
                  value={formData.reminderValue}
                  onChange={(e) => setFormData({ ...formData, reminderValue: e.target.value })}
                  placeholder="30"
                  sx={{ width: 100 }}
                />
                <FormControl sx={{ minWidth: 120 }}>
                  <Select
                    value={formData.reminderUnit}
                    onChange={(e) => setFormData({ ...formData, reminderUnit: e.target.value })}
                  >
                    <MenuItem value="minutes">minutes</MenuItem>
                    <MenuItem value="hours">hours</MenuItem>
                    <MenuItem value="days">days</MenuItem>
                  </Select>
                </FormControl>
                {formData.reminderValue && (
                  <IconButton
                    size="small"
                    onClick={() => setFormData({ ...formData, reminderValue: '', reminderUnit: 'minutes' })}
                  >
                    <Close fontSize="small" />
                  </IconButton>
                )}
              </Box>
            </Grid>

            {/* Resource Information */}
            <Grid item xs={12}>
              <Typography variant="body2" fontWeight={500} gutterBottom>
                Type of Resource
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant={formData.resourceType === 'none' ? 'contained' : 'outlined'}
                  onClick={() => setFormData({ ...formData, resourceType: 'none' })}
                  size="small"
                >
                  None
                </Button>
                <Button
                  variant={formData.resourceType === 'case' ? 'contained' : 'outlined'}
                  onClick={() => setFormData({ ...formData, resourceType: 'case' })}
                  size="small"
                >
                  Case
                </Button>
                <Button
                  variant={formData.resourceType === 'client' ? 'contained' : 'outlined'}
                  onClick={() => setFormData({ ...formData, resourceType: 'client' })}
                  size="small"
                >
                  Client
                </Button>
              </Box>
            </Grid>

            {formData.resourceType !== 'none' && (
              <Grid item xs={12}>
                <Typography variant="body2" fontWeight={500} gutterBottom>
                  Resource Name
                </Typography>
                <FormControl fullWidth>
                  <Select
                    value={formData.resourceName}
                    onChange={(e) => setFormData({ ...formData, resourceName: e.target.value })}
                    displayEmpty
                  >
                    <MenuItem value="">
                      <Typography color="text.secondary">Select option</Typography>
                    </MenuItem>
                    {formData.resourceType === 'case' && cases.map((caseItem) => (
                      <MenuItem key={caseItem._id} value={caseItem._id}>
                        {caseItem.caseNumber} - {caseItem.title}
                      </MenuItem>
                    ))}
                    {formData.resourceType === 'client' && clients.map((client) => (
                      <MenuItem key={client._id} value={client._id}>
                        {client.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            <Grid item xs={12}>
              <Typography variant="body2" fontWeight={500} gutterBottom>
                Select Fields
              </Typography>
              <Button
                variant="outlined"
                onClick={() => {/* Open field selector dialog */}}
                sx={{ width: '100%', justifyContent: 'space-between' }}
              >
                <span>{formData.selectedFields.length} Selected</span>
                <MoreVert />
              </Button>
            </Grid>

            {/* File Upload */}
            <Grid item xs={12}>
              <Typography variant="body2" fontWeight={500} gutterBottom>
                Attachments
              </Typography>
              <Box
                sx={{
                  border: '2px dashed',
                  borderColor: 'divider',
                  borderRadius: 2,
                  p: 3,
                  textAlign: 'center',
                  cursor: 'pointer',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'action.hover'
                  }
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const files = Array.from(e.dataTransfer.files);
                  setFormData({ ...formData, files: [...formData.files, ...files] });
                }}
              >
                <input
                  type="file"
                  multiple
                  style={{ display: 'none' }}
                  id="file-upload"
                  onChange={handleFileUpload}
                />
                <label htmlFor="file-upload" style={{ cursor: 'pointer' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                    <AttachFile sx={{ fontSize: 40, color: 'primary.main' }} />
                    <Typography variant="body2" color="text.secondary">
                      Drop files here or{' '}
                      <span style={{ color: 'primary.main', textDecoration: 'underline' }}>
                        Click to Upload
                      </span>
                    </Typography>
                  </Box>
                </label>
              </Box>
              {formData.files.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  {formData.files.map((file, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: 1,
                        bgcolor: 'grey.100',
                        borderRadius: 1,
                        mb: 1
                      }}
                    >
                      <Typography variant="body2">{file.name}</Typography>
                      <IconButton size="small" onClick={() => handleRemoveFile(index)}>
                        <Close fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setOpenDialog(false)}
            variant="outlined"
            color="error"
            sx={{ flex: 1 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateTask}
            variant="contained"
            color="success"
            disabled={loading || !formData.title || formData.assignees.length === 0}
            sx={{ flex: 1 }}
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Task Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth fullScreen={isMobile}>
        {selectedTask && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">{selectedTask.title}</Typography>
                <Chip
                  label={selectedTask.status}
                  color={getStatusColor(selectedTask.status)}
                  size="small"
                />
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    {selectedTask.description}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Assignee</Typography>
                  <Typography variant="body1">{selectedTask.assignedTo?.name}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Due Date</Typography>
                  <Typography variant="body1">
                    {format(new Date(selectedTask.dueDate), 'dd-MM-yyyy')}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Priority</Typography>
                  <Chip
                    label={selectedTask.priority}
                    color={getPriorityColor(selectedTask.priority)}
                    size="small"
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Progress</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={selectedTask.progress || 0}
                      sx={{ flex: 1 }}
                    />
                    <Typography variant="body2">{selectedTask.progress || 0}%</Typography>
                  </Box>
                </Grid>
                {selectedTask.comments && selectedTask.comments.length > 0 && (
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" gutterBottom>Comments</Typography>
                    <List>
                      {selectedTask.comments.map((comment, index) => (
                        <ListItem key={index}>
                          <ListItemText
                            primary={comment.content}
                            secondary={`${comment.addedBy?.name || 'Unknown'} • ${format(new Date(comment.addedAt), 'dd-MM-yyyy HH:mm')}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => {
                setCommentDialogOpen(true);
                setSelectedTask(selectedTask);
              }} startIcon={<Comment />}>
                Add Comment
              </Button>
              {/* Status Update Buttons for Employees */}
              {/* Status Update Section for Employees */}
              {selectedTask.assignedTo?._id === user?._id && selectedTask.status !== 'completed' && selectedTask.status !== 'approved' && (
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                  {selectedTask.status === 'assigned' && (
                    <Button
                      onClick={() => {
                        handleUpdateStatus(selectedTask._id, 'in-progress');
                        fetchTasks();
                      }}
                      variant="contained"
                      color="primary"
                      startIcon={<PlayArrow />}
                    >
                      Start Task
                    </Button>
                  )}
                  {selectedTask.status === 'in-progress' && (
                    <>
                      <Button
                        onClick={() => {
                          handleUpdateStatus(selectedTask._id, 'assigned');
                          fetchTasks();
                        }}
                        variant="outlined"
                        color="warning"
                        startIcon={<Pause />}
                      >
                        Pause Task
                      </Button>
                      <Button
                        onClick={() => {
                          handleUpdateStatus(selectedTask._id, 'completed');
                          fetchTasks();
                        }}
                        variant="contained"
                        color="success"
                        startIcon={<CheckCircle />}
                      >
                        Mark as Completed
                      </Button>
                    </>
                  )}
                  {/* Quick Status Dropdown */}
                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel>Change Status</InputLabel>
                    <Select
                      value={selectedTask.status}
                      label="Change Status"
                      onChange={(e) => {
                        handleUpdateStatus(selectedTask._id, e.target.value);
                        fetchTasks();
                      }}
                    >
                      <MenuItem value="assigned">Assigned</MenuItem>
                      <MenuItem value="in-progress">In Progress</MenuItem>
                      <MenuItem value="completed">Completed</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              )}
              <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Add Comment Dialog */}
      <Dialog open={commentDialogOpen} onClose={() => setCommentDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Comment</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Comment"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCommentDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddComment} variant="contained" disabled={!newComment.trim()}>
            Add Comment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Tasks;

