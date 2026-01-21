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
  Alert,
  CircularProgress,
  LinearProgress,
  useMediaQuery,
  useTheme,
  TextField,
  Grid,
  Avatar,
} from '@mui/material';
import { CheckCircle, Cancel, LocationOn, LocationOff, Person, PersonOff } from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

const Attendance = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Employee states
  const [attendance, setAttendance] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [locationStatus, setLocationStatus] = useState('idle'); // idle, fetching, success, error
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  
  // Admin states
  const [allEmployeesAttendance, setAllEmployeesAttendance] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [stats, setStats] = useState({ present: 0, absent: 0, halfDay: 0, late: 0, total: 0 });
  
  // Common states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user?.role === 'admin') {
      const loadAdminData = async () => {
        const empData = await fetchEmployees();
        console.log('Total employees loaded:', empData.length);
        setEmployees(empData);
        // Fetch attendance after employees are loaded
        await fetchAllEmployeesAttendance(empData);
      };
      loadAdminData();
    } else {
      fetchTodayAttendance();
      fetchAttendance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedDate]);

  // Get GPS location from browser
  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const errorMsg = 'Geolocation is not supported by your browser. Please use a modern browser like Chrome, Firefox, or Edge.';
        setLocationError(errorMsg);
        setLocationStatus('error');
        reject(new Error(errorMsg));
        return;
      }

      setLocationStatus('fetching');
      setLocationError('');

      // Try high accuracy first (GPS), then fallback to less accurate (network)
      const options = {
        enableHighAccuracy: true,
        timeout: 45000, // Increased to 45 seconds to get better GPS fix
        maximumAge: 0 // Don't use cached location - force fresh GPS reading
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          };
          
          console.log('GPS Location received:', {
            lat: location.latitude,
            lng: location.longitude,
            accuracy: location.accuracy,
            timestamp: new Date().toISOString()
          });
          
          // Store location - no accuracy warnings, check-in allowed from anywhere
          setCurrentLocation(location);
          setLocationStatus('success');
          setLocationError(''); // Clear any previous errors
          
          resolve(location);
        },
        (error) => {
          let errorMessage = '';
          let helpfulInstructions = '';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Location permission denied.';
              helpfulInstructions = 'Please allow location access in your browser settings. Click the lock icon in the address bar and allow location access, then refresh the page.';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable.';
              helpfulInstructions = 'Make sure your device has location services enabled and you are in an area with GPS signal (preferably outdoors or near a window).';
              break;
            case error.TIMEOUT:
              errorMessage = 'Location request timed out.';
              helpfulInstructions = 'GPS signal is weak. Try moving to a location with better signal (near a window or outdoors) and click "Get Location" again.';
              break;
            default:
              errorMessage = 'Unable to get your location.';
              helpfulInstructions = 'Please check your device location settings and try again.';
          }
          
          const fullError = `${errorMessage} ${helpfulInstructions}`;
          setLocationError(fullError);
          setLocationStatus('error');
          reject(new Error(fullError));
        },
        options
      );
    });
  };

  // Retry getting location
  const handleRetryLocation = async () => {
    try {
      await getCurrentLocation();
    } catch (error) {
      // Error already handled in getCurrentLocation
    }
  };

  const fetchTodayAttendance = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const response = await axios.get(`/attendance/my-attendance?startDate=${today}&endDate=${today}`);
      if (response.data.length > 0) {
        setTodayAttendance(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching today attendance:', error);
    }
  };

  const fetchAttendance = async () => {
    try {
      const response = await axios.get('/attendance/my-attendance');
      setAttendance(response.data);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  // Admin functions
  const fetchEmployees = async () => {
    try {
      const response = await axios.get('/users/employees');
      setEmployees(response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching employees:', error);
      return [];
    }
  };

  const fetchAllEmployeesAttendance = async (employeesList = null) => {
    try {
      setLoading(true);
      const response = await axios.get(`/attendance/all?startDate=${selectedDate}&endDate=${selectedDate}`);
      const attendanceData = response.data;
      
      setAllEmployeesAttendance(attendanceData);
      
      // Calculate stats - use provided employees list or state
      const employeesToUse = employeesList || employees;
      const totalEmployees = employeesToUse.length;
      
      const present = attendanceData.filter(a => a.status === 'present' || a.status === 'half-day').length;
      const absent = Math.max(0, totalEmployees - present);
      const halfDay = attendanceData.filter(a => a.status === 'half-day').length;
      const late = attendanceData.filter(a => {
        if (!a.checkIn) return false;
        const checkInTime = new Date(a.checkIn);
        const expectedTime = new Date(selectedDate);
        expectedTime.setHours(9, 30, 0, 0); // Assuming 9:30 AM is expected time
        return checkInTime > expectedTime && a.status !== 'absent';
      }).length;
      
      setStats({
        present,
        absent,
        halfDay,
        late,
        total: totalEmployees,
      });
    } catch (error) {
      console.error('Error fetching all attendance:', error);
      setError('Failed to fetch attendance data');
    } finally {
      setLoading(false);
    }
  };

  const getEmployeeAttendance = (employeeId) => {
    return allEmployeesAttendance.find(a => a.userId?._id === employeeId);
  };

  const getStatusColor = (status) => {
    const colors = {
      present: 'success',
      absent: 'error',
      'half-day': 'warning',
      late: 'warning',
    };
    return colors[status] || 'default';
  };

  const getStatusLabel = (attendance) => {
    if (!attendance) return 'Absent';
    return attendance.status === 'present' ? 'Present' :
           attendance.status === 'half-day' ? 'Half Day' :
           attendance.status || 'Present';
  };

  const handleCheckIn = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Get fresh GPS location first (force new reading)
      const location = await getCurrentLocation();
      
      // Log coordinates for debugging
      console.log('Check-In Coordinates:', {
        lat: location.latitude,
        lng: location.longitude,
        accuracy: location.accuracy
      });
      
      // Send check-in request with GPS coordinates
      const response = await axios.post('/attendance/checkin', {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy
      });
      
      setTodayAttendance(response.data.attendance);
      setSuccess(response.data.message || 'Checked in successfully!');
      // Clear location error on successful check-in
      setLocationError('');
      fetchAttendance();
    } catch (error) {
      if (error.message && (error.message.includes('location') || error.message.includes('GPS'))) {
        setLocationError(error.message);
      } else {
        const errorDetails = error.response?.data?.details;
        const errorMessage = error.response?.data?.message || error.message || 'Check-in failed';
        
        if (errorDetails) {
          let detailedMessage = errorMessage;
          if (errorDetails.nearestOffice) {
            detailedMessage += `\nNearest Office: ${errorDetails.nearestOffice}`;
          }
          if (errorDetails.distance !== undefined) {
            detailedMessage += `\nDistance: ${errorDetails.distance}m`;
            if (errorDetails.allowedRadius) {
              detailedMessage += ` (Allowed radius: ${errorDetails.allowedRadius}m)`;
            }
          }
          // Show coordinate comparison
          if (errorDetails.officeCoordinates && errorDetails.yourCoordinates) {
            detailedMessage += `\n\n📍 Coordinate Comparison:`;
            detailedMessage += `\nOffice Location: ${errorDetails.officeCoordinates.latitude.toFixed(6)}, ${errorDetails.officeCoordinates.longitude.toFixed(6)}`;
            detailedMessage += `\nYour Location: ${errorDetails.yourCoordinates.latitude.toFixed(6)}, ${errorDetails.yourCoordinates.longitude.toFixed(6)}`;
            detailedMessage += `\n\n💡 If you're at the office, ask the admin to update the office location coordinates to match your current location.`;
          }
          setError(detailedMessage);
        } else {
          setError(errorMessage);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // Get fresh GPS location first (force new reading)
      const location = await getCurrentLocation();
      
      // Log coordinates for debugging
      console.log('Check-Out Coordinates:', {
        lat: location.latitude,
        lng: location.longitude,
        accuracy: location.accuracy
      });
      
      // Send check-out request with GPS coordinates
      const response = await axios.post('/attendance/checkout', {
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy: location.accuracy
      });
      
      setTodayAttendance(response.data.attendance);
      setSuccess('Checked out successfully!');
      // Clear location error on successful check-out - coordinates matched office location
      setLocationError('');
      fetchAttendance();
    } catch (error) {
      if (error.message && (error.message.includes('location') || error.message.includes('GPS'))) {
        setLocationError(error.message);
      } else {
        const errorDetails = error.response?.data?.details;
        const errorMessage = error.response?.data?.message || error.message || 'Check-out failed';
        
        if (errorDetails) {
          let detailedMessage = errorMessage;
          if (errorDetails.nearestOffice) {
            detailedMessage += `\nNearest Office: ${errorDetails.nearestOffice}`;
          }
          if (errorDetails.distance !== undefined) {
            detailedMessage += `\nDistance: ${errorDetails.distance}m`;
            if (errorDetails.allowedRadius) {
              detailedMessage += ` (Allowed radius: ${errorDetails.allowedRadius}m)`;
            }
          }
          // Show coordinate comparison
          if (errorDetails.officeCoordinates && errorDetails.yourCoordinates) {
            detailedMessage += `\n\n📍 Coordinate Comparison:`;
            detailedMessage += `\nOffice Location: ${errorDetails.officeCoordinates.latitude.toFixed(6)}, ${errorDetails.officeCoordinates.longitude.toFixed(6)}`;
            detailedMessage += `\nYour Location: ${errorDetails.yourCoordinates.latitude.toFixed(6)}, ${errorDetails.yourCoordinates.longitude.toFixed(6)}`;
            detailedMessage += `\n\n💡 If you're at the office, ask the admin to update the office location coordinates to match your current location.`;
          }
          setError(detailedMessage);
        } else {
          setError(errorMessage);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const isCheckedIn = todayAttendance && !todayAttendance.checkOut;
  const canCheckIn = !todayAttendance;
  
  // Check if location is valid for check-in/out 
  // Allow any accuracy - backend will validate geofence based on distance
  // Frontend just needs location data
  const isLocationValid = locationStatus === 'success' && currentLocation;

  // Admin View
  if (user?.role === 'admin') {
    return (
      <Box sx={{ width: '100%', maxWidth: '100%', px: { xs: 1, sm: 0 }, minHeight: 'auto', pb: { xs: 4, sm: 0 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 2, sm: 3 }, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
            Employee Attendance
          </Typography>
          <TextField
            type="date"
            label="Select Date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            size="small"
          />
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="h4" color="success.main" fontWeight={700}>
                  {stats.present}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Present
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="h4" color="error.main" fontWeight={700}>
                  {stats.absent}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Absent
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="h4" color="warning.main" fontWeight={700}>
                  {stats.halfDay}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Half Day
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="h4" color="warning.main" fontWeight={700}>
                  {stats.late}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Late
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Employees Attendance Table */}
        <Card sx={{ width: '100%', mb: { xs: 2, sm: 0 } }}>
          <CardContent sx={{ p: { xs: 1.5, sm: 3 }, '&:last-child': { pb: { xs: 1.5, sm: 3 } } }}>
            <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' }, mb: 2 }}>
              Attendance for {format(new Date(selectedDate), 'MMMM dd, yyyy')}
            </Typography>
            {employees.length > 0 && (
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                Showing {employees.length} employee{employees.length !== 1 ? 's' : ''}
              </Typography>
            )}
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer 
                component={Paper} 
                elevation={0}
                sx={{ 
                  overflowX: 'auto',
                  overflowY: { xs: 'auto', sm: 'visible' },
                  maxHeight: { xs: 'calc(100vh - 350px)', sm: 'none' },
                  width: '100%',
                  WebkitOverflowScrolling: 'touch',
                  '-webkit-overflow-scrolling': 'touch',
                  position: 'relative',
                  '& .MuiTable-root': {
                    minWidth: { xs: 600, sm: 'auto' },
                    width: '100%'
                  },
                  '& .MuiTableBody-root': {
                    display: 'table-row-group'
                  }
                }}
              >
                <Table size={isMobile ? 'small' : 'medium'} stickyHeader={!isMobile}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ minWidth: { xs: 120, sm: 'auto' } }}>Employee</TableCell>
                      <TableCell sx={{ minWidth: { xs: 100, sm: 'auto' } }}>Designation</TableCell>
                      <TableCell sx={{ minWidth: { xs: 80, sm: 'auto' } }}>Check In</TableCell>
                      <TableCell sx={{ minWidth: { xs: 80, sm: 'auto' } }}>Check Out</TableCell>
                      <TableCell sx={{ minWidth: { xs: 80, sm: 'auto' } }}>Status</TableCell>
                      <TableCell sx={{ minWidth: { xs: 80, sm: 'auto' } }}>Work Hours</TableCell>
                      <TableCell sx={{ minWidth: { xs: 120, sm: 'auto' } }}>Location</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {employees.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={isMobile ? 3 : 7} align="center" sx={{ py: 4 }}>
                          <Typography variant="body2" color="text.secondary">
                            No employees found
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      employees.map((employee, index) => {
                        const empAttendance = getEmployeeAttendance(employee._id);
                        const status = getStatusLabel(empAttendance);
                        const statusColor = getStatusColor(empAttendance?.status || 'absent');
                        
                        return (
                          <TableRow 
                            key={employee._id} 
                            sx={{ 
                              '&:hover': { bgcolor: 'action.hover' },
                              display: 'table-row !important',
                              visibility: 'visible !important',
                              height: 'auto',
                              minHeight: '48px'
                            }}
                          >
                            <TableCell sx={{ minWidth: { xs: 120, sm: 'auto' } }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Avatar sx={{ width: { xs: 28, sm: 32 }, height: { xs: 28, sm: 32 }, bgcolor: 'primary.main', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                  {employee.name?.charAt(0).toUpperCase()}
                                </Avatar>
                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                  <Typography variant="body2" fontWeight={500} sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                    {employee.name}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell sx={{ minWidth: { xs: 100, sm: 'auto' } }}>
                              <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                {employee.designation || employee.role}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ minWidth: { xs: 80, sm: 'auto' } }}>
                              {empAttendance?.checkIn ? (
                                <Typography variant="body2" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>
                                  {format(new Date(empAttendance.checkIn), isMobile ? 'HH:mm' : 'HH:mm:ss')}
                                </Typography>
                              ) : (
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>
                                  -
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell sx={{ minWidth: { xs: 80, sm: 'auto' } }}>
                              {empAttendance?.checkOut ? (
                                <Typography variant="body2" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>
                                  {format(new Date(empAttendance.checkOut), isMobile ? 'HH:mm' : 'HH:mm:ss')}
                                </Typography>
                              ) : (
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>
                                  {empAttendance?.checkIn ? (isMobile ? '-' : 'Not checked out') : '-'}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell sx={{ minWidth: { xs: 80, sm: 'auto' } }}>
                              <Chip
                                label={status}
                                color={statusColor}
                                size="small"
                                icon={status === 'Absent' ? <PersonOff /> : <Person />}
                                sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                              />
                            </TableCell>
                            <TableCell sx={{ minWidth: { xs: 80, sm: 'auto' } }}>
                              {empAttendance?.workHours ? (
                                <Typography variant="body2" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>
                                  {empAttendance.workHours} hrs
                                </Typography>
                              ) : (
                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>-</Typography>
                              )}
                            </TableCell>
                            <TableCell sx={{ minWidth: { xs: 120, sm: 'auto' } }}>
                              <Box>
                                {empAttendance?.punchInAddress && (
                                  <Box sx={{ mb: empAttendance?.punchOutAddress ? 1 : 0 }}>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem' }, fontWeight: 600, display: 'block' }}>
                                      {isMobile ? 'In:' : 'Check In:'}
                                    </Typography>
                                    <Typography variant="caption" color="text.primary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' }, display: 'block' }}>
                                      {isMobile && empAttendance.punchInAddress.length > 30 
                                        ? `${empAttendance.punchInAddress.substring(0, 30)}...` 
                                        : empAttendance.punchInAddress}
                                    </Typography>
                                  </Box>
                                )}
                                {empAttendance?.punchOutAddress && (
                                  <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.7rem' }, fontWeight: 600, display: 'block' }}>
                                      {isMobile ? 'Out:' : 'Check Out:'}
                                    </Typography>
                                    <Typography variant="caption" color="text.primary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' }, display: 'block' }}>
                                      {isMobile && empAttendance.punchOutAddress.length > 30 
                                        ? `${empAttendance.punchOutAddress.substring(0, 30)}...` 
                                        : empAttendance.punchOutAddress}
                                    </Typography>
                                  </Box>
                                )}
                                {!empAttendance?.punchInAddress && !empAttendance?.punchOutAddress && (
                                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>-</Typography>
                                )}
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      </Box>
    );
  }

  // Employee View (existing code)
  return (
    <Box sx={{ width: '100%', maxWidth: '100%', px: { xs: 1, sm: 0 } }}>
      <Typography variant="h4" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
        GPS Geofencing Attendance
      </Typography>

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

      {locationError && !todayAttendance && (
        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setLocationError('')}>
          {locationError}
        </Alert>
      )}

      <Card sx={{ mb: { xs: 2, sm: 3 }, mx: { xs: 0, sm: 'auto' }, maxWidth: '100%' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            Today's Attendance
          </Typography>
          
          {/* GPS Location Status */}
          <Box sx={{ mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, flexWrap: 'wrap', gap: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                {locationStatus === 'success' ? (
                  <LocationOn color="success" />
                ) : locationStatus === 'error' ? (
                  <LocationOff color="error" />
                ) : locationStatus === 'fetching' ? (
                  <LocationOn sx={{ color: 'primary.main', animation: 'pulse 2s infinite' }} />
                ) : (
                  <LocationOn color="disabled" />
                )}
                <Typography variant="body2" fontWeight="bold">
                  GPS Status: {
                    locationStatus === 'fetching' ? 'Fetching location...' :
                    locationStatus === 'success' ? 'Location available ✓' :
                    locationStatus === 'error' ? 'Location unavailable' :
                    'Not checked'
                  }
                </Typography>
              </Box>
              {locationStatus !== 'fetching' && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={handleRetryLocation}
                  sx={{ ml: { xs: 0, sm: 2 }, mt: { xs: 1, sm: 0 } }}
                >
                  Get Location
                </Button>
              )}
            </Box>
            {locationStatus === 'fetching' && <LinearProgress sx={{ mt: 1 }} />}
            {currentLocation && (
              <Box sx={{ mt: 1 }}>
                <Typography 
                  variant="caption" 
                  color="text.secondary"
                  display="block"
                >
                  Accuracy: {currentLocation.accuracy >= 1000 ? `±${(currentLocation.accuracy / 1000).toFixed(1)}km` : `±${Math.round(currentLocation.accuracy)}m`}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  Coordinates: {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                </Typography>
                {/* Simple info message - check-in allowed from anywhere */}
                {currentLocation && !todayAttendance && (
                  <Box sx={{ mt: 1, p: 1.5, bgcolor: 'background.default', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', display: 'block', mb: 0.5 }}>
                      Your location will be recorded when you check in. You can check in from anywhere.
                    </Typography>
                    {currentLocation.accuracy > 1000 && (
                      <Typography variant="caption" color="warning.main" sx={{ fontSize: '0.75rem', fontWeight: 600, display: 'block' }}>
                        ⚠️ Note: Network-based location detected (accuracy: ±{(currentLocation.accuracy / 1000).toFixed(1)}km). 
                        The address shown may be approximate. For accurate location, enable GPS on your device.
                      </Typography>
                    )}
                  </Box>
                )}
                {currentLocation && todayAttendance && (
                  <Box sx={{ mt: 1, p: 1.5, bgcolor: 'success.light', borderRadius: 1 }}>
                    <Typography variant="caption" color="success.dark" sx={{ display: 'block', fontWeight: 600 }}>
                      ✅ Location Recorded
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.75rem', mt: 0.5 }}>
                      Your location has been recorded successfully.
                    </Typography>
                  </Box>
                )}
              </Box>
            )}
            {locationStatus === 'error' && locationError && (
              <Box sx={{ mt: 1, p: 1.5, bgcolor: 'error.light', borderRadius: 1 }}>
                <Typography variant="caption" color="error.dark" sx={{ display: 'block', mb: 1, fontWeight: 'bold' }}>
                  {locationError.split('. ')[0]}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.75rem' }}>
                  {locationError.split('. ').slice(1).join('. ')}
                </Typography>
                <Box sx={{ mt: 1.5 }}>
                  <Typography variant="caption" fontWeight="bold" display="block" sx={{ mb: 0.5 }}>
                    Troubleshooting Tips:
                  </Typography>
                  <Typography variant="caption" component="div" sx={{ fontSize: '0.75rem', lineHeight: 1.6 }}>
                    • Allow location access when browser prompts<br/>
                    • Move to area with better GPS signal (near window/outdoors)<br/>
                    • Check device location settings are enabled<br/>
                    • Try refreshing page and allowing location access<br/>
                    • Use Chrome, Firefox, or Edge browser
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>

            <Box sx={{ display: 'flex', gap: { xs: 1, sm: 2 }, alignItems: { xs: 'flex-start', sm: 'center' }, mt: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
              <Box sx={{ display: 'flex', gap: 1, width: { xs: '100%', sm: 'auto' } }}>
                {canCheckIn && (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<CheckCircle />}
                    onClick={handleCheckIn}
                    disabled={loading || locationStatus === 'fetching' || !isLocationValid}
                    fullWidth={isMobile}
                    size={isMobile ? 'medium' : 'large'}
                  >
                    {locationStatus === 'fetching' ? 'Getting Location...' : 
                     !isLocationValid && locationStatus !== 'idle' ? 'Location Not Valid' : 
                     'Check In'}
                  </Button>
                )}
                {isCheckedIn && (
                  <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<Cancel />}
                    onClick={handleCheckOut}
                    disabled={loading || locationStatus === 'fetching' || !isLocationValid}
                    fullWidth={isMobile}
                    size={isMobile ? 'medium' : 'large'}
                  >
                    {locationStatus === 'fetching' ? 'Getting Location...' : 
                     !isLocationValid && locationStatus !== 'idle' && currentLocation ? 'Accuracy Too Low' : 
                     'Check Out'}
                  </Button>
                )}
              </Box>
            {todayAttendance && (
              <Box sx={{ ml: { xs: 0, sm: 'auto' }, mt: { xs: 2, sm: 0 }, width: { xs: '100%', sm: 'auto' } }}>
                <Typography variant="body2">
                  Check In: {format(new Date(todayAttendance.checkIn), 'HH:mm:ss')}
                </Typography>
                {todayAttendance.punchInAddress && (
                  <Typography variant="body2" color="text.secondary" display="block" sx={{ mt: 1 }}>
                    Check In Location: {todayAttendance.punchInAddress}
                  </Typography>
                )}
                {todayAttendance.punchOutAddress && (
                  <Typography variant="body2" color="text.secondary" display="block" sx={{ mt: 1 }}>
                    Check Out Location: {todayAttendance.punchOutAddress}
                  </Typography>
                )}
                {!todayAttendance.punchInAddress && !todayAttendance.punchOutAddress && todayAttendance.punchInLat && (
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                    Coordinates: {todayAttendance.punchInLat.toFixed(6)}, {todayAttendance.punchInLng.toFixed(6)}
                  </Typography>
                )}
                {todayAttendance.checkOut && (
                  <>
                    <Typography variant="body2">
                      Check Out: {format(new Date(todayAttendance.checkOut), 'HH:mm:ss')}
                    </Typography>
                    <Typography variant="body2">
                      Work Hours: {todayAttendance.workHours} hrs
                    </Typography>
                  </>
                )}
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ mt: { xs: 2, sm: 3 }, mx: { xs: 0, sm: 'auto' }, maxWidth: '100%' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            Attendance History
          </Typography>
          <TableContainer 
            component={Paper} 
            sx={{ 
              maxHeight: { xs: 'calc(100vh - 400px)', sm: 'none' }, 
              overflowX: 'auto',
              width: '100%',
              maxWidth: '100%',
              '& .MuiTable-root': {
                minWidth: { xs: 500, sm: 'auto' }
              }
            }}
          >
            <Table size={isMobile ? 'small' : 'medium'} stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Check In</TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Check Out</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Location</TableCell>
                  <TableCell>Work Hours</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {attendance.map((record) => (
                  <TableRow key={record._id}>
                    <TableCell>{format(new Date(record.date), 'dd-MM-yyyy')}</TableCell>
                    <TableCell>{format(new Date(record.checkIn), 'HH:mm:ss')}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                      {record.checkOut ? format(new Date(record.checkOut), 'HH:mm:ss') : '-'}
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                      <Box>
                        {record.punchInAddress && (
                          <Box sx={{ mb: record.punchOutAddress ? 1 : 0 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 600, display: 'block' }}>
                              Check In:
                            </Typography>
                            <Typography variant="caption" color="text.primary" sx={{ fontSize: '0.75rem', display: 'block' }}>
                              {record.punchInAddress}
                            </Typography>
                          </Box>
                        )}
                        {record.punchOutAddress && (
                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 600, display: 'block' }}>
                              Check Out:
                            </Typography>
                            <Typography variant="caption" color="text.primary" sx={{ fontSize: '0.75rem', display: 'block' }}>
                              {record.punchOutAddress}
                            </Typography>
                          </Box>
                        )}
                        {!record.punchInAddress && !record.punchOutAddress && record.punchInLat && (
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                            {record.punchInLat.toFixed(6)}, {record.punchInLng.toFixed(6)}
                          </Typography>
                        )}
                        {!record.punchInAddress && !record.punchOutAddress && !record.punchInLat && (
                          <Typography variant="body2" color="text.secondary">-</Typography>
                        )}
                      </Box>
                    </TableCell>
                    {/* Mobile: Show compact info */}
                    <TableCell sx={{ display: { xs: 'table-cell', sm: 'none' } }}>
                      {record.checkOut && (
                        <Typography variant="caption" display="block">
                          Out: {format(new Date(record.checkOut), 'HH:mm')}
                        </Typography>
                      )}
                      {record.punchInAddress && (
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.7rem', mt: 0.5 }}>
                          📍 In: {record.punchInAddress.length > 40 ? record.punchInAddress.substring(0, 40) + '...' : record.punchInAddress}
                        </Typography>
                      )}
                      {record.punchOutAddress && (
                        <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.7rem', mt: 0.5 }}>
                          📍 Out: {record.punchOutAddress.length > 40 ? record.punchOutAddress.substring(0, 40) + '...' : record.punchOutAddress}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{record.workHours || '-'} hrs</TableCell>
                    <TableCell>
                      <Chip
                        label={record.status}
                        color={record.status === 'present' ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Attendance;

