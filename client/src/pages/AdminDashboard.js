import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../components/Layout';
import DashboardHome from '../components/admin/DashboardHome';
import Attendance from './Attendance';
import Cases from './Cases';
import WorkAssignments from './WorkAssignments';
import Bills from './Bills';
import OfficeLocations from './OfficeLocations';
import Employees from './Employees';

const AdminDashboard = () => {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardHome />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/cases" element={<Cases />} />
        <Route path="/work-assignments" element={<WorkAssignments />} />
        <Route path="/bills" element={<Bills />} />
        <Route path="/office-locations" element={<OfficeLocations />} />
        <Route path="/employees" element={<Employees />} />
      </Routes>
    </Layout>
  );
};

export default AdminDashboard;

