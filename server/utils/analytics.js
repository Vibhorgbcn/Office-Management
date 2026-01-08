const Attendance = require('../models/Attendance');
const Case = require('../models/Case');
const Bill = require('../models/Bill');
const WorkAssignment = require('../models/WorkAssignment');
const Timesheet = require('../models/Timesheet');
const LeaveRequest = require('../models/LeaveRequest');
const Employee = require('../models/Employee');
const User = require('../models/User');
const { DailyAnalytics, MonthlyAnalytics, DepartmentAnalytics } = require('../models/Analytics');

/**
 * Calculate daily analytics and store in aggregation table
 */
async function calculateDailyAnalytics(date = new Date()) {
  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(date);
  endDate.setHours(23, 59, 59, 999);

  // Attendance metrics
  const attendanceRecords = await Attendance.find({
    date: { $gte: startDate, $lte: endDate }
  }).populate('userId');

  const totalEmployees = await User.countDocuments({ role: { $ne: 'super-admin' }, isActive: true });
  const present = attendanceRecords.filter(a => a.status === 'present').length;
  const absent = totalEmployees - present;
  const late = attendanceRecords.filter(a => a.status === 'late').length;
  const halfDay = attendanceRecords.filter(a => a.status === 'half-day').length;

  // Case metrics
  const totalActive = await Case.countDocuments({ status: { $in: ['pending', 'assigned', 'in-progress'] } });
  const newCases = await Case.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } });
  const closedCases = await Case.countDocuments({
    status: 'closed',
    updatedAt: { $gte: startDate, $lte: endDate }
  });

  const casesByType = await Case.aggregate([
    { $match: { status: { $in: ['pending', 'assigned', 'in-progress'] } } },
    { $group: { _id: '$caseType', count: { $sum: 1 } } }
  ]);

  const casesByCourt = await Case.aggregate([
    { $match: { status: { $in: ['pending', 'assigned', 'in-progress'] } } },
    { $group: { _id: '$court', count: { $sum: 1 } } }
  ]);

  // Financial metrics
  const bills = await Bill.find({
    generatedAt: { $gte: startDate, $lte: endDate }
  });

  const totalBilled = bills.reduce((sum, bill) => sum + (bill.totalAmount || 0), 0);
  const totalCollected = bills
    .filter(b => b.status === 'paid')
    .reduce((sum, bill) => sum + (bill.totalAmount || 0), 0);
  const outstanding = bills
    .filter(b => b.status !== 'paid')
    .reduce((sum, bill) => sum + (bill.totalAmount || 0), 0);

  // Productivity metrics
  const tasksCompleted = await WorkAssignment.countDocuments({
    status: 'completed',
    updatedAt: { $gte: startDate, $lte: endDate }
  });
  const tasksPending = await WorkAssignment.countDocuments({ status: { $in: ['pending', 'in-progress'] } });

  const timesheets = await Timesheet.find({
    date: { $gte: startDate, $lte: endDate },
    status: 'approved'
  });

  const totalBillableHours = timesheets
    .filter(t => t.billable)
    .reduce((sum, t) => sum + (t.durationHours || 0), 0);
  const totalNonBillableHours = timesheets
    .filter(t => !t.billable)
    .reduce((sum, t) => sum + (t.durationHours || 0), 0);

  // Calculate productivity score (0-100)
  const productivityScore = totalEmployees > 0
    ? Math.min(100, (tasksCompleted / Math.max(1, tasksPending + tasksCompleted)) * 100)
    : 0;

  const analytics = {
    date: startDate,
    attendance: {
      totalEmployees,
      present,
      absent,
      late,
      halfDay,
      attendanceRate: totalEmployees > 0 ? (present / totalEmployees) * 100 : 0
    },
    cases: {
      totalActive,
      newCases,
      closedCases,
      pendingCases: tasksPending,
      casesByType: casesByType.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {}),
      casesByCourt: casesByCourt.reduce((acc, item) => ({ ...acc, [item._id]: item.count }), {})
    },
    financial: {
      totalBilled,
      totalCollected,
      outstanding,
      realizationRatio: totalBilled > 0 ? (totalCollected / totalBilled) * 100 : 0,
      revenueByCaseType: {},
      revenueByClient: {}
    },
    productivity: {
      totalTasksCompleted: tasksCompleted,
      totalTasksPending: tasksPending,
      avgTaskCompletionTime: 0, // TODO: Calculate from task history
      totalBillableHours,
      totalNonBillableHours,
      productivityScore
    },
    timesheets: {
      totalHoursLogged: totalBillableHours + totalNonBillableHours,
      billableHours: totalBillableHours,
      approvedHours: totalBillableHours + totalNonBillableHours,
      pendingApprovalHours: 0 // TODO: Calculate pending timesheets
    }
  };

  // Upsert daily analytics
  await DailyAnalytics.findOneAndUpdate(
    { date: startDate },
    analytics,
    { upsert: true, new: true }
  );

  return analytics;
}

/**
 * Calculate monthly analytics
 */
