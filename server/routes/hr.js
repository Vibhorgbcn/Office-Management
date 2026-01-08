const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Employee = require('../models/Employee');
const LeaveRequest = require('../models/LeaveRequest');
const LeaveBalance = require('../models/LeaveBalance');
const User = require('../models/User');

// @route   GET /api/hr/employees
// @desc    Get all employees (Admin/HR only)
// @access  Private/Admin
router.get('/employees', auth, async (req, res) => {
  try {
    if (!['admin', 'senior-advocate'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const employees = await Employee.find()
      .populate('user', 'name email phone role designation')
      .populate('reportingManager', 'name designation')
      .populate('salaryStructureId')
      .sort({ createdAt: -1 });

    res.json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/hr/employees
// @desc    Create new employee
// @access  Private/Admin
router.post('/employees', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { userId, employeeId, designation, department, joiningDate, employmentType, reportingManager } = req.body;

    const employee = new Employee({
      user: userId,
      employeeId,
      designation,
      department,
      joiningDate,
      employmentType,
      reportingManager: reportingManager || null
    });

    await employee.save();
    const populated = await Employee.findById(employee._id)
      .populate('user', 'name email phone role')
      .populate('reportingManager', 'name');

    res.status(201).json(populated);
  } catch (error) {
    console.error('Error creating employee:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Employee ID already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/hr/employees/:id
// @desc    Get employee details
// @access  Private
router.get('/employees/:id', auth, async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.params.id })
      .populate('user', 'name email phone role designation')
      .populate('reportingManager', 'name designation')
      .populate('salaryStructureId');

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json(employee);
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/hr/leaves/request
// @desc    Request leave
// @access  Private
router.post('/leaves/request', auth, async (req, res) => {
  try {
    const { leaveType, startDate, endDate, totalDays, reason, attachments } = req.body;

    const leaveRequest = new LeaveRequest({
      user: req.user._id,
      leaveType,
      startDate,
      endDate,
      totalDays,
      reason,
      attachments: attachments || []
    });

    await leaveRequest.save();
    const populated = await LeaveRequest.findById(leaveRequest._id)
      .populate('user', 'name email');

    res.status(201).json(populated);
  } catch (error) {
    console.error('Error creating leave request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/hr/leaves
// @desc    Get leave requests
// @access  Private
router.get('/leaves', auth, async (req, res) => {
  try {
    const query = {};
    if (req.user.role !== 'admin') {
      query.user = req.user._id;
    }

    const leaves = await LeaveRequest.find(query)
      .populate('user', 'name email employeeId designation')
      .populate('approvedBy', 'name')
      .sort({ createdAt: -1 });

    res.json(leaves);
  } catch (error) {
    console.error('Error fetching leaves:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/hr/leaves/:id/approve
// @desc    Approve/reject leave request
// @access  Private/Admin
router.put('/leaves/:id/approve', auth, async (req, res) => {
  try {
    if (!['admin', 'senior-advocate'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { status, rejectionReason } = req.body;
    const leaveRequest = await LeaveRequest.findById(req.params.id);

    if (!leaveRequest) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    leaveRequest.status = status;
    leaveRequest.approvedBy = req.user._id;
    leaveRequest.approvedAt = new Date();
    if (status === 'rejected' && rejectionReason) {
      leaveRequest.rejectionReason = rejectionReason;
    }

    await leaveRequest.save();

    // Update leave balance if approved
    if (status === 'approved') {
      let balance = await LeaveBalance.findOne({
        user: leaveRequest.user,
        leaveType: leaveRequest.leaveType,
        year: new Date().getFullYear()
      });

      if (!balance) {
        // Initialize balance if doesn't exist
        balance = new LeaveBalance({
          user: leaveRequest.user,
          leaveType: leaveRequest.leaveType,
          year: new Date().getFullYear(),
          totalAllocated: 0
        });
      }

      balance.used += leaveRequest.totalDays;
      balance.available = Math.max(0, balance.totalAllocated - balance.used);
      await balance.save();
    }

    const populated = await LeaveRequest.findById(leaveRequest._id)
      .populate('user', 'name email')
      .populate('approvedBy', 'name');

    res.json(populated);
  } catch (error) {
    console.error('Error updating leave request:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/hr/leaves/balance
// @desc    Get leave balance
// @access  Private
router.get('/leaves/balance', auth, async (req, res) => {
  try {
    const balances = await LeaveBalance.find({
      user: req.user._id,
      year: new Date().getFullYear()
    });

    res.json(balances);
  } catch (error) {
    console.error('Error fetching leave balance:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;


