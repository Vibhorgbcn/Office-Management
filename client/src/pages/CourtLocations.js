import React, { useState, useEffect } from 'react';
import {
  Box, Button, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Grid, MenuItem, Alert,
  useMediaQuery, useTheme, IconButton
} from '@mui/material';
import {
  Add, Edit, Delete, Gavel, LocationOn
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const CourtLocations = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [form, setForm] = useState({
    courtName: '',
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
    },
    latitude: '',
    longitude: '',
    courtType: 'District Court',
    description: ''
  });

  useEffect(() => {
    fetchLocations();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await axios.get('/court-locations');
      setLocations(response.data);
    } catch (error) {
      console.error('Error fetching court locations:', error);
      setError('Failed to load court locations');
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');
      
      const payload = {
        ...form,
        latitude: parseFloat(form.latitude),
        longitude: parseFloat(form.longitude),
        city: form.address.city,
        state: form.address.state
      };

      if (editingLocation) {
        await axios.put(`/court-locations/${editingLocation._id}`, payload);
        setSuccess('Court location updated successfully');
      } else {
        await axios.post('/court-locations', payload);
        setSuccess('Court location created successfully');
      }
      
      setDialogOpen(false);
      setEditingLocation(null);
      setForm({
        courtName: '',
        address: { street: '', city: '', state: '', pincode: '', country: 'India' },
        latitude: '',
        longitude: '',
        courtType: 'District Court',
        description: ''
      });
      fetchLocations();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save court location');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (location) => {
    setEditingLocation(location);
    setForm({
      courtName: location.courtName,
      address: location.address || { street: '', city: '', state: '', pincode: '', country: 'India' },
      latitude: location.latitude.toString(),
      longitude: location.longitude.toString(),
      courtType: location.courtType,
      description: location.description || '',
      city: location.city,
      state: location.state
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this court location?')) return;
    
    try {
      await axios.delete(`/court-locations/${id}`);
      setSuccess('Court location deactivated successfully');
      fetchLocations();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to deactivate location');
    }
  };

  if (user?.role !== 'admin') {
    return (
      <Box sx={{ width: '100%', px: { xs: 1, sm: 0 } }}>
        <Typography variant="h4" gutterBottom>Court Locations</Typography>
        <Card>
          <CardContent>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Court Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>City</TableCell>
                    <TableCell>State</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {locations.map((loc) => (
                    <TableRow key={loc._id}>
                      <TableCell>{loc.courtName}</TableCell>
                      <TableCell>{loc.courtType}</TableCell>
                      <TableCell>{loc.city}</TableCell>
                      <TableCell>{loc.state}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', px: { xs: 1, sm: 0 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
          Court Locations
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => {
            setEditingLocation(null);
            setForm({
              courtName: '',
              address: { street: '', city: '', state: '', pincode: '', country: 'India' },
              latitude: '',
              longitude: '',
              courtType: 'District Court',
              description: ''
            });
            setDialogOpen(true);
          }}
        >
          Add Court Location
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

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>Court Locations</Typography>
          <TableContainer component={Paper} sx={{ maxHeight: { xs: 'calc(100vh - 300px)', sm: 'none' }, overflowX: 'auto' }}>
            <Table size={isMobile ? 'small' : 'medium'}>
              <TableHead>
                <TableRow>
                  <TableCell>Court Name</TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>Type</TableCell>
                  <TableCell>City</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>State</TableCell>
                  <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>Coordinates</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {locations.map((loc) => (
                  <TableRow key={loc._id}>
                    <TableCell>{loc.courtName}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                      <Chip label={loc.courtType} size="small" />
                    </TableCell>
                    <TableCell>{loc.city}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{loc.state}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', lg: 'table-cell' } }}>
                      {loc.latitude?.toFixed(6)}, {loc.longitude?.toFixed(6)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={loc.isActive ? 'Active' : 'Inactive'}
                        color={loc.isActive ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton size="small" onClick={() => handleEdit(loc)}>
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDelete(loc._id)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingLocation ? 'Edit Court Location' : 'Add Court Location'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Court Name"
                value={form.courtName}
                onChange={(e) => setForm({ ...form, courtName: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Court Type"
                value={form.courtType}
                onChange={(e) => setForm({ ...form, courtType: e.target.value })}
              >
                <MenuItem value="Supreme Court">Supreme Court</MenuItem>
                <MenuItem value="High Court">High Court</MenuItem>
                <MenuItem value="District Court">District Court</MenuItem>
                <MenuItem value="Special Court">Special Court</MenuItem>
                <MenuItem value="Tribunal">Tribunal</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="City"
                value={form.address.city || form.city || ''}
                onChange={(e) => setForm({
                  ...form,
                  address: { ...form.address, city: e.target.value },
                  city: e.target.value
                })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="State"
                value={form.address.state || form.state || ''}
                onChange={(e) => setForm({
                  ...form,
                  address: { ...form.address, state: e.target.value },
                  state: e.target.value
                })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Street Address"
                value={form.address.street}
                onChange={(e) => setForm({ ...form, address: { ...form.address, street: e.target.value } })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Latitude"
                value={form.latitude}
                onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                required
                inputProps={{ step: 'any' }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="number"
                label="Longitude"
                value={form.longitude}
                onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                required
                inputProps={{ step: 'any' }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={loading || !form.courtName || !form.latitude || !form.longitude}
          >
            {loading ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CourtLocations;


