import React, { useState, useEffect } from 'react';
import {
  Box, Button, Card, CardContent, Typography, List, ListItem,
  ListItemText, ListItemSecondaryAction, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Grid, MenuItem, Alert,
  useMediaQuery, useTheme, IconButton, Checkbox
} from '@mui/material';
import {
  Add, CheckCircle, Snooze, Notifications, Event
} from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

const Reminders = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    reminderType: 'task-deadline',
    title: '',
    description: '',
    dueDate: '',
    relatedType: 'task',
    relatedId: '',
    priority: 'medium'
  });

  useEffect(() => {
    fetchReminders();
  }, []);

  const fetchReminders = async () => {
    try {
      const response = await axios.get('/reminders?status=pending');
      setReminders(response.data);
    } catch (error) {
      console.error('Error fetching reminders:', error);
      setError('Failed to load reminders');
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');
      await axios.post('/reminders', form);
      setSuccess('Reminder created successfully');
      setDialogOpen(false);
      setForm({
        reminderType: 'task-deadline',
        title: '',
        description: '',
        dueDate: '',
        relatedType: 'task',
        relatedId: '',
        priority: 'medium'
      });
      fetchReminders();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create reminder');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (id) => {
    try {
      await axios.post(`/reminders/${id}/complete`);
      setSuccess('Reminder marked as completed');
      fetchReminders();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update reminder');
    }
  };

  const handleSnooze = async (id) => {
    const snoozeDate = new Date();
    snoozeDate.setDate(snoozeDate.getDate() + 1);
    
    try {
      await axios.post(`/reminders/${id}/snooze`, {
        snoozedUntil: snoozeDate.toISOString()
      });
      setSuccess('Reminder snoozed until tomorrow');
      fetchReminders();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to snooze reminder');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      'court-hearing': 'Court Hearing',
      'task-deadline': 'Task Deadline',
      'bill-due': 'Bill Due',
      'client-follow-up': 'Client Follow-up',
      'case-action': 'Case Action',
      'document-submission': 'Document Submission'
    };
    return labels[type] || type;
  };

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date();
  };

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', px: { xs: 1, sm: 0 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
          Reminders
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setDialogOpen(true)}
        >
          Create Reminder
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

      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Pending Reminders</Typography>
              {reminders.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                  No pending reminders
                </Typography>
              ) : (
                <List>
                  {reminders.map((reminder) => (
                    <ListItem
                      key={reminder._id}
                      sx={{
                        borderLeft: 4,
                        borderColor: getPriorityColor(reminder.priority) + '.main',
                        mb: 1,
                        bgcolor: isOverdue(reminder.dueDate) ? 'error.light' : 'background.paper'
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {reminder.title}
                            </Typography>
                            <Chip
                              label={getTypeLabel(reminder.reminderType)}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                            <Chip
                              label={reminder.priority}
                              size="small"
                              color={getPriorityColor(reminder.priority)}
                            />
                            {isOverdue(reminder.dueDate) && (
                              <Chip label="Overdue" size="small" color="error" />
                            )}
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                              {reminder.description}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                              Due: {format(new Date(reminder.dueDate), 'dd-MM-yyyy HH:mm')}
                            </Typography>
                          </Box>
                        }
                      />
                      <ListItemSecondaryAction>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => handleComplete(reminder._id)}
                          >
                            <CheckCircle />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="warning"
                            onClick={() => handleSnooze(reminder._id)}
                          >
                            <Snooze />
                          </IconButton>
                        </Box>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Upcoming (Next 7 Days)</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
                Upcoming reminders will appear here
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Create Reminder Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Reminder</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label="Reminder Type"
                value={form.reminderType}
                onChange={(e) => setForm({ ...form, reminderType: e.target.value })}
              >
                <MenuItem value="court-hearing">Court Hearing</MenuItem>
                <MenuItem value="task-deadline">Task Deadline</MenuItem>
                <MenuItem value="bill-due">Bill Due</MenuItem>
                <MenuItem value="client-follow-up">Client Follow-up</MenuItem>
                <MenuItem value="case-action">Case Action</MenuItem>
                <MenuItem value="document-submission">Document Submission</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="datetime-local"
                label="Due Date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Priority"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || !form.title || !form.dueDate}
          >
            {loading ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Reminders;


