import React, { useState, useEffect } from 'react';
import {
  Box, Button, Card, CardContent, Typography, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Select, FormControl,
  InputLabel, Alert, Grid, IconButton, useMediaQuery, useTheme, Chip,
  List, ListItem, ListItemText, ListItemAvatar, Avatar, Divider
} from '@mui/material';
import {
  Add, CalendarToday, Event, Gavel, Assignment, Close, ArrowBack,
  ArrowForward, Today, FilterList
} from '@mui/icons-material';
import axios from 'axios';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Calendar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [cases, setCases] = useState([]);
  const [causelists, setCauselists] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [openEventDialog, setOpenEventDialog] = useState(false);
  const [viewEventDialog, setViewEventDialog] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [eventType, setEventType] = useState('all'); // 'all', 'hearings', 'deadlines', 'meetings'
  const [formData, setFormData] = useState({
    title: '',
    type: 'meeting',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '',
    description: '',
    caseId: '',
    relatedTo: ''
  });

  useEffect(() => {
    fetchEvents();
  }, [currentDate]);

  const fetchEvents = async () => {
    try {
      // Fetch cases with next hearing dates
      const casesResponse = await axios.get('/cases');
      setCases(casesResponse.data);
      
      // Fetch causelists for the month
      const startDate = startOfMonth(currentDate);
      const endDate = endOfMonth(currentDate);
      const causelistsResponse = await axios.get(`/causelists`);
      const allCauselists = causelistsResponse.data || [];
      const monthCauselists = allCauselists.filter(c => {
        const causelistDate = new Date(c.date);
        return causelistDate >= startDate && causelistDate <= endDate;
      });
      setCauselists(monthCauselists);
      
      // Fetch tasks with due dates
      const tasksResponse = await axios.get('/work-assignments');
      setTasks(tasksResponse.data || []);
      
      // Combine all events
      const allEvents = [];
      
      // Add case hearings
      casesResponse.data.forEach(caseItem => {
        if (caseItem.nextHearingDate) {
          allEvents.push({
            id: `case-${caseItem._id}`,
            title: `Hearing: ${caseItem.caseNumber}`,
            date: new Date(caseItem.nextHearingDate),
            type: 'hearing',
            caseId: caseItem._id,
            description: caseItem.title,
            court: caseItem.court
          });
        }
      });
      
      // Add causelist entries
      (causelistsResponse.data || []).forEach(causelist => {
        allEvents.push({
          id: `causelist-${causelist._id}`,
          title: `Court: ${causelist.caseNumber}`,
          date: new Date(causelist.date),
          type: 'hearing',
          caseId: causelist.caseId?._id,
          description: causelist.caseId?.title,
          court: causelist.court,
          courtRoom: causelist.courtRoom
        });
      });
      
      // Add task deadlines
      (tasksResponse.data || []).forEach(task => {
        if (task.dueDate && task.status !== 'completed') {
          allEvents.push({
            id: `task-${task._id}`,
            title: `Task: ${task.title}`,
            date: new Date(task.dueDate),
            type: 'deadline',
            taskId: task._id,
            description: task.description,
            priority: task.priority
          });
        }
      });
      
      setEvents(allEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    const dayEvents = events.filter(event => isSameDay(event.date, date));
    setSelectedEvents(dayEvents);
    if (dayEvents.length > 0) {
      setViewEventDialog(true);
    }
  };

  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const getEventsForDate = (date) => {
    return events.filter(event => {
      if (eventType !== 'all' && event.type !== eventType) return false;
      return isSameDay(event.date, date);
    });
  };

  const getEventColor = (type) => {
    const colors = {
      hearing: 'error',
      deadline: 'warning',
      meeting: 'info',
      other: 'default'
    };
    return colors[type] || 'default';
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get first day of week for the month
  const firstDayOfWeek = monthStart.getDay();
  const emptyDays = Array(firstDayOfWeek).fill(null);

  const filteredEvents = events.filter(event => {
    if (eventType === 'all') return true;
    return event.type === eventType;
  });

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', px: { xs: 1, sm: 0 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
          Calendar & Schedule
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Event Type</InputLabel>
            <Select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              label="Event Type"
            >
              <MenuItem value="all">All Events</MenuItem>
              <MenuItem value="hearing">Hearings</MenuItem>
              <MenuItem value="deadline">Deadlines</MenuItem>
              <MenuItem value="meeting">Meetings</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<Today />}
            onClick={handleToday}
          >
            Today
          </Button>
          {user?.role === 'admin' && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setOpenEventDialog(true)}
            >
              Add Event
            </Button>
          )}
        </Box>
      </Box>

      {/* Calendar Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <IconButton onClick={handlePreviousMonth}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h5" fontWeight={600}>
              {format(currentDate, 'MMMM yyyy')}
            </Typography>
            <IconButton onClick={handleNextMonth}>
              <ArrowForward />
            </IconButton>
          </Box>

          {/* Calendar Grid */}
          <Grid container spacing={0.5}>
            {/* Day Headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <Grid item xs key={day} sx={{ textAlign: 'center', py: 1 }}>
                <Typography variant="body2" fontWeight={600} color="text.secondary">
                  {day}
                </Typography>
              </Grid>
            ))}

            {/* Empty days for alignment */}
            {emptyDays.map((_, index) => (
              <Grid item xs key={`empty-${index}`} sx={{ minHeight: 80 }} />
            ))}

            {/* Calendar Days */}
            {daysInMonth.map((day) => {
              const dayEvents = getEventsForDate(day);
              const isToday = isSameDay(day, new Date());
              const isSelected = isSameDay(day, selectedDate);

              return (
                <Grid
                  item
                  xs
                  key={day.toISOString()}
                  sx={{
                    minHeight: 80,
                    border: '1px solid',
                    borderColor: 'divider',
                    p: 0.5,
                    cursor: 'pointer',
                    bgcolor: isToday ? 'action.selected' : isSelected ? 'action.hover' : 'transparent',
                    '&:hover': { bgcolor: 'action.hover' }
                  }}
                  onClick={() => handleDateClick(day)}
                >
                  <Typography
                    variant="body2"
                    fontWeight={isToday ? 700 : 400}
                    color={isToday ? 'primary.main' : 'text.primary'}
                    sx={{ mb: 0.5 }}
                  >
                    {format(day, 'd')}
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                    {dayEvents.slice(0, 2).map((event) => (
                      <Chip
                        key={event.id}
                        label={event.title.substring(0, 15)}
                        size="small"
                        color={getEventColor(event.type)}
                        sx={{ fontSize: '0.65rem', height: 18 }}
                      />
                    ))}
                    {dayEvents.length > 2 && (
                      <Typography variant="caption" color="text.secondary">
                        +{dayEvents.length - 2} more
                      </Typography>
                    )}
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </CardContent>
      </Card>

      {/* Upcoming Events List */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Upcoming Events ({filteredEvents.filter(e => e.date >= new Date()).length})
          </Typography>
          <List>
            {filteredEvents
              .filter(e => e.date >= new Date())
              .sort((a, b) => a.date - b.date)
              .slice(0, 10)
              .map((event) => (
                <ListItem
                  key={event.id}
                  button
                  onClick={() => {
                    setSelectedDate(event.date);
                    setSelectedEvents([event]);
                    setViewEventDialog(true);
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: `${getEventColor(event.type)}.main` }}>
                      {event.type === 'hearing' && <Gavel />}
                      {event.type === 'deadline' && <Assignment />}
                      {event.type === 'meeting' && <Event />}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={event.title}
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="text.primary">
                          {format(event.date, 'dd-MM-yyyy HH:mm')}
                        </Typography>
                        {event.description && (
                          <Typography variant="body2" color="text.secondary" display="block">
                            {event.description}
                          </Typography>
                        )}
                        {event.court && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            {event.court}
                          </Typography>
                        )}
                      </>
                    }
                  />
                  <Chip
                    label={event.type}
                    color={getEventColor(event.type)}
                    size="small"
                  />
                </ListItem>
              ))}
          </List>
        </CardContent>
      </Card>

      {/* View Events Dialog */}
      <Dialog open={viewEventDialog} onClose={() => setViewEventDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Events on {format(selectedDate, 'dd-MM-yyyy')}
            </Typography>
            <IconButton onClick={() => setViewEventDialog(false)} size="small">
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <List>
            {selectedEvents.map((event) => (
              <ListItem key={event.id} divider>
                <ListItemAvatar>
                  <Avatar sx={{ bgcolor: `${getEventColor(event.type)}.main` }}>
                    {event.type === 'hearing' && <Gavel />}
                    {event.type === 'deadline' && <Assignment />}
                    {event.type === 'meeting' && <Event />}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={event.title}
                  secondary={
                    <>
                      <Typography variant="body2" color="text.secondary">
                        {format(event.date, 'HH:mm')}
                      </Typography>
                      {event.description && (
                        <Typography variant="body2" color="text.secondary">
                          {event.description}
                        </Typography>
                      )}
                      {event.court && (
                        <Typography variant="body2" color="text.secondary">
                          Court: {event.court}
                        </Typography>
                      )}
                    </>
                  }
                />
                {event.caseId && (
                  <Button
                    size="small"
                    onClick={() => {
                      setViewEventDialog(false);
                      navigate(`/admin/case-workspace/${event.caseId}`);
                    }}
                  >
                    View Case
                  </Button>
                )}
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewEventDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Calendar;

