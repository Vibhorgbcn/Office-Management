const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');
const SalaryStructure = require('../models/SalaryStructure');
const Attendance = require('../models/Attendance');
const LeaveRequest = require('../models/LeaveRequest');

// @route   POST /api/payroll/generate
// @desc    Generate payroll for employee
// @access  Private/Admin
router.post('/generate', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { employeeId, month, year } = req.body;

    // Check if payroll already exists
    const existing = await Payroll.findOne({ employeeId, month, year });
    if (existing) {
      return res.status(400).json({ message: 'Payroll already generated for this month' });
    }

    // Get employee and salary structure
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const salaryStructure = await SalaryStructure.findOne({
      employeeId,
      isActive: true
    });

    if (!salaryStructure) {
      return res.status(400).json({ message: 'No active salary structure found' });
    }

    // Calculate attendance-based deductions
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const attendanceRecords = await Attendance.find({
      userId: employee.user,
      date: { $gte: startDate, $lte: endDate }
    });

    let totalLateMinutes = 0;
    let totalOvertimeHours = 0;
    let presentDays = 0;

    attendanceRecords.forEach(record => {
      totalLateMinutes += record.lateArrivalMinutes || 0;
      totalOvertimeHours += record.overtimeHours || 0;
      if (record.status === 'present' || record.status === 'half-day') {
        presentDays++;
      }
    });

    // Calculate leave deductions
    const approvedLeaves = await LeaveRequest.find({
      user: employee.user,
      status: 'approved',
      startDate: { $gte: startDate, $lte: endDate }
    });

    let leaveDeduction = 0;
    const workingDaysInMonth = new Date(year, month, 0).getDate();
    const dailyRate = salaryStructure.baseSalary / workingDaysInMonth;

    approvedLeaves.forEach(leave => {
      if (leave.leaveType === 'LWP') { // Leave Without Pay
        leaveDeduction += leave.totalDays * dailyRate;
      }
    });

    // Calculate late deduction (example: 1% per hour late, capped at 10%)
    const lateDeduction = Math.min(
      (totalLateMinutes / 60) * (salaryStructure.baseSalary * 0.01),
      salaryStructure.baseSalary * 0.1
    );

    // Calculate overtime (example: 1.5x hourly rate)
    const hourlyRate = salaryStructure.baseSalary / (workingDaysInMonth * 8);
    const overtimeAmount = totalOvertimeHours * hourlyRate * 1.5;

    // Calculate totals
    const totalAllowances = Object.values(salaryStructure.allowances || {}).reduce((a, b) => a + (b || 0), 0);
    const totalDeductions = Object.values(salaryStructure.deductions || {}).reduce((a, b) => a + (b || 0), 0);
    
    const additionalDeductions = {
      leaveDeduction,
      lateDeduction,
      total: leaveDeduction + lateDeduction
    };

    const totalEarnings = salaryStructure.baseSalary + salaryStructure.variablePay + overtimeAmount + totalAllowances;
    const finalDeductions = totalDeductions + additionalDeductions.total;
    const netSalary = totalEarnings - finalDeductions;

    // Create payroll record
    const payroll = new Payroll({
      employeeId,
      month,
      year,
      baseSalary: salaryStructure.baseSalary,
      variablePay: salaryStructure.variablePay,
      overtimeHours: totalOvertimeHours,
      overtimeAmount,
      allowances: {
        ...salaryStructure.allowances,
        total: totalAllowances
      },
      deductions: {
        ...salaryStructure.deductions,
        ...additionalDeductions,
        total: finalDeductions
      },
      totalEarnings,
      totalDeductions: finalDeductions,
      netSalary,
      status: 'generated'
    });

    await payroll.save();
    const populated = await Payroll.findById(payroll._id)
      .populate('employeeId', 'employeeId designation')
      .populate('employeeId.user', 'name email');

    res.status(201).json(populated);
  } catch (error) {
    console.error('Error generating payroll:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/payroll
// @desc    Get payroll records
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { month, year, employeeId } = req.query;
    const query = {};

    if (req.user.role !== 'admin') {
      const employee = await Employee.findOne({ user: req.user._id });
      if (employee) {
        query.employeeId = employee._id;
      } else {
        return res.json([]);
      }
    } else if (employeeId) {
      query.employeeId = employeeId;
    }

    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);

    const payrolls = await Payroll.find(query)
      .populate('employeeId', 'employeeId designation')
      .populate('employeeId.user', 'name email')
      .sort({ year: -1, month: -1 });

    res.json(payrolls);
  } catch (error) {
    console.error('Error fetching payroll:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/payroll/my-payslips
// @desc    Get my payslips
// @access  Private
router.get('/my-payslips', auth, async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.json([]);
    }

    const payrolls = await Payroll.find({ employeeId: employee._id })
      .sort({ year: -1, month: -1 });

    res.json(payrolls);
  } catch (error) {
    console.error('Error fetching payslips:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/payroll/:id
// @desc    Get payroll details
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const payroll = await Payroll.findById(req.params.id)
      .populate('employeeId', 'employeeId designation')
      .populate('employeeId.user', 'name email');

    if (!payroll) {
      return res.status(404).json({ message: 'Payroll not found' });
    }

    // Check access
    if (req.user.role !== 'admin') {
      const employee = await Employee.findOne({ user: req.user._id });
      if (!employee || payroll.employeeId.toString() !== employee._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    res.json(payroll);
  } catch (error) {
    console.error('Error fetching payroll:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;


