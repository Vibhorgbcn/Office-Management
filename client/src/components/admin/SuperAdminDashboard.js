import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Alert, Chip,
  CircularProgress, TextField, Button, useMediaQuery, useTheme,
  Tabs, Tab, Paper
} from '@mui/material';
import {
  TrendingUp, People, Assignment, AccountBalance, Warning,
  CheckCircle, TrendingDown, AccessTime, AttachMoney
} from '@mui/icons-material';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import axios from 'axios';
import { format } from 'date-fns';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const SuperAdminDashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [dateRange, setDateRange] = useState({
    startDate: format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });

  useEffect(() => {
    fetchDashboardData();
  }, [dateRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/analytics/dashboard', {
        params: {
          startDate: dateRange.startDate,
          endDate: dateRange.endDate
        }
      });
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !dashboardData) {
    return (
      <Box sx={{ px: { xs: 1, sm: 0 } }}>
        <Alert severity="error">{error || 'Failed to load dashboard'}</Alert>
      </Box>
    );
  }

  const { kpis, charts, alerts } = dashboardData;

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', px: { xs: 1, sm: 0 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
          Super Admin Dashboard
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <TextField
            type="date"
            label="Start Date"
            value={dateRange.startDate}
            onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
            InputLabelProps={{ shrink: true }}
            size="small"
          />
          <TextField
            type="date"
            label="End Date"
            value={dateRange.endDate}
            onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
            InputLabelProps={{ shrink: true }}
            size="small"
          />
        </Box>
      </Box>

      {/* Alerts */}
      {alerts && alerts.length > 0 && (
        <Box sx={{ mb: 3 }}>
          {alerts.map((alert, index) => (
            <Alert
              key={index}
              severity={alert.type}
              sx={{ mb: 1 }}
              action={
                <Button color="inherit" size="small" onClick={() => window.location.href = alert.link}>
                  View
                </Button>
              }
            >
              <strong>{alert.title}:</strong> {alert.message}
            </Alert>
          ))}
        </Box>
      )}

      {/* KPI Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Total Employees"
            value={kpis.totalEmployees}
            icon={<People />}
            color="primary"
            trend={null}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Attendance Rate"
            value={`${kpis.attendanceRate?.toFixed(1) || 0}%`}
            icon={<AccessTime />}
            color={kpis.attendanceRate >= 90 ? 'success' : kpis.attendanceRate >= 70 ? 'warning' : 'error'}
            trend={null}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Active Cases"
            value={kpis.activeCases}
            icon={<Assignment />}
            color="info"
            trend={null}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Productivity Score"
            value={`${kpis.productivityScore?.toFixed(1) || 0}%`}
            icon={<TrendingUp />}
            color={kpis.productivityScore >= 80 ? 'success' : kpis.productivityScore >= 60 ? 'warning' : 'error'}
            trend={null}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Total Billed"
            value={`₹${(kpis.totalBilled || 0).toLocaleString()}`}
            icon={<AttachMoney />}
            color="success"
            trend={null}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Total Collected"
            value={`₹${(kpis.totalCollected || 0).toLocaleString()}`}
            icon={<CheckCircle />}
            color="success"
            trend={null}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Outstanding"
            value={`₹${(kpis.outstanding || 0).toLocaleString()}`}
            icon={<Warning />}
            color="error"
            trend={null}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="Realization Ratio"
            value={`${kpis.realizationRatio?.toFixed(1) || 0}%`}
            icon={<AccountBalance />}
            color={kpis.realizationRatio >= 80 ? 'success' : kpis.realizationRatio >= 60 ? 'warning' : 'error'}
            trend={null}
          />
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={selectedTab} onChange={(e, v) => setSelectedTab(v)}>
          <Tab label="Revenue" />
          <Tab label="Attendance" />
          <Tab label="Cases" />
          <Tab label="Departments" />
        </Tabs>
      </Box>

      {/* Revenue Trend */}
      {selectedTab === 0 && charts.revenueTrend && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Revenue Trend</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={charts.revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="amount" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Attendance Trend */}
      {selectedTab === 1 && charts.attendanceTrend && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Attendance Trend</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={charts.attendanceTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="present" stroke="#00C49F" strokeWidth={2} />
                <Line type="monotone" dataKey="absent" stroke="#FF8042" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Case Distribution */}
      {selectedTab === 2 && charts.caseDistribution && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Case Distribution by Type</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={charts.caseDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ type, count }) => `${type}: ${count}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {charts.caseDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Department Comparison */}
      {selectedTab === 3 && charts.departmentComparison && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Department Performance</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={charts.departmentComparison}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="productivityScore" fill="#8884d8" name="Productivity Score" />
                <Bar dataKey="billableHours" fill="#82ca9d" name="Billable Hours" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

const KPICard = ({ title, value, icon, color, trend }) => {
  const theme = useTheme();
  
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
          <Box sx={{ color: `${color}.main` }}>
            {icon}
          </Box>
        </Box>
        <Typography variant="h4" sx={{ fontWeight: 700, color: `${color}.main` }}>
          {value}
        </Typography>
        {trend && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            {trend > 0 ? (
              <TrendingUp sx={{ color: 'success.main', fontSize: 16, mr: 0.5 }} />
            ) : (
              <TrendingDown sx={{ color: 'error.main', fontSize: 16, mr: 0.5 }} />
            )}
            <Typography variant="caption" color={trend > 0 ? 'success.main' : 'error.main'}>
              {Math.abs(trend)}% from last period
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default SuperAdminDashboard;


