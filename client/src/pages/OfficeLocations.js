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
  useMediaQuery,
  useTheme,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import axios from 'axios';

const OfficeLocations = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  
  const [locations, setLocations] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: '',
    radiusMeters: 1000,
    description: '',
    isActive: true,
  });

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await axios.get('/office-locations');
      setLocations(response.data);
    } catch (error) {
      console.error('Error fetching locations:', error);
      setError('Failed to load office locations');
    }
  };

  const handleOpenDialog = (location = null) => {
    if (location) {
      setEditingLocation(location);
      setFormData({
        name: location.name || '',
        address: location.address || '',
        latitude: location.latitude || '',
        longitude: location.longitude || '',
        radiusMeters: location.radiusMeters || 1000,
        description: location.description || '',
        isActive: location.isActive !== undefined ? location.isActive : true,
      });
    } else {
      setEditingLocation(null);
      setFormData({
        name: '',
        address: '',
        latitude: '',
        longitude: '',
        radiusMeters: 1000,
        description: '',
        isActive: true,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingLocation(null);
    setFormData({
      name: '',
      address: '',
      latitude: '',
      longitude: '',
      radiusMeters: 1000,
      description: '',
      isActive: true,
    });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const payload = {
        ...formData,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        radiusMeters: parseInt(formData.radiusMeters),
      };

      if (editingLocation) {
        await axios.put(`/office-locations/${editingLocation._id}`, payload);
      } else {
        await axios.post('/office-locations', payload);
      }

      handleCloseDialog();
      fetchLocations();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save location');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this location?')) {
      return;
    }
    try {
      await axios.delete(`/office-locations/${id}`);
      fetchLocations();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete location');
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData({
          ...formData,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        });
      },
      (error) => {
        alert('Unable to get your location. Please enter coordinates manually.');
      }
    );
  };

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', px: { xs: 1, sm: 0 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 2, sm: 3 }, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
          Office Locations
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ bgcolor: 'primary.main' }}
        >
          Add Location
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Card sx={{ width: '100%', maxWidth: '100%' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            Configured Locations
          </Typography>
          {locations.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <LocationOnIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body1" color="text.secondary" gutterBottom>
                No office locations configured
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Add your first office location to enable GPS-based attendance
              </Typography>
              <Button variant="contained" onClick={() => handleOpenDialog()}>
                Add First Location
              </Button>
            </Box>
          ) : (
            <TableContainer sx={{ 
              maxHeight: { xs: 'calc(100vh - 300px)', sm: 'none' },
              overflowX: 'auto',
              '& .MuiTable-root': {
                minWidth: { xs: 600, sm: 'auto' }
              }
            }}>
              <Table size={isMobile ? 'small' : 'medium'} stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>Address</TableCell>
                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Coordinates</TableCell>
                    <TableCell>Radius</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {locations.map((location) => (
                    <TableRow key={location._id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {location.name}
                        </Typography>
                        {/* Mobile: Show compact info */}
                        <Box sx={{ display: { xs: 'block', md: 'none' }, mt: 0.5 }}>
                          {location.address && (
                            <Typography variant="caption" color="text.secondary" display="block">
                              {location.address.length > 40 ? `${location.address.substring(0, 40)}...` : location.address}
                            </Typography>
                          )}
                          <Typography variant="caption" fontFamily="monospace" color="text.secondary" display="block">
                            {location.latitude?.toFixed(4)}, {location.longitude?.toFixed(4)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                        <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {location.address || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                        <Typography variant="body2" fontFamily="monospace" sx={{ fontSize: '0.75rem' }}>
                          {location.latitude?.toFixed(6)}, {location.longitude?.toFixed(6)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`${location.radiusMeters}m`}
                          size="small"
                          sx={{ bgcolor: 'grey.100' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={location.isActive ? 'Active' : 'Inactive'}
                          color={location.isActive ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(location)}
                            sx={{ mr: 1 }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Deactivate">
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(location._id)}
                            color="error"
                          >
                            <DeleteIcon fontSize="small" />
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
          {editingLocation ? 'Edit Office Location' : 'Add Office Location'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Office Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
              placeholder="e.g., Main Chamber, Supreme Court"
            />
            <TextField
              label="Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Latitude"
                type="number"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                fullWidth
                required
                inputProps={{ step: 'any' }}
                helperText="Get from Google Maps"
              />
              <TextField
                label="Longitude"
                type="number"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                fullWidth
                required
                inputProps={{ step: 'any' }}
                helperText="Get from Google Maps"
              />
            </Box>
            <Button
              variant="outlined"
              startIcon={<LocationOnIcon />}
              onClick={getCurrentLocation}
              size="small"
            >
              Use My Current Location
            </Button>
            <TextField
              label="Allowed Radius (meters)"
              type="number"
              value={formData.radiusMeters}
              onChange={(e) => setFormData({ ...formData, radiusMeters: e.target.value })}
              fullWidth
              required
              inputProps={{ min: 50, max: 1000 }}
              helperText="50-1000m (Default: 1000m = 1km). 50-100m for small offices, 500-1000m for large areas"
            />
            <TextField
              label="Description (Optional)"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />
            <Alert severity="info" sx={{ mt: 1 }}>
              <Typography variant="body2">
                <strong>How to get coordinates:</strong>
                <br />
                1. Open Google Maps
                <br />
                2. Right-click on the location
                <br />
                3. Click the coordinates that appear
                <br />
                <br />
                <strong>Recommended radius:</strong>
                <br />
                • Small office: 50-100m
                <br />
                • Large building: 100-300m
                <br />
                • Court complex: 300-500m
                <br />
                • Large area/Campus: 500-1000m (1km)
                <br />
                <br />
                <strong>Default: 1000m (1 km)</strong>
              </Typography>
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={loading}>
            {loading ? 'Saving...' : editingLocation ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OfficeLocations;

