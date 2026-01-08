import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import CreateSuperAdmin from './pages/CreateSuperAdmin';
import AdminDashboard from './pages/AdminDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import Attendance from './pages/Attendance';
import Cases from './pages/Cases';
import WorkAssignments from './pages/WorkAssignments';
import Bills from './pages/Bills';
import theme from './theme';
import './App.css';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/create-super-admin" element={<CreateSuperAdmin />} />
            <Route
              path="/admin/*"
              element={
                <PrivateRoute role={['admin', 'super-admin', 'sub-admin']}>
                  <AdminDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/employee/*"
              element={
                <PrivateRoute role={['employee', 'senior-advocate', 'junior-advocate', 'clerk', 'intern']}>
                  <EmployeeDashboard />
                </PrivateRoute>
              }
            />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

