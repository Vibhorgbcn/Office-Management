const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { DailyAnalytics, MonthlyAnalytics } = require('../models/Analytics');
const { calculateDailyAnalytics, calculateMonthlyAnalytics, getDepartmentAnalytics } = require('../utils/analytics');
const Attendance = require('../models/Attendance');
const Case = require('../models/Case');
const Bill = require('../models/Bill');
const WorkAssignment = require('../models/WorkAssignment');
const Timesheet = require('../models/Timesheet');
const User = require('../models/User');
const Department = require('../models/Department');

// Middleware to check super-admin or sub-admin
const checkAdminAccess = (req, res, next) => {
  if (!['super-admin', 'sub-admin', 'admin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  next();
};

// @route   GET /api/analytics/dashboard
// @desc    Get dashboard data based on user role
// @access  Private (Super-Admin/Sub-Admin)
router.get('/dashboard', auth, checkAdminAccess, async (req, res) => {
  try {
    const user = req.user;
    const { startDate, endDate } = req.query;

    // Default to current month
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date();

    if (user.role === 'super-admin') {
      // Super Admin - Full firm view
      const dashboard = await getSuperAdminDashboard(start, end);
      return res.json(dashboard);
    } else if (user.role === 'sub-admin') {
      // Sub Admin - Department view
      const department = await Department.findOne({ subAdmin: user._id });
      if (!department) {
        return res.status(404).json({ message: 'No department assigned' });
      }
      const dashboard = await getSubAdminDashboard(department, start, end);
      return res.json(dashboard);
    } else {
      // Regular admin
      const dashboard = await getSuperAdminDashboard(start, end);
      return res.json(dashboard);
    }
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/analytics/kpis
// @desc    Get key performance indicators
// @access  Private (Super-Admin/Sub-Admin)
router.get('/kpis', auth, checkAdminAccess, async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    
    // Calculate or fetch daily analytics
    let analytics = await DailyAnalytics.findOne({ date: targetDate });
    if (!analytics) {
      analytics = await calculateDailyAnalytics(targetDate);
    }

    const kpis = {
      attendanceRate: analytics.attendance.attendanceRate,
      totalActiveCases: analytics.cases.totalActive,
      totalBilled: analytics.financial.totalBilled,
      totalCollected: analytics.financial.totalCollected,
      outstanding: analytics.financial.outstanding,
      realizationRatio: analytics.financial.realizationRatio,
      productivityScore: analytics.productivity.productivityScore,
      totalBillableHours: analytics.productivity.totalBillableHours
    };

    res.json(kpis);
  } catch (error) {
    console.error('Error fetching KPIs:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/analytics/growth
// @desc    Get growth metrics
// @access  Private (Super-Admin)
router.get('/growth', auth, async (req, res) => {
  try {
    if (req.user.role !== 'super-admin' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { year, month } = req.query;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();
    const targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;

    let analytics = await MonthlyAnalytics.findOne({ year: targetYear, month: targetMonth });
    if (!analytics) {
      analytics = await calculateMonthlyAnalytics(targetYear, targetMonth);
    }

    res.json(analytics.growth);
  } catch (error) {
    console.error('Error fetching growth metrics:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/analytics/department/:departmentId
// @desc    Get department-specific analytics
// @access  Private (Sub-Admin)
router.get('/department/:departmentId', auth, async (req, res) => {
  try {
    const { departmentId } = req.params;
    const { startDate, endDate } = req.query;

    const department = await Department.findById(departmentId);
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    // Check if user has access
    if (req.user.role !== 'super-admin' && req.user.role !== 'admin') {
      if (req.user.role === 'sub-admin' && department.subAdmin?.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(1));
    const end = endDate ? new Date(endDate) : new Date();

    const analytics = await getDepartmentAnalytics(department.name, start, end);
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching department analytics:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function for Super Admin Dashboard
async function getSuperAdminDashboard(startDate, endDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calculate or fetch today's analytics
  let todayAnalytics = await DailyAnalytics.findOne({ date: today });
  if (!todayAnalytics) {
    todayAnalytics = await calculateDailyAnalytics(today);
  }

  // Get active cases count
  const activeCases = await Case.countDocuments({ status: { $in: ['pending', 'assigned', 'in-progress'] } });
  
  // Get upcoming hearings (next 7 days)
  const upcomingHearingsDate = new Date();
  upcomingHearingsDate.setDate(upcomingHearingsDate.getDate() + 7);
  // TODO: Get from CaseHearing model when integrated
  
  // Get financial summary
  const bills = await Bill.find({ generatedAt: { $gte: startDate, $lte: endDate } });
  const totalBilled = bills.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const totalCollected = bills.filter(b => b.status === 'paid').reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const outstanding = bills.filter(b => b.status !== 'paid').reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  // Get workforce metrics
  const totalEmployees = await User.countDocuments({ role: { $ne: 'super-admin' }, isActive: true });
  const attendance = await Attendance.find({ date: today });
  const presentToday = attendance.filter(a => a.status === 'present').length;

  // Get productivity metrics
  const tasksCompleted = await WorkAssignment.countDocuments({
    status: 'completed',
    updatedAt: { $gte: startDate, $lte: endDate }
  });
  const tasksPending = await WorkAssignment.countDocuments({ status: { $in: ['pending', 'in-progress'] } });

  // Get alerts
  const alerts = await getAlerts();

  return {
    kpis: {
      totalEmployees,
      attendanceRate: todayAnalytics.attendance.attendanceRate,
      activeCases,
      totalBilled,
      totalCollected,
      outstanding,
      realizationRatio: totalBilled > 0 ? (totalCollected / totalBilled) * 100 : 0,
      productivityScore: todayAnalytics.productivity.productivityScore,
      tasksCompleted,
      tasksPending
    },
    charts: {
      revenueTrend: await getRevenueTrend(startDate, endDate),
      attendanceTrend: await getAttendanceTrend(startDate, endDate),
      caseDistribution: await getCaseDistribution(),
      departmentComparison: await getDepartmentComparison(startDate, endDate)
    },
    alerts
  };
}

// Helper function for Sub Admin Dashboard
async function getSubAdminDashboard(department, startDate, endDate) {
  const analytics = await getDepartmentAnalytics(department.name, startDate, endDate);
  
  // Get department-specific data
  const employees = await User.find({ department: department.name, isActive: true });
  const employeeIds = employees.map(e => e._id);

  const tasks = await WorkAssignment.find({ assignedTo: { $in: employeeIds } });
  const timesheets = await Timesheet.find({
    user: { $in: employeeIds },
    date: { $gte: startDate, $lte: endDate }
  });

  return {
    department: department.name,
    metrics: analytics.metrics,
    employees: {
      total: employees.length,
      active: employees.filter(e => e.isActive).length
    },
    tasks: {
      completed: tasks.filter(t => t.status === 'completed').length,
      pending: tasks.filter(t => t.status !== 'completed').length,
      overdue: tasks.filter(t => {
        if (t.dueDate && t.status !== 'completed') {
          return new Date(t.dueDate) < new Date();
        }
        return false;
      }).length
    },
    timesheets: {
      totalHours: timesheets.reduce((sum, t) => sum + (t.durationHours || 0), 0),
      billableHours: timesheets.filter(t => t.billable).reduce((sum, t) => sum + (t.durationHours || 0), 0),
      pendingApproval: await Timesheet.countDocuments({
        user: { $in: employeeIds },
        status: 'submitted'
      })
    }
  };
}

// Helper functions for chart data
async function getRevenueTrend(startDate, endDate) {
  const bills = await Bill.find({
    generatedAt: { $gte: startDate, $lte: endDate }
  }).sort({ generatedAt: 1 });

  // Group by date
  const dailyRevenue = {};
  bills.forEach(bill => {
    const date = bill.generatedAt.toISOString().split('T')[0];
    dailyRevenue[date] = (dailyRevenue[date] || 0) + bill.totalAmount;
  });

  return Object.entries(dailyRevenue).map(([date, amount]) => ({ date, amount }));
}

async function getAttendanceTrend(startDate, endDate) {
  const attendance = await Attendance.find({
    date: { $gte: startDate, $lte: endDate }
  });

  const dailyAttendance = {};
  attendance.forEach(record => {
    const date = record.date.toISOString().split('T')[0];
    if (!dailyAttendance[date]) {
      dailyAttendance[date] = { present: 0, absent: 0 };
    }
    if (record.status === 'present') {
      dailyAttendance[date].present++;
    } else {
      dailyAttendance[date].absent++;
    }
  });

  return Object.entries(dailyAttendance).map(([date, data]) => ({
    date,
    ...data
  }));
}

async function getCaseDistribution() {
  const cases = await Case.aggregate([
    { $match: { status: { $in: ['pending', 'assigned', 'in-progress'] } } },
    { $group: { _id: '$caseType', count: { $sum: 1 } } }
  ]);

  return cases.map(item => ({ type: item._id, count: item.count }));
}

async function getDepartmentComparison(startDate, endDate) {
  const departments = ['Legal', 'HR', 'Accounts', 'Admin', 'Support'];
  const comparison = [];

  for (const dept of departments) {
    const analytics = await getDepartmentAnalytics(dept, startDate, endDate);
    comparison.push({
      department: dept,
      productivityScore: analytics.metrics.avgProductivityScore,
      billableHours: analytics.metrics.totalBillableHours
    });
  }

  return comparison;
}

async function getAlerts() {
  const alerts = [];

  // High pending billing
  const unpaidBills = await Bill.countDocuments({ status: { $in: ['sent', 'overdue'] } });
  if (unpaidBills > 10) {
    alerts.push({
      type: 'warning',
      title: 'High Pending Bills',
      message: `${unpaidBills} bills are pending payment`,
      link: '/admin/bills'
    });
  }

  // Overloaded staff
  const pendingTasks = await WorkAssignment.countDocuments({ status: { $in: ['pending', 'in-progress'] } });
  if (pendingTasks > 50) {
    alerts.push({
      type: 'warning',
      title: 'High Task Backlog',
      message: `${pendingTasks} tasks are pending`,
      link: '/admin/work-assignments'
    });
  }

  // Cases with no activity (30+ days)
  const staleDate = new Date();
  staleDate.setDate(staleDate.getDate() - 30);
  const staleCases = await Case.countDocuments({
    status: { $in: ['pending', 'assigned', 'in-progress'] },
    updatedAt: { $lt: staleDate }
  });
  if (staleCases > 0) {
    alerts.push({
      type: 'error',
      title: 'Inactive Cases',
      message: `${staleCases} cases have no activity in 30+ days`,
      link: '/admin/cases'
    });
  }

  // Low attendance
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayAttendance = await Attendance.find({ date: today });
  const totalEmployees = await User.countDocuments({ role: { $ne: 'super-admin' }, isActive: true });
  const attendanceRate = totalEmployees > 0 ? (todayAttendance.filter(a => a.status === 'present').length / totalEmployees) * 100 : 0;
  
  if (attendanceRate < 70) {
    alerts.push({
      type: 'warning',
      title: 'Low Attendance',
      message: `Today's attendance rate is ${attendanceRate.toFixed(1)}%`,
      link: '/admin/attendance'
    });
  }

  return alerts;
}

module.exports = router;