async function calculateMonthlyAnalytics(year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  // Growth metrics
  const newClients = await User.countDocuments({
    role: 'client',
    createdAt: { $gte: startDate, $lte: endDate }
  });

  // Get all cases for the month
  const cases = await Case.find({
    createdAt: { $gte: startDate, $lte: endDate }
  });

  const newCases = cases.length;

  // Financial summary
  const bills = await Bill.find({
    generatedAt: { $gte: startDate, $lte: endDate }
  });

  const totalBilled = bills.reduce((sum, bill) => sum + (bill.totalAmount || 0), 0);
  const totalCollected = bills
    .filter(b => b.status === 'paid')
    .reduce((sum, bill) => sum + (bill.totalAmount || 0), 0);
  const outstanding = bills
    .filter(b => b.status !== 'paid')
    .reduce((sum, bill) => sum + (bill.totalAmount || 0), 0);

  const avgRevenuePerCase = newCases > 0 ? totalBilled / newCases : 0;

  // Workforce metrics
  const employees = await Employee.find().populate('user');
  const totalEmployees = employees.length;

  const attendanceRecords = await Attendance.find({
    date: { $gte: startDate, $lte: endDate }
  });

  const totalWorkDays = new Date(year, month, 0).getDate();
  const expectedAttendance = totalEmployees * totalWorkDays;
  const actualAttendance = attendanceRecords.filter(a => a.status === 'present').length;
  const avgAttendanceRate = expectedAttendance > 0 ? (actualAttendance / expectedAttendance) * 100 : 0;

  const timesheets = await Timesheet.find({
    date: { $gte: startDate, $lte: endDate },
    status: 'approved'
  });

  const totalHours = timesheets.reduce((sum, t) => sum + (t.durationHours || 0), 0);
  const avgWorkingHours = totalEmployees > 0 ? totalHours / (totalEmployees * totalWorkDays) : 0;
  const billableHours = timesheets.filter(t => t.billable).reduce((sum, t) => sum + (t.durationHours || 0), 0);
  const avgBillableHours = totalEmployees > 0 ? billableHours / (totalEmployees * totalWorkDays) : 0;

  // Case performance
  const activeCases = await Case.countDocuments({ status: { $in: ['pending', 'assigned', 'in-progress'] } });
  const closedCases = await Case.countDocuments({
    status: 'closed',
    updatedAt: { $gte: startDate, $lte: endDate }
  });

  // Calculate lawyer-wise performance
  const lawyerPerformance = await User.aggregate([
    {
      $match: {
        role: { $in: ['senior-advocate', 'junior-advocate'] },
        isActive: true
      }
    },
    {
      $lookup: {
        from: 'timesheets',
        localField: '_id',
        foreignField: 'user',
        as: 'timesheets'
      }
    },
    {
      $lookup: {
        from: 'cases',
        localField: '_id',
        foreignField: 'assignedTo',
        as: 'cases'
      }
    },
    {
      $project: {
        lawyerId: '$_id',
        totalBillableHours: {
          $sum: {
            $map: {
              input: {
                $filter: {
                  input: '$timesheets',
                  as: 't',
                  cond: { $and: [{ $eq: ['$$t.billable', true] }, { $eq: ['$$t.status', 'approved'] }] }
                }
              },
              as: 'bt',
              in: '$$bt.durationHours'
            }
          }
        },
        totalCases: { $size: '$cases' },
        revenueGenerated: 0, // TODO: Calculate from bills
        productivityScore: 0 // TODO: Calculate from tasks
      }
    }
  ]);

  const analytics = {
    year,
    month,
    growth: {
      newClients,
      repeatClients: 0, // TODO: Calculate repeat clients
      newCases,
      revenueGrowth: 0, // TODO: Compare with previous month
      employeeGrowth: 0
    },
    financial: {
      totalBilled,
      totalCollected,
      outstanding,
      avgRevenuePerCase,
      billingRealizationRatio: totalBilled > 0 ? (totalCollected / totalBilled) * 100 : 0
    },
    workforce: {
      totalEmployees,
      avgAttendanceRate,
      avgWorkingHours,
      avgBillableHours,
      overtimeHours: 0, // TODO: Calculate from attendance
      leaveUtilization: 0 // TODO: Calculate from leave requests
    },
    casePerformance: {
      activeCases,
      closedCases,
      avgCaseDuration: 0,
      casesByStatus: {},
      upcomingHearings: 0 // TODO: Calculate from case hearings
    },
    departments: {},
    lawyerPerformance
  };

  // Upsert monthly analytics
  await MonthlyAnalytics.findOneAndUpdate(
    { year, month },
    analytics,
    { upsert: true, new: true }
  );

  return analytics;
}

/**
 * Get analytics for a specific department
 */
async function getDepartmentAnalytics(department, startDate, endDate) {
  const employees = await Employee.find({ department }).populate('user');
  const employeeIds = employees.map(e => e.user._id);

  // Attendance
  const attendance = await Attendance.find({
    userId: { $in: employeeIds },
    date: { $gte: startDate, $lte: endDate }
  });

  const presentCount = attendance.filter(a => a.status === 'present').length;
  const attendanceRate = employees.length > 0 ? (presentCount / (employees.length * 30)) * 100 : 0;

  // Tasks
  const tasks = await WorkAssignment.find({
    assignedTo: { $in: employeeIds }
  });

  const tasksCompleted = tasks.filter(t => t.status === 'completed').length;
  const tasksPending = tasks.filter(t => t.status !== 'completed').length;

  // Timesheets
  const timesheets = await Timesheet.find({
    user: { $in: employeeIds },
    date: { $gte: startDate, $lte: endDate },
    status: 'approved'
  });

  const billableHours = timesheets
    .filter(t => t.billable)
    .reduce((sum, t) => sum + (t.durationHours || 0), 0);

  return {
    department,
    date: new Date(),
    metrics: {
      totalEmployees: employees.length,
      attendanceRate,
      tasksCompleted,
      tasksPending,
      avgProductivityScore: tasks.length > 0 ? (tasksCompleted / tasks.length) * 100 : 0,
      totalBillableHours: billableHours,
      revenueGenerated: 0 // TODO: Calculate from bills
    }
  };
}

module.exports = {
  calculateDailyAnalytics,
  calculateMonthlyAnalytics,
  getDepartmentAnalytics
};


