import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Button, Card, CardContent, Typography, Tabs, Tab, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions, Chip, Grid,
  List, ListItem, ListItemText, ListItemSecondaryAction, IconButton,
  Paper, Divider, Alert, CircularProgress, useMediaQuery, useTheme
} from '@mui/material';
import {
  ArrowBack, Add, Description, Note, Event, Person, AttachFile,
  Edit, Delete, Download, Visibility
} from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';

const CaseWorkspace = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [caseData, setCaseData] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCaseData();
    fetchDocuments();
  }, [id]);

  const fetchCaseData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/cases/${id}`);
      setCaseData(response.data);
    } catch (error) {
      console.error('Error fetching case:', error);
      setError('Failed to load case data');
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      const response = await axios.get(`/documents?caseId=${id}`);
      setDocuments(response.data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const handleAddNote = async () => {
    try {
      await axios.post(`/cases/${id}/notes`, { content: newNote });
      setNewNote('');
      setNoteDialogOpen(false);
      fetchCaseData();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to add note');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'warning',
      assigned: 'info',
      'in-progress': 'primary',
      completed: 'success',
      closed: 'default',
    };
    return colors[status] || 'default';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!caseData) {
    return (
      <Box>
        <Alert severity="error">Case not found</Alert>
        <Button startIcon={<ArrowBack />} onClick={() => navigate('/admin/cases')} sx={{ mt: 2 }}>
          Back to Cases
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: '100%', px: { xs: 1, sm: 0 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <IconButton onClick={() => navigate('/admin/cases')}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' }, flex: 1 }}>
          Case Workspace
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Case Header */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="h5" gutterBottom>
                {caseData.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Case Number: {caseData.caseNumber}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                <Chip label={caseData.status} color={getStatusColor(caseData.status)} size="small" />
                <Chip label={caseData.caseType} size="small" />
                <Chip label={caseData.court} size="small" />
                <Chip label={caseData.clientType} size="small" />
              </Box>
            </Box>
            <Box sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
              <Typography variant="body2" color="text.secondary">
                Client: {caseData.clientName}
              </Typography>
              {caseData.assignedTo && (
                <Typography variant="body2" color="text.secondary">
                  Assigned to: {caseData.assignedTo.name}
                </Typography>
              )}
              {caseData.filingDate && (
                <Typography variant="body2" color="text.secondary">
                  Filed: {format(new Date(caseData.filingDate), 'dd-MM-yyyy')}
                </Typography>
              )}
              {caseData.nextHearingDate && (
                <Typography variant="body2" color="text.secondary">
                  Next Hearing: {format(new Date(caseData.nextHearingDate), 'dd-MM-yyyy')}
                </Typography>
              )}
            </Box>
          </Box>
          {caseData.description && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {caseData.description}
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label="Documents" icon={<Description />} iconPosition="start" />
          <Tab label="Notes" icon={<Note />} iconPosition="start" />
          <Tab label="Details" icon={<Event />} iconPosition="start" />
        </Tabs>
      </Box>

      {/* Documents Tab */}
      {tabValue === 0 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Documents</Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => navigate(`/admin/documents?caseId=${id}`)}
              >
                Upload Document
              </Button>
            </Box>
            <List>
              {documents.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                  No documents uploaded yet
                </Typography>
              ) : (
                documents.map((doc) => (
                  <ListItem key={doc._id} divider>
                    <AttachFile sx={{ mr: 2, color: 'text.secondary' }} />
                    <ListItemText
                      primary={doc.name}
                      secondary={`${doc.documentType} • ${format(new Date(doc.createdAt), 'dd-MM-yyyy')} • ${doc.uploadedBy?.name || 'Unknown'}`}
                    />
                    <ListItemSecondaryAction>
                      <IconButton edge="end" onClick={() => window.open(`/${doc.fileUrl}`, '_blank')}>
                        <Visibility />
                      </IconButton>
                      <IconButton edge="end" onClick={() => window.open(`/${doc.fileUrl}`, '_blank', 'download')}>
                        <Download />
                      </IconButton>
                    </ListItemSecondaryAction>
                  </ListItem>
                ))
              )}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Notes Tab */}
      {tabValue === 1 && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Notes</Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setNoteDialogOpen(true)}
              >
                Add Note
              </Button>
            </Box>
            <List>
              {caseData.notes && caseData.notes.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                  No notes added yet
                </Typography>
              ) : (
                caseData.notes?.map((note, index) => (
                  <React.Fragment key={index}>
                    <ListItem>
                      <ListItemText
                        primary={note.content}
                        secondary={`${note.addedBy?.name || 'Unknown'} • ${format(new Date(note.addedAt), 'dd-MM-yyyy HH:mm')}`}
                      />
                    </ListItem>
                    {index < caseData.notes.length - 1 && <Divider />}
                  </React.Fragment>
                ))
              )}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Details Tab */}
      {tabValue === 2 && (
        <Card>
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Case Number</Typography>
                <Typography variant="body1" gutterBottom>{caseData.caseNumber}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Status</Typography>
                <Chip label={caseData.status} color={getStatusColor(caseData.status)} size="small" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Court</Typography>
                <Typography variant="body1" gutterBottom>{caseData.court}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Case Type</Typography>
                <Typography variant="body1" gutterBottom>{caseData.caseType}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Client Name</Typography>
                <Typography variant="body1" gutterBottom>{caseData.clientName}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" color="text.secondary">Client Type</Typography>
                <Typography variant="body1" gutterBottom>{caseData.clientType}</Typography>
              </Grid>
              {caseData.filingDate && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Filing Date</Typography>
                  <Typography variant="body1" gutterBottom>
                    {format(new Date(caseData.filingDate), 'dd-MM-yyyy')}
                  </Typography>
                </Grid>
              )}
              {caseData.nextHearingDate && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Next Hearing</Typography>
                  <Typography variant="body1" gutterBottom>
                    {format(new Date(caseData.nextHearingDate), 'dd-MM-yyyy')}
                  </Typography>
                </Grid>
              )}
              {caseData.assignedTo && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Assigned To</Typography>
                  <Typography variant="body1" gutterBottom>{caseData.assignedTo.name}</Typography>
                </Grid>
              )}
              {caseData.priority && (
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">Priority</Typography>
                  <Chip label={caseData.priority} size="small" />
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Add Note Dialog */}
      <Dialog open={noteDialogOpen} onClose={() => setNoteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Note</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Note"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNoteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddNote} variant="contained" disabled={!newNote.trim()}>
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CaseWorkspace;

