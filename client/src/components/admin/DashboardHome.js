import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  LinearProgress,
  Button,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import GavelIcon from '@mui/icons-material/Gavel';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import EventIcon from '@mui/icons-material/Event';
import WarningIcon from '@mui/icons-material/Warning';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { format } from 'date-fns';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import SuperAdminDashboard from './SuperAdminDashboard';
import SubAdminDashboard from './SubAdminDashboard';

const DashboardHome = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
  const [stats, setStats] = useState({
    todayAttendance: { present: 0, absent: 0, total: 0 },
    todayHearings: [],
    pendingTasks: 0,
    unpaidBills: 0,
    totalOutstanding: 0,
    upcomingHearings: [],
    delayedTasks: 0,
    monthlyRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only fetch data if not super-admin or sub-admin
    if (user?.role !== 'super-admin' && user?.role !== 'sub-admin') {
      fetchDashboardData();
    }
  }, [user]);

  // Render Super Admin Dashboard
  if (user?.role === 'super-admin') {
    return <SuperAdminDashboard />;
  }

  // Render Sub Admin Dashboard
  if (user?.role === 'sub-admin') {
    return <SubAdminDashboard />;
  }

  const fetchDashboardData = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      
      const [attendanceRes, casesRes, tasksRes, billsRes] = await Promise.all([
        axios.get(`/attendance/all?startDate=${today}&endDate=${today}`),
        axios.get('/cases'),
        axios.get('/work-assignments?status=assigned,in-progress'),
        axios.get('/bills?status=sent,overdue'),
      ]);

      const attendance = attendanceRes.data;
      const cases = casesRes.data;
      const tasks = tasksRes.data;
      const bills = billsRes.data;

      // Calculate today's attendance
      const present = attendance.filter(a => a.status === 'present' || a.status === 'half-day').length;
      const total = attendance.length;

      // Get today's and upcoming hearings
      const todayHearings = cases.filter(c => 
        c.nextHearingDate && format(new Date(c.nextHearingDate), 'yyyy-MM-dd') === today
      );
      
      const upcomingHearings = cases
        .filter(c => c.nextHearingDate && new Date(c.nextHearingDate) > new Date())
        .sort((a, b) => new Date(a.nextHearingDate) - new Date(b.nextHearingDate))
        .slice(0, 5);

      // Calculate delayed tasks
      const delayedTasks = tasks.filter(t => 
        t.status === 'overdue' || (t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed')
      ).length;

      // Calculate outstanding bills
      const unpaidBills = bills.filter(b => b.status === 'sent' || b.status === 'overdue').length;
      const totalOutstanding = bills.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

      setStats({
        todayAttendance: { present, absent: total - present, total },
        todayHearings: todayHearings,
        pendingTasks: tasks.length,
        unpaidBills,
        totalOutstanding,
        upcomingHearings,
        delayedTasks,
        monthlyRevenue: 0, // TODO: Calculate from bills
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const StatCard = ({ title, value, subtitle, icon, color, onClick }) => (
    <Card 
      sx={{ 
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s',
        '&:hover': onClick ? { transform: 'translateY(-2px)', boxShadow: 3 } : {},
      }}
      onClick={onClick}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" color="text.secondary" fontWeight={500} sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
              {title}
            </Typography>
            <Typography variant="h4" fontWeight={700} sx={{ mt: 1, fontSize: { xs: '1.5rem', sm: '2rem' } }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box sx={{ color: color || 'primary.main', ml: 1, '& svg': { fontSize: { xs: 32, sm: 36 } } }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
        Dashboard
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: { xs: 2, sm: 4 } }}>
        Overview of your legal practice
      </Typography>

      {/* Above-the-Fold Cards */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 2, sm: 4 } }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Today's Attendance"
            value={stats.todayAttendance.present}
            subtitle={`${stats.todayAttendance.total} total employees`}
            icon={<AccessTimeIcon sx={{ fontSize: 36 }} />}
            color="success.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Today's Hearings"
            value={stats.todayHearings.length}
            subtitle="Scheduled for today"
            icon={<GavelIcon sx={{ fontSize: 36 }} />}
            color="warning.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pending Tasks"
            value={stats.pendingTasks}
            subtitle={`${stats.delayedTasks} overdue`}
            icon={<AssignmentIcon sx={{ fontSize: 36 }} />}
            color="error.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Unpaid Bills"
            value={stats.unpaidBills}
            subtitle={`₹${(stats.totalOutstanding / 100000).toFixed(1)}L outstanding`}
            icon={<AttachMoneyIcon sx={{ fontSize: 36 }} />}
            color="secondary.main"
          />
        </Grid>
      </Grid>

      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {/* Upcoming Hearings Timeline */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                <Typography variant="h6" fontWeight={600} sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                  Upcoming Hearings
                </Typography>
                <Button size="small" color="primary" sx={{ display: { xs: 'none', sm: 'block' } }}>
                  View All
                </Button>
              </Box>
              {stats.upcomingHearings.length === 0 ? (
                <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
                  No upcoming hearings
                </Typography>
              ) : (
                <List>
                  {stats.upcomingHearings.map((hearing, index) => (
                    <React.Fragment key={hearing._id}>
                      <ListItem
                        sx={{
                          py: 2,
                          px: 2,
                          borderRadius: 2,
                          bgcolor: index === 0 ? 'primary.50' : 'transparent',
                          mb: 1,
                        }}
                      >
                        <ListItemIcon>
                          <EventIcon sx={{ color: 'primary.main' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <Typography variant="subtitle1" fontWeight={600}>
                                {hearing.title}
                              </Typography>
                              <Chip
                                label={hearing.court}
                                size="small"
                                sx={{ bgcolor: 'grey.100', fontSize: '0.7rem' }}
                              />
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary">
                                {hearing.caseNumber} • {hearing.clientName}
                              </Typography>
                              <Typography variant="caption" color="primary.main" fontWeight={600}>
                                {format(new Date(hearing.nextHearingDate), 'MMM dd, yyyy • hh:mm a')}
                              </Typography>
                            </Box>
                          }
                        />
                        {hearing.assignedTo && (
                          <Chip
                            label={hearing.assignedTo.name}
                            size="small"
                            sx={{ ml: 2 }}
                          />
                        )}
                      </ListItem>
                      {index < stats.upcomingHearings.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Insights */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Quick Insights
              </Typography>
              
              <Box sx={{ mt: 3 }}>
                {/* Delayed Tasks */}
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Delayed Tasks
                    </Typography>
                    <Chip
                      label={stats.delayedTasks}
                      size="small"
                      color="error"
                      icon={<WarningIcon />}
                    />
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={(stats.delayedTasks / Math.max(stats.pendingTasks, 1)) * 100}
                    color="error"
                    sx={{ height: 6, borderRadius: 3 }}
                  />
                </Box>

                {/* High-Value Cases */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    High-Priority Cases
                  </Typography>
                  <Typography variant="h5" fontWeight={700}>
                    {stats.upcomingHearings.filter(h => h.priority === 'high' || h.priority === 'urgent').length}
                  </Typography>
                </Box>

                {/* Monthly Revenue */}
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Monthly Revenue
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h5" fontWeight={700} color="success.main">
                      ₹{stats.monthlyRevenue.toLocaleString()}
                    </Typography>
                    <TrendingUpIcon sx={{ color: 'success.main', fontSize: 20 }} />
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardHome;
