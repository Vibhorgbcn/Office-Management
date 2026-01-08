import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../components/Layout';
import DashboardHome from '../components/employee/DashboardHome';
import Attendance from './Attendance';
import Cases from './Cases';
import WorkAssignments from './WorkAssignments';
import Tasks from './Tasks';
import Timesheets from './Timesheets';
import Reminders from './Reminders';
import Payroll from './Payroll';

const EmployeeDashboard = () => {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardHome />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/cases" element={<Cases />} />
        <Route path="/work-assignments" element={<WorkAssignments />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/timesheets" element={<Timesheets />} />
        <Route path="/reminders" element={<Reminders />} />
        <Route path="/payroll" element={<Payroll />} />
      </Routes>
    </Layout>
  );
};

export default EmployeeDashboard;

