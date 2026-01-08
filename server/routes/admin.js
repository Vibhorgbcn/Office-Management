const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const Department = require('../models/Department');
const { body, validationResult } = require('express-validator');

// @route   POST /api/admin/create-super-admin
// @desc    Create super admin (one-time setup or by existing super-admin)
// @access  Private (First-time setup only, or Super-Admin)
router.post('/create-super-admin', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').optional().trim()
], async (req, res) => {
  try {
    // Check if super-admin already exists (first-time setup check)
    const existingSuperAdmin = await User.findOne({ role: 'super-admin' });
    
    // If super-admin exists, require authentication
    if (existingSuperAdmin && !req.user) {
      return res.status(401).json({ message: 'Authentication required to create super admin' });
    }

    // If authenticated, only super-admin can create another super-admin
    if (req.user && req.user.role !== 'super-admin') {
      return res.status(403).json({ message: 'Only super-admin can create another super-admin' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, phone } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Create super admin user
    const superAdmin = new User({
      name,
      email,
      password,
      phone: phone || '',
      role: 'super-admin',
      isActive: true
    });

    await superAdmin.save();

    // Return user without password
    const userResponse = superAdmin.toObject();
    delete userResponse.password;

    res.status(201).json({
      message: 'Super admin created successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('Error creating super admin:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/admin/assign-sub-admin
// @desc    Assign user as sub-admin to a department
// @access  Private (Super-Admin only)
router.post('/assign-sub-admin', [
  auth,
  body('userId').notEmpty().withMessage('User ID is required'),
  body('departmentId').notEmpty().withMessage('Department ID is required')
], async (req, res) => {
  try {
    if (req.user.role !== 'super-admin') {
      return res.status(403).json({ message: 'Only super-admin can assign sub-admins' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId, departmentId } = req.body;

    // Update user role to sub-admin
    const user = await User.findByIdAndUpdate(
      userId,
      { 
        role: 'sub-admin',
        departmentId: departmentId
      },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update department with sub-admin
    const department = await Department.findByIdAndUpdate(
      departmentId,
      { subAdmin: userId },
      { new: true }
    ).populate('subAdmin', 'name email');

    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }

    res.json({
      message: 'Sub-admin assigned successfully',
      user,
      department
    });
  } catch (error) {
    console.error('Error assigning sub-admin:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/super-admin-status
// @desc    Check if super admin exists
// @access  Public (for first-time setup)
router.get('/super-admin-status', async (req, res) => {
  try {
    const superAdminCount = await User.countDocuments({ role: 'super-admin' });
    res.json({ 
      exists: superAdminCount > 0,
      count: superAdminCount
    });
  } catch (error) {
    console.error('Error checking super admin status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;


