const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/work-assignments', require('./routes/workAssignments'));
app.use('/api/cases', require('./routes/cases'));
app.use('/api/bills', require('./routes/bills'));
app.use('/api/users', require('./routes/users'));
app.use('/api/clients', require('./routes/clients'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/office-locations', require('./routes/officeLocations'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/hr', require('./routes/hr'));
app.use('/api/payroll', require('./routes/payroll'));
app.use('/api/timesheets', require('./routes/timesheets'));
app.use('/api/court-locations', require('./routes/courtLocations'));
app.use('/api/reminders', require('./routes/reminders'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/departments', require('./routes/departments'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/contracts', require('./routes/contracts'));
app.use('/api/causelists', require('./routes/causelists'));
app.use('/api/legal-notices', require('./routes/legalNotices'));
app.use('/api/expenses', require('./routes/expenses'));

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/office-management', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5006;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

