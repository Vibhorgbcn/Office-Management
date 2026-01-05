import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Link,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import WorkIcon from '@mui/icons-material/Work';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const DashboardHome = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [stats, setStats] = useState({
    assignedCases: 0,
    activeAssignments: 0,
    todayAttendance: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [casesRes, assignmentsRes] = await Promise.all([
        axios.get('/cases'),
        axios.get('/work-assignments?status=assigned,in-progress'),
      ]);

      const today = new Date().toISOString().split('T')[0];
      const attendanceRes = await axios.get(`/attendance/my-attendance?startDate=${today}&endDate=${today}`);
      
      setStats({
        assignedCases: casesRes.data.length,
        activeAssignments: assignmentsRes.data.length,
        todayAttendance: attendanceRes.data.length > 0 ? attendanceRes.data[0] : null,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
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

  const statCards = [
    {
      title: 'Assigned Cases',
      value: stats.assignedCases,
      icon: <AssignmentIcon sx={{ fontSize: 40 }} />,
      color: '#1976d2',
      link: '/employee/cases',
    },
    {
      title: 'Active Assignments',
      value: stats.activeAssignments,
      icon: <WorkIcon sx={{ fontSize: 40 }} />,
      color: '#ed6c02',
      link: '/employee/work-assignments',
    },
    {
      title: 'Today\'s Attendance',
      value: stats.todayAttendance ? 'Present' : 'Not Checked In',
      icon: <AccessTimeIcon sx={{ fontSize: 40 }} />,
      color: stats.todayAttendance ? '#2e7d32' : '#9c27b0',
      link: '/employee/attendance',
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
        Employee Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: { xs: 2, sm: 4 } }}>
        Welcome to your dashboard
      </Typography>

      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card 
              sx={{ cursor: 'pointer' }}
              onClick={() => navigate(card.link)}
            >
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography color="text.secondary" gutterBottom sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      {card.title}
                    </Typography>
                    <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                      {card.value}
                    </Typography>
                  </Box>
                  <Box sx={{ color: card.color, ml: 1, '& svg': { fontSize: { xs: 32, sm: 40 } } }}>
                    {card.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default DashboardHome;

