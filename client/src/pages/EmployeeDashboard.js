import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../components/Layout';
import DashboardHome from '../components/employee/DashboardHome';
import Attendance from './Attendance';
import Cases from './Cases';
import WorkAssignments from './WorkAssignments';

const EmployeeDashboard = () => {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardHome />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/cases" element={<Cases />} />
        <Route path="/work-assignments" element={<WorkAssignments />} />
      </Routes>
    </Layout>
  );
};

export default EmployeeDashboard;

