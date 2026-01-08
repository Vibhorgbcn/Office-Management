const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Department = require('../models/Department');
const User = require('../models/User');

// @route   GET /api/departments
// @desc    Get all departments
// @access  Private (Admin/Super-Admin)
router.get('/', auth, async (req, res) => {
  try {
    if (!['super-admin', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const departments = await Department.find()
      .populate('subAdmin', 'name email')
      .populate('employees', 'name email designation');

    res.json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/departments
// @desc    Create department
// @access  Private (Super-Admin)
router.post('/', auth, async (req, res) => {
  try {
    if (req.user.role !== 'super-admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const department = new Department(req.body);
    await department.save();

    const populated = await Department.findById(department._id)
      .populate('subAdmin', 'name email');

    res.status(201).json(populated);
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/departments/:id/assign-subadmin
// @desc    Assign sub-admin to department
// @access  Private (Super-Admin)
router.put('/:id/assign-subadmin', auth, async (req, res) => {
  try {
    if (req.user.role !== 'super-admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { subAdminId } = req.body;
    
    // Update user role to sub-admin
    await User.findByIdAndUpdate(subAdminId, { role: 'sub-admin' });

    const department = await Department.findByIdAndUpdate(
      req.params.id,
      { subAdmin: subAdminId },
      { new: true }
    ).populate('subAdmin', 'name email');

    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    res.json(department);
  } catch (error) {
    console.error('Error assigning sub-admin:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;


