import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../components/Layout';
import DashboardHome from '../components/admin/DashboardHome';
import Attendance from './Attendance';
import Cases from './Cases';
import WorkAssignments from './WorkAssignments';
import Tasks from './Tasks';
import Bills from './Bills';
import OfficeLocations from './OfficeLocations';
import Employees from './Employees';
import HRManagement from './HRManagement';
import Payroll from './Payroll';
import Timesheets from './Timesheets';
import CourtLocations from './CourtLocations';
import Reminders from './Reminders';
import CaseWorkspace from './CaseWorkspace';
import Causelists from './Causelists';
import Contracts from './Contracts';
import LegalNotices from './LegalNotices';
import Clients from './Clients';
import Calendar from './Calendar';
import Expenses from './Expenses';

const AdminDashboard = () => {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<DashboardHome />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/cases" element={<Cases />} />
        <Route path="/work-assignments" element={<WorkAssignments />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/bills" element={<Bills />} />
        <Route path="/office-locations" element={<OfficeLocations />} />
        <Route path="/employees" element={<Employees />} />
        <Route path="/hr" element={<HRManagement />} />
        <Route path="/payroll" element={<Payroll />} />
        <Route path="/timesheets" element={<Timesheets />} />
        <Route path="/court-locations" element={<CourtLocations />} />
        <Route path="/reminders" element={<Reminders />} />
        <Route path="/case-workspace/:id" element={<CaseWorkspace />} />
        <Route path="/causelists" element={<Causelists />} />
        <Route path="/contracts" element={<Contracts />} />
        <Route path="/legal-notices" element={<LegalNotices />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/expenses" element={<Expenses />} />
      </Routes>
    </Layout>
  );
};

export default AdminDashboard;

