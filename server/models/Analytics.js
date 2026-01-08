const mongoose = require('mongoose');

// Daily aggregated analytics
const dailyAnalyticsSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true
  },
  // Attendance metrics
  attendance: {
    totalEmployees: Number,
    present: Number,
    absent: Number,
    late: Number,
    halfDay: Number,
    attendanceRate: Number // percentage
  },
  // Case metrics
  cases: {
    totalActive: Number,
    newCases: Number,
    closedCases: Number,
    pendingCases: Number,
    casesByType: mongoose.Schema.Types.Mixed,
    casesByCourt: mongoose.Schema.Types.Mixed
  },
  // Financial metrics
  financial: {
    totalBilled: Number,
    totalCollected: Number,
    outstanding: Number,
    realizationRatio: Number, // collected/billed
    revenueByCaseType: mongoose.Schema.Types.Mixed,
    revenueByClient: mongoose.Schema.Types.Mixed
  },
  // Productivity metrics
  productivity: {
    totalTasksCompleted: Number,
    totalTasksPending: Number,
    avgTaskCompletionTime: Number, // hours
    totalBillableHours: Number,
    totalNonBillableHours: Number,
    productivityScore: Number
  },
  // Timesheet metrics
  timesheets: {
    totalHoursLogged: Number,
    billableHours: Number,
    approvedHours: Number,
    pendingApprovalHours: Number
  }
}, {
  timestamps: true
});

dailyAnalyticsSchema.index({ date: -1 });

// Monthly aggregated analytics
const monthlyAnalyticsSchema = new mongoose.Schema({
  year: { type: Number, required: true },
  month: { type: Number, required: true, min: 1, max: 12 },
  // Growth metrics
  growth: {
    newClients: Number,
    repeatClients: Number,
    newCases: Number,
    revenueGrowth: Number, // percentage
    employeeGrowth: Number
  },
  // Financial summary
  financial: {
    totalBilled: Number,
    totalCollected: Number,
    outstanding: Number,
    avgRevenuePerCase: Number,
    billingRealizationRatio: Number
  },
  // Workforce metrics
  workforce: {
    totalEmployees: Number,
    avgAttendanceRate: Number,
    avgWorkingHours: Number,
    avgBillableHours: Number,
    overtimeHours: Number,
    leaveUtilization: Number
  },
  // Case performance
  casePerformance: {
    activeCases: Number,
    closedCases: Number,
    avgCaseDuration: Number, // days
    casesByStatus: mongoose.Schema.Types.Mixed,
    upcomingHearings: Number
  },
  // Department-wise breakdown
  departments: mongoose.Schema.Types.Mixed,
  // Lawyer-wise performance
  lawyerPerformance: [{
    lawyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    totalBillableHours: Number,
    totalCases: Number,
    revenueGenerated: Number,
    productivityScore: Number
  }]
}, {
  timestamps: true
});

monthlyAnalyticsSchema.index({ year: -1, month: -1 }, { unique: true });

// Department analytics
const departmentAnalyticsSchema = new mongoose.Schema({
  department: {
    type: String,
    enum: ['Legal', 'HR', 'Accounts', 'Admin', 'Support'],
    required: true
  },
  date: { type: Date, required: true },
  // Department-specific metrics
  metrics: {
    totalEmployees: Number,
    attendanceRate: Number,
    tasksCompleted: Number,
    tasksPending: Number,
    avgProductivityScore: Number,
    totalBillableHours: Number,
    revenueGenerated: Number
  }
}, {
  timestamps: true
});

departmentAnalyticsSchema.index({ department: 1, date: -1 });

module.exports = {
  DailyAnalytics: mongoose.model('DailyAnalytics', dailyAnalyticsSchema),
  MonthlyAnalytics: mongoose.model('MonthlyAnalytics', monthlyAnalyticsSchema),
  DepartmentAnalytics: mongoose.model('DepartmentAnalytics', departmentAnalyticsSchema)
};


